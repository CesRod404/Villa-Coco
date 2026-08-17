import { NextResponse } from "next/server";
import { getVillas } from "@/lib/wp";
import type { Villa } from "@/types/wordpress";
import type {
  VillaRecommenderAnswers,
  PeopleAnswer,
  AtmosphereAnswer,
  ActivityAnswer,
  NightsAnswer,
} from "@/components/recommender/VillaRecommender";
import type { VillaRecommendationData } from "@/components/recommender/VillaRecommendationResult";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ---------------------------------------------------------------------
// Traducciones legibles de las respuestas del quiz, para el prompt de
// Gemini (el modelo entiende mejor "a peaceful, quiet retreat" que
// el valor crudo "peaceful").
// ---------------------------------------------------------------------
const PEOPLE_LABEL: Record<PeopleAnswer, string> = {
  couple: "just the two of them",
  small: "a small group of 3-4 people",
  group: "a group of 5-6 people",
  large: "a large group of 7 or more people",
};

const ATMOSPHERE_LABEL: Record<AtmosphereAnswer, string> = {
  peaceful: "a peaceful, quiet retreat",
  lively: "a lively and social atmosphere",
  luxurious: "a luxurious and elegant experience",
  rustic: "a rustic, natural feel",
};

const ACTIVITY_LABEL: Record<ActivityAnswer, string> = {
  pool: "swimming and relaxing by the pool",
  cooking: "cooking with local produce",
  exploring: "exploring the surroundings",
  dining: "dining out and nightlife",
};

const NIGHTS_LABEL: Record<NightsAnswer, string> = {
  short: "a short 3-4 night stay",
  week: "a one week stay",
  long: "a 10-14 night stay",
  extended: "an extended stay of more than two weeks",
};

// ---------------------------------------------------------------------
// Construye el bloque de contexto con las villas reales de WordPress —
// Gemini SOLO ve esto, nunca inventa villas ni datos.
// ---------------------------------------------------------------------
function buildVillasContext(villas: Villa[]): string {
  return villas
    .map((v) => {
      const acf = v.acf;
      return `- slug: "${v.slug}" | name: ${v.title.rendered} | ${acf.bedrooms ?? "?"} bedrooms, ${
        acf.bathrooms ?? "?"
      } bathrooms, ${acf.suites_count ?? "?"} suites | location: ${
        acf.location || "N/D"
      } | description: ${acf.description_short || acf.description_long || "N/D"}`;
    })
    .join("\n");
}

function buildPrompt(answers: VillaRecommenderAnswers, villas: Villa[]): string {
  return `You are matching a guest to the best villa for their stay at Coco B Isla, a luxury villa retreat in Isla Mujeres, México.

GUEST PREFERENCES:
- Group size: ${PEOPLE_LABEL[answers.people]}
- Desired atmosphere: ${ATMOSPHERE_LABEL[answers.atmosphere]}
- Favorite activity: ${ACTIVITY_LABEL[answers.activity]}
- Length of stay: ${NIGHTS_LABEL[answers.nights]}

AVAILABLE VILLAS (only choose from this real list, never invent a villa):
${buildVillasContext(villas)}

Pick the single best-matching villa's slug from the list above. Then write:
- "tagline": a short, elegant 2-5 word tagline for this villa (e.g. "Serenity by the Sea"), in the aspirational tone of a luxury retreat.
- "blurb": 1-2 sentences (max 40 words) explaining why THIS villa fits THIS guest's preferences specifically. Reference their group size or atmosphere/activity preference naturally, don't just repeat the villa description.

Respond ONLY with a JSON object, no markdown, no backticks, in this exact shape:
{"slug": "the-chosen-villa-slug", "tagline": "...", "blurb": "..."}`;
}

