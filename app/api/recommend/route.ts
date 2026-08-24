import { NextResponse } from "next/server";
import { getVillas, getVillaAvailability } from "@/lib/wp";
import type { ReservationPeriod, Villa, VillaACFFields } from "@/types/wordpress";
import type {
  VillaRecommenderAnswers,
  PeopleAnswer,
  AtmosphereAnswer,
  ActivityAnswer,
  NightsAnswer,
} from "@/components/recommender/VillaRecommender";
import type { VillaRecommendationData } from "@/components/recommender/VillaRecommendationResult";
import { getVillaPrimaryImage } from "@/lib/images/villa-images";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ---------------------------------------------------------------------
// TIEMPO DE RESPUESTA — los ~30s reportados venían de DOS pasos que se
// ejecutaban en serie y sin límite de tiempo:
//   1. La llamada a Gemini (a veces tarda 10-20s+ sin ningún timeout, y si
//      fallaba igual había que esperar el error antes de caer al fallback).
//   2. getVillaAvailability(villa.id), que solo se pedía DESPUÉS de saber
//      qué villa ganó — es decir, después de esperar a Gemini completo.
// Con GEMINI_TIMEOUT_MS se pone un límite duro: si Gemini no responde a
// tiempo, se aborta y se usa el texto local (instantáneo, ya determinista)
// en su lugar, en vez de esperar lo que Google tarde. Y la disponibilidad
// de las 4 villas se empieza a pedir en paralelo con Gemini (no después),
// así ese tiempo queda solapado en vez de sumado.
//
// Además, desde que matchLocally() pasó a decidir SIEMPRE la villa (ver
// nota más abajo, antes de POST), Gemini ya no necesita "pensar" cuál
// villa es la mejor — solo redacta un tagline + blurb para la villa que
// ya fue elegida. Es una tarea mucho más liviana que la anterior (donde
// tenía que evaluar las 4 villas y decidir), así que el timeout baja de
// 15s a 10s: si no responde tan rápido, no vale la pena seguir esperando.
const GEMINI_TIMEOUT_MS = 20000;

// ---------------------------------------------------------------------
// IMPORTANTE — esquema ACF real verificado contra
// https://xerox-life-worry.ngrok-free.dev/wp-json/wp/v2/villa (WordPress
// publicado, no el localhost:8881 con datos de prueba). El grupo ACF real
// del CPT "villa" SOLO tiene: title, description_short, description_long,
// image_1-8, suites_count, bedrooms, bathrooms, use_cases, price.
//
// NO existen todavía: minimum_stay_nights, location, amenities, features,
// guests/max_guests/capacity, size_m2 — aunque están declarados como
// opcionales en types/wordpress.ts (por si se agregan más adelante). Este
// archivo NO asume que esos campos vienen llenos: los sigue leyendo por
// si algún día se agregan en WordPress, pero la lógica real de hoy corre
// sobre `use_cases` + descripción, que es donde el equipo de contenido
// está cargando todo (amenities, capacidad de huéspedes, etc.) como texto
// libre.
//
// use_cases llega como un arreglo de strings sueltos, cada uno con coma
// final incluida en el propio texto, ej.:
//   ["infinity pool,", "sunset views,", "beach access,", "12 guests,"]
// en vez de una categoría controlada (family/wedding/corporate/wellness).
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

// Noches "típicas" de cada categoría — se usan tanto en el prompt de
// Gemini como para calcular ventanas de disponibilidad reales del mismo
// largo que el huésped pidió.
const NIGHTS_REFERENCE: Record<NightsAnswer, number> = {
  short: 3,
  week: 7,
  long: 10,
  extended: 15,
};

const BEDROOM_RANGE: Record<PeopleAnswer, [number, number]> = {
  couple: [1, 2],
  small: [2, 3],
  group: [4, 5],
  large: [6, 99],
};

const MIN_GUESTS: Record<PeopleAnswer, number> = {
  couple: 2,
  small: 3,
  group: 5,
  large: 7,
};

// Palabras buscadas dentro de use_cases + description — hoy es la ÚNICA
// fuente real de señal para atmósfera y actividad (location está vacío
// en producción).
const ATMOSPHERE_KEYWORDS: Record<AtmosphereAnswer, string[]> = {
  peaceful: ["quiet", "peaceful", "serene", "serenity", "secluded", "tranquil", "tranquility", "sunset"],
  luxurious: ["luxury", "luxurious", "elegant", "elegance", "opulent", "exclusive", "sophistication", "concierge", "chef"],
  lively: ["vibrant", "lively", "social", "party", "nightlife", "rooftop"],
  rustic: ["rustic", "natural", "jungle", "garden", "authentic", "charm"],
};