// ---------------------------------------------------------------------
// Fallback determinista si Gemini falla o no hay API key — no bloquea
// la demo por un problema de red o cuota.
// ---------------------------------------------------------------------
function matchLocally(
  answers: VillaRecommenderAnswers,
  villas: Villa[]
): { slug: string; tagline: string; blurb: string } {
  // Heurística simple: para grupos grandes, prioriza más suites/bedrooms;
  // para parejas, prioriza la villa más íntima (menos bedrooms).
  const sorted = [...villas].sort(
    (a, b) => (a.acf.bedrooms ?? 0) - (b.acf.bedrooms ?? 0)
  );

  const wantsLarge = answers.people === "group" || answers.people === "large";
  const picked = wantsLarge ? sorted[sorted.length - 1] : sorted[0];

  if (!picked) {
    return { slug: "", tagline: "", blurb: "" };
  }

  return {
    slug: picked.slug,
    tagline: picked.acf.location ? `Serenity in ${picked.acf.location}` : "Your Island Escape",
    blurb:
      picked.acf.description_short ||
      picked.acf.description_long?.slice(0, 140) ||
      "A beautiful retreat waiting for you at Coco B Isla.",
  };
}

export async function POST(req: Request) {
  try {
    const answers = (await req.json()) as Partial<VillaRecommenderAnswers>;

    if (!answers?.people || !answers?.atmosphere || !answers?.activity || !answers?.nights) {
      return NextResponse.json(
        { error: "Faltan respuestas del quiz en la solicitud." },
        { status: 400 }
      );
    }

    const villas = await getVillas();
    if (villas.length === 0) {
      return NextResponse.json(
        { error: "No hay villas cargadas en WordPress todavía." },
        { status: 503 }
      );
    }

    let picked = { slug: "", tagline: "", blurb: "" };

    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY no configurada — usando matchLocally().");
      picked = matchLocally(answers as VillaRecommenderAnswers, villas);
    } else {
      try {
        const geminiRes = await fetch(GEMINI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: buildPrompt(answers as VillaRecommenderAnswers, villas) }],
              },
            ],
            generationConfig: {
              thinkingConfig: { thinkingLevel: "low" },
            },
          }),
        });

        if (!geminiRes.ok) {
          throw new Error(`Gemini respondió ${geminiRes.status}`);
        }

        const data = await geminiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Gemini no devolvió texto.");

        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        // Verifica que el slug que devolvió Gemini exista de verdad en
        // WordPress — si Gemini alucina un slug, cae al fallback local
        // en vez de romper la respuesta.
        const exists = villas.some((v) => v.slug === parsed.slug);
        if (!exists) throw new Error(`Slug "${parsed.slug}" no existe en WordPress.`);

        picked = parsed;
      } catch (err) {
        console.error("Error usando Gemini, usando matchLocally():", err);
        picked = matchLocally(answers as VillaRecommenderAnswers, villas);
      }
    }

    const villa = villas.find((v) => v.slug === picked.slug) || villas[0];
    const acf = villa.acf;
    const image = acf.image_1 || acf.image_2 || acf.image_3 || acf.image_4;
    const featuredImage = villa._embedded?.["wp:featuredmedia"]?.[0];

    const result: VillaRecommendationData = {
      id: villa.id,
      slug: villa.slug,
      name: villa.title.rendered,
      tagline: picked.tagline || "Your Island Escape",
      blurb: picked.blurb || acf.description_short || "",
      image: image
        ? { url: image.url, alt: image.alt || villa.title.rendered }
        : featuredImage?.source_url
          ? {
              url: featuredImage.source_url,
              alt: featuredImage.alt_text || villa.title.rendered,
            }
          : null,
      stats: {
        bedrooms: acf.bedrooms,
        bathrooms: acf.bathrooms,
        // TODO: no existe un campo "guest_capacity" real en el CPT Villa
        // todavía — se omite en vez de inventar un número.
      },
      // TODO: conectar con getVillaAvailability(villa.id) para calcular
      // rangos de fechas reales disponibles. Por ahora vacío en vez de
      // mostrar fechas falsas — VillaRecommendationResult.tsx maneja
      // bien un arreglo vacío (no renderiza nada en esa sección).
      availableDates: [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en /api/recommend:", error);
    return NextResponse.json(
      { error: "Could not get a recommendation." },
      { status: 500 }
    );
  }
}