const ACTIVITY_KEYWORDS: Record<ActivityAnswer, string[]> = {
  pool: ["pool", "infinity pool", "jacuzzi", "swim"],
  cooking: ["kitchen", "chef", "cooking", "gourmet"],
  exploring: ["garden", "beach access", "view", "balcony", "deck", "pier"],
  dining: ["terrace", "bar", "dining", "rooftop", "lounge"],
};

function normalizeList(field: string[] | string | undefined | null): string[] {
  if (!field) return [];
  const raw = Array.isArray(field) ? field : field.split(/[,;\n]/);
  // Los valores reales de use_cases traen la coma final pegada al texto
  // (ej. "infinity pool,") — se limpia además de trim/lowercase.
  return raw
    .map((v) => v.trim().replace(/,+$/, "").trim().toLowerCase())
    .filter(Boolean);
}

function firstPositiveNumber(values: unknown[]): number | undefined {
  for (const value of values) {
    const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

// Extrae capacidad de huéspedes con la MISMA prioridad que ya usan
// VillaCard.tsx y la página de detalle de villa (para que el recomendador
// nunca muestre un número distinto al resto del sitio):
//   1. Campo dedicado si algún día existe (guests/max_guests/capacity/...)
//   2. Tag de texto tipo "12 guests" dentro de use_cases (así es como el
//      contenido real lo está cargando hoy).
//   3. suites_count * 2 (fallback ya establecido en el resto del sitio).
function getVillaCapacity(acf: VillaACFFields, tags: string[]): number | undefined {
  const dedicated = firstPositiveNumber([acf.guests, acf.max_guests, acf.capacity, acf.capacidad_personas]);
  if (dedicated) return dedicated;

  for (const tag of tags) {
    const match = tag.match(/(\d+)\s*guests?/);
    if (match) return Number(match[1]);
  }

  return acf.suites_count ? acf.suites_count * 2 : undefined;
}

function textHaystack(acf: VillaACFFields, tags: string[]): string {
  return [acf.location, acf.description_short, acf.description_long, tags.join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

// ---------------------------------------------------------------------
// Describe UNA sola villa (ya elegida por matchLocally) para el prompt
// de redacción de Gemini. Antes esto listaba las 4 villas porque Gemini
// tenía que escoger entre ellas — ya no: la decisión de "cuál villa" la
// toma siempre matchLocally() (determinista, instantánea, auditable), y
// Gemini solo entra a escribir el tagline/blurb de la ganadora. Se
// mantiene el mismo detalle de datos (tags/amenities, descripción, etc.)
// para que el texto generado siga siendo específico y no genérico.
// ---------------------------------------------------------------------
function buildVillaLine(v: Villa): string {
  const acf = v.acf;
  const tags = normalizeList(acf.use_cases as string[] | string | undefined);
  const capacity = getVillaCapacity(acf, tags);
  const extraAmenities = [...normalizeList(acf.amenities), ...normalizeList(acf.features)];
  const allTags = [...new Set([...tags, ...extraAmenities])].join(", ") || "N/D";

  return `name: ${v.title.rendered} | ${acf.bedrooms ?? "?"} bedrooms, ${
    acf.bathrooms ?? "?"
  } bathrooms, ${acf.suites_count ?? "?"} suites${capacity ? `, up to ${capacity} guests` : ""}${
    acf.price ? `, from $${acf.price}/night` : ""
  } | tags/amenities: ${allTags} | description: ${acf.description_short || acf.description_long || "N/D"}`;
}

// ---------------------------------------------------------------------
// Prompt de SOLO REDACCIÓN — la villa ya fue decidida por matchLocally()
// antes de llegar acá, así que a Gemini no se le pide elegir nada, solo
// escribir un tagline + blurb llamativo para esa villa puntual. Prompt
// más corto = respuesta más rápida y más barata que la versión anterior
// que tenía que razonar sobre las 4 villas a la vez.
// ---------------------------------------------------------------------
function buildTaglinePrompt(villa: Villa, answers: VillaRecommenderAnswers): string {
  return `You are writing a short, catchy recommendation message for a guest at Coco B Isla, a luxury villa retreat in Isla Mujeres, México. The villa has ALREADY been selected as their best match — your only job is to write the copy for it, not to pick a villa.

GUEST PREFERENCES:
- Group size: ${PEOPLE_LABEL[answers.people]}
- Desired atmosphere: ${ATMOSPHERE_LABEL[answers.atmosphere]}
- Favorite activity: ${ACTIVITY_LABEL[answers.activity]}
- Length of stay: ${NIGHTS_LABEL[answers.nights]}

SELECTED VILLA:
${buildVillaLine(villa)}

Write:
- "tagline": a short, elegant 2-5 word tagline for this villa (e.g. "Serenity by the Sea"), in the aspirational tone of a luxury retreat.
- "blurb": 1-2 sentences (max 40 words) explaining why THIS villa fits THIS guest's preferences specifically. Reference their group size or atmosphere/activity preference naturally, don't just repeat the villa description.

Respond ONLY with a JSON object, no markdown, no backticks, in this exact shape:
{"tagline": "...", "blurb": "..."}`;
}

// ---------------------------------------------------------------------
// Scoring determinista — fallback si Gemini falla/no hay API key, y base
// auditable para el documento de casos de uso (100% reproducible).
//
//   - Tamaño (45 pts): cercanía a la capacidad/recámaras ideales.
//   - Atmósfera (30 pts): keywords de atmósfera en use_cases+descripción.
//   - Actividad (25 pts): keywords de actividad en use_cases+descripción.
//
// La duración de estadía NO se pondera con reglas duras: WordPress no
// tiene hoy un campo de estadía mínima por villa. Si ese campo se agrega
// más adelante, sumar aquí un filtro análogo al de tamaño.
// ---------------------------------------------------------------------
interface VillaScore {
  villa: Villa;
  total: number;
}

function scoreVilla(villa: Villa, answers: VillaRecommenderAnswers): VillaScore {
  const acf = villa.acf;
  const tags = normalizeList(acf.use_cases as string[] | string | undefined);
  const allTags = [...tags, ...normalizeList(acf.amenities), ...normalizeList(acf.features)];
  const haystack = textHaystack(acf, tags);

  // 1. Tamaño (45 pts)
  const capacity = getVillaCapacity(acf, tags);
  let sizeScore: number;
  if (capacity) {
    const targetGuests = MIN_GUESTS[answers.people];
    sizeScore = Math.max(0, 45 - Math.abs(capacity - targetGuests) * 5);
  } else {
    const [min, max] = BEDROOM_RANGE[answers.people];
    const bedrooms = acf.bedrooms ?? 0;
    const distance = bedrooms < min ? min - bedrooms : bedrooms > max ? bedrooms - max : 0;
    sizeScore = Math.max(0, 45 - distance * 8);
  }

  // 2. Atmósfera (30 pts): 30 si aparece en los tags de use_cases/amenities,
  // 15 si solo aparece en la descripción (señal más débil).
  const atmosphereKeywords = ATMOSPHERE_KEYWORDS[answers.atmosphere];
  let atmosphereScore = 0;
  if (atmosphereKeywords.some((kw) => allTags.some((t) => t.includes(kw)))) {
    atmosphereScore = 30;
  } else if (atmosphereKeywords.some((kw) => haystack.includes(kw))) {
    atmosphereScore = 15;
  }

  // 3. Actividad (25 pts): misma lógica de tags vs. descripción.
  const activityKeywords = ACTIVITY_KEYWORDS[answers.activity];
  let activityScore = 0;
  if (activityKeywords.some((kw) => allTags.some((t) => t.includes(kw)))) {
    activityScore = 25;
  } else if (activityKeywords.some((kw) => haystack.includes(kw))) {
    activityScore = 12;
  }

  return { villa, total: sizeScore + atmosphereScore + activityScore };
}

function pickBestVillaText(villa: Villa, answers: VillaRecommenderAnswers): { tagline: string; blurb: string } {
  const acf = villa.acf;
  const tags = normalizeList(acf.use_cases as string[] | string | undefined);
  const matchedAtmosphereTag = ATMOSPHERE_KEYWORDS[answers.atmosphere].find((kw) =>
    tags.some((t) => t.includes(kw))
  );

  const tagline = acf.location
    ? `Serenity in ${acf.location}`
    : matchedAtmosphereTag
      ? `${matchedAtmosphereTag[0].toUpperCase()}${matchedAtmosphereTag.slice(1)} Awaits`
      : "Your Island Escape";

  const groupNote =
    answers.people === "couple"
      ? "an intimate escape for two"
      : answers.people === "large"
        ? "plenty of room for a large group"
        : "the right amount of space for your group";

  const blurb =
    acf.description_short ||
    `${villa.title.rendered} offers ${groupNote}, matched to your preferred ${ATMOSPHERE_LABEL[answers.atmosphere]}.`;

  return { tagline, blurb };
}

// Hash simple y estable (no usa Math.random ni Date) para desempatar sin
// favorecer siempre a la misma villa. Antes, un empate se resolvía
// "menor id gana" — con las 4 villas reales eso hacía que Casa Coco (id
// 55, el más bajo de las 3 villas de 12 suites) ganara EL 100% de sus
// empates contra Casa Lola (id 126) y Casa Encantada (id 128), aunque
// tuvieran exactamente el mismo puntaje. Mismo input → mismo output
// (reproducible para pruebas), pero ya no favorece sistemáticamente a
// una sola villa.
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function matchLocally(
  answers: VillaRecommenderAnswers,
  villas: Villa[]
): { slug: string; tagline: string; blurb: string } {
  if (villas.length === 0) return { slug: "", tagline: "", blurb: "" };

  const scored = villas.map((v) => scoreVilla(v, answers));
  const maxTotal = Math.max(...scored.map((s) => s.total));
  const topByScore = scored.filter((s) => s.total === maxTotal);

  const maxSuites = Math.max(...topByScore.map((s) => s.villa.acf.suites_count ?? 0));
  const finalists = topByScore
    .filter((s) => (s.villa.acf.suites_count ?? 0) === maxSuites)
    .sort((a, b) => a.villa.id - b.villa.id); // orden estable para indexar el hash

  const tieBreakKey = `${answers.people}-${answers.atmosphere}-${answers.activity}-${answers.nights}`;
  const index = finalists.length > 1 ? hashString(tieBreakKey) % finalists.length : 0;

  const picked = finalists[index].villa;
  return { slug: picked.slug, ...pickBestVillaText(picked, answers) };
}

// ---------------------------------------------------------------------
// Disponibilidad real — antes availableDates SIEMPRE se devolvía vacío
// (TODO explícito en el código). Ahora se conecta con
// getVillaAvailability(villaId), que ya usa ReservationPlanner.tsx en la
// página de detalle de villa, y se calculan hasta 3 ventanas libres
// reales del largo que pidió el huésped en el quiz.
// ---------------------------------------------------------------------
function formatDateRange(start: Date, end: Date): string {
  const sameMonthYear = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startFmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(start);
  const endFmt = sameMonthYear
    ? new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(end)
    : new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(end);
  return `${startFmt} – ${endFmt}, ${end.getFullYear()}`;
}

function findAvailableWindows(
  reservations: ReservationPeriod[],
  nights: number,
  count: number
): { range: string; available: boolean }[] {
  const booked = reservations
    .map((r) => ({ start: new Date(r.check_in), end: new Date(r.check_out) }))
    .filter((r) => !Number.isNaN(r.start.getTime()) && !Number.isNaN(r.end.getTime()))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const windows: { range: string; available: boolean }[] = [];
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1); // empieza mañana, no hoy

  let guard = 0;
  while (windows.length < count && guard < 100) {
    guard++;
    const candidateEnd = new Date(cursor);
    candidateEnd.setDate(candidateEnd.getDate() + nights);

    const conflict = booked.find((r) => cursor < r.end && candidateEnd > r.start);
    if (conflict) {
      cursor = new Date(conflict.end);
      continue;
    }

    windows.push({ range: formatDateRange(cursor, candidateEnd), available: true });
    cursor = new Date(candidateEnd);
    cursor.setDate(cursor.getDate() + 7); // deja aire antes de la siguiente ventana sugerida
  }

  return windows;
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

    // Se piden las 4 disponibilidades EN PARALELO con la llamada a Gemini
    // de abajo, no después de saber qué villa ganó. Solo son 4 villas,
    // así que pedirlas todas de una vez es barato y ese tiempo queda
    // solapado en vez de sumado.
    const availabilityByIdPromise = Promise.all(
      villas.map(async (v) => [v.id, await getVillaAvailability(v.id)] as const)
    ).then((entries) => new Map(entries));

    // ---------------------------------------------------------------
    // matchLocally() decide SIEMPRE qué villa es la mejor — ya no es un
    // fallback, es la fuente de verdad. Es instantáneo (sin red) y ya
    // está auditado como reproducible, así que no tiene sentido hacer
    // esperar al huésped a que Gemini "razone" cuál de las 4 villas
    // elegir cuando este scoring determinista ya lo resuelve al vuelo.
    //
    // Gemini pasa a tener un rol más chico: redactar el tagline + blurb
    // llamativo de la villa que YA fue elegida. Esto no puede correr en
    // paralelo con matchLocally() porque necesita saber cuál villa ganó
    // antes de poder escribir sobre ella — pero como matchLocally() no
    // tiene ningún costo de red, en la práctica el tiempo total baja
    // igual: antes se esperaba hasta GEMINI_TIMEOUT_MS por una decisión
    // completa, ahora solo se espera por una redacción corta.
    // ---------------------------------------------------------------
    const localMatch = matchLocally(answers as VillaRecommenderAnswers, villas);
    const villa = villas.find((v) => v.slug === localMatch.slug) || villas[0];

    let picked = { tagline: localMatch.tagline, blurb: localMatch.blurb };

    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY no configurada — usando el texto local de matchLocally().");
    } else {
      try {
        // Timeout duro: si Gemini no contesta en GEMINI_TIMEOUT_MS, se
        // aborta la petición y se usa el texto local instantáneo en vez
        // de esperar lo que Google tarde.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

        let geminiRes: Response;
        try {
          geminiRes = await fetch(GEMINI_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": GEMINI_API_KEY,
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: buildTaglinePrompt(villa, answers as VillaRecommenderAnswers) }],
                },
              ],
              generationConfig: {
                thinkingConfig: { thinkingLevel: "low" },
              },
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!geminiRes.ok) {
          throw new Error(`Gemini respondió ${geminiRes.status}`);
        }

        const data = await geminiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Gemini no devolvió texto.");

        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        // Si Gemini devuelve un tagline/blurb vacío o mal formado, se
        // queda con el texto local ya calculado arriba en vez de romper
        // la respuesta o mostrar un hueco vacío.
        if (typeof parsed?.tagline === "string" && parsed.tagline.trim() && typeof parsed?.blurb === "string" && parsed.blurb.trim()) {
          picked = { tagline: parsed.tagline, blurb: parsed.blurb };
        } else {
          throw new Error("Gemini devolvió un tagline/blurb vacío o con forma inesperada.");
        }
      } catch (err) {
        const reason = err instanceof Error && err.name === "AbortError"
          ? `Gemini no respondió en ${GEMINI_TIMEOUT_MS}ms`
          : err;
        console.error("Error usando Gemini para redactar el mensaje, usando el texto local:", reason);
        // picked ya tiene el texto local de matchLocally() por defecto.
      }
    }

    const acf = villa.acf;
    const image =
      acf.image_1 || acf.image_2 || acf.image_3 || acf.image_4 ||
      acf.image_5 || acf.image_6 || acf.image_7 || acf.image_8;
    const optimizedImage = getVillaPrimaryImage(villa);
    const featuredImage = villa._embedded?.["wp:featuredmedia"]?.[0];
    const tags = normalizeList(acf.use_cases as string[] | string | undefined);
    const estimatedGuests = getVillaCapacity(acf, tags);
    const areaSqm = firstPositiveNumber([acf.size_m2, acf.area_m2, acf.square_meters]);

    // Disponibilidad real: hasta 3 ventanas libres del largo pedido en el
    // quiz. Ya se pidió en paralelo arriba (availabilityByIdPromise), así
    // que aquí solo se espera lo que falte y se toma la de la villa
    // ganadora — no se vuelve a pedir. Si la API de reservas no respondió,
    // se deja vacío en vez de mostrar fechas falsas (mismo criterio que ya
    // seguía este archivo).
    const nightsRequested = NIGHTS_REFERENCE[(answers as VillaRecommenderAnswers).nights];
    const availabilityById = await availabilityByIdPromise;
    const availability = availabilityById.get(villa.id) ?? { reservations: [], isAvailable: false };
    const availableDates = availability.isAvailable
      ? findAvailableWindows(availability.reservations, nightsRequested, 3)
      : [];

    const result: VillaRecommendationData = {
      id: villa.id,
      slug: villa.slug,
      name: villa.title.rendered,
      tagline: picked.tagline || "Your Island Escape",
      blurb: picked.blurb || acf.description_short || "",
      image: optimizedImage
        ? {
            url: optimizedImage.cardSrc,
            alt: optimizedImage.alt || villa.title.rendered,
            width: optimizedImage.cardWidth,
            height: optimizedImage.cardHeight,
            srcSet: optimizedImage.srcSet,
          }
        : image
          ? { url: image.url, alt: image.alt || villa.title.rendered }
        : featuredImage?.source_url
          ? {
              url: featuredImage.source_url,
              alt: featuredImage.alt_text || villa.title.rendered,
              width: featuredImage.media_details?.width,
              height: featuredImage.media_details?.height,
            }
          : null,
      stats: {
        ...(areaSqm ? { areaSqm } : {}),
        bedrooms: acf.bedrooms,
        bathrooms: acf.bathrooms,
        ...(estimatedGuests ? { estimatedGuests } : {}),
      },
      availableDates,
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
