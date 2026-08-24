import { Villa, Retreat, Package, Testimonial, FAQ, ReservationPeriod, VillaAvailability, AcfImageField } from "../../types/wordpress";
import { unstable_rethrow } from "next/navigation";
import { getWordpressFallback } from "./fallback";

export const WORDPRESS_BASE_URL = process.env.WORDPRESS_API_URL || process.env.WORDPRESS_PUBLIC_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || "http://localhost:8881";
const BASE_URL = WORDPRESS_BASE_URL;
const API_URL = `${BASE_URL}/wp-json/wp/v2`;
const RESERVATIONS_API_URL = `${BASE_URL}/wp-json/villa-coco/v1`;
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "1" };

const WORDPRESS_MEDIA_PROXY_PATH = "/api/wordpress-media/";

// ---------------------------------------------------------------------
// CACHÉ — antes TODO usaba cache: "no-store", así que cada carga de
// página repetía absolutamente todas las peticiones a WordPress desde
// cero (villa list, cada imagen, disponibilidad...), sin importar que
// nada hubiera cambiado. Contra un WordPress detrás de ngrok donde cada
// petición individual mide 3-5 segundos, eso es lo que estaba causando
// los ~60s de carga. Ahora se usa el cache de datos de Next.js con
// revalidate: contenido que casi no cambia (villas, medios) se cachea
// varios minutos; disponibilidad (que sí debe verse fresca) se cachea
// solo unos segundos.
const CONTENT_REVALIDATE_SECONDS = 120; // villas, retiros, paquetes, testimonios, FAQs
const MEDIA_REVALIDATE_SECONDS = 300; // imágenes casi nunca cambian una vez subidas
const AVAILABILITY_REVALIDATE_SECONDS = 20; // disponibilidad sí debe verse razonablemente fresca
const WORDPRESS_REQUEST_TIMEOUT_MS = 12_000;

export type WordpressDataSource = "wordpress" | "fallback";

export type WordpressDataResult<T> = {
    data: T;
    source: WordpressDataSource;
};

function normalizeUrls(obj: any): any{
    if(typeof obj === "string"){
        return obj
            .replace(/(?:https?:)?\/\/[^/\s"']+\/wp-content\//gi, WORDPRESS_MEDIA_PROXY_PATH)
            .replaceAll("/wp-content/", WORDPRESS_MEDIA_PROXY_PATH);
    }

    if(Array.isArray(obj)){
        return obj.map(normalizeUrls);
    }

    if (obj && typeof obj === "object") {
        for (const key in obj) {
        obj[key] = normalizeUrls(obj[key]);
        }
    }

    return obj;

}

// Garantiza el contrato real de AcfImageField: devuelve null si el campo
// viene vacío, sea como false, null, {}, o { url: "" }. Centralizar esto
// aquí evita que cada consumidor (route.ts, VillaCard, etc.) tenga que
// reinventar su propia validación — y que alguno se le olvide, como pasó
// con el recomendador de villas (bug: <Image src="" /> en
// VillaRecommendationResult.tsx).
function normalizeImageField(field: any): AcfImageField | null {
    if (typeof field === "string" && field.trim() !== "") {
        return { url: normalizeUrls(field), alt: "" };
    }
    if (field && typeof field === "object" && typeof field.url === "string" && field.url.trim() !== "") {
        return {
            url: normalizeUrls(field.url),
            alt: field.alt || "",
            width: Number(field.width) || undefined,
            height: Number(field.height) || undefined,
        };
    }
    return null;
}

function collectRawImageIds(villa: Villa): number[] {
    // Los campos ACF están tipados como AcfImageField | null (nunca number),
    // pero en runtime WordPress puede devolver el ID numérico crudo cuando
    // el Return Format de ACF es "Image ID". Se tipa el array como
    // unknown[] para que el type predicate `field is number` sea válido —
    // si se dejara como (AcfImageField | null | undefined)[], TypeScript
    // rechaza el predicado porque number no es subtipo de ese union
    // (TS2322 / TS2677, que es justo lo que rompía `npm run prod`).
    const rawFields: unknown[] = [
        villa.acf?.image_1,
        villa.acf?.image_2,
        villa.acf?.image_3,
        villa.acf?.image_4,
        villa.acf?.image_5,
        villa.acf?.image_6,
        villa.acf?.image_7,
        villa.acf?.image_8,
    ];
    return rawFields.filter(
        (field): field is number => typeof field === "number" && Number.isInteger(field) && field > 0
    );
}

// ---------------------------------------------------------------------
// Resuelve TODOS los IDs de imagen crudos de una sola pasada, en UNA
// sola petición a /wp/v2/media?include[]=... — antes cada villa hacía
// hasta 8 peticiones separadas (una por image_1..image_8) vía
// resolveMediaImage(), y con getVillas() cargando las 4 villas eso podía
// llegar a 16 peticiones, cada una de 3-5s contra este WordPress. El
// causante real: en ACF los campos image_1-8 están devolviendo el ID
// numérico crudo en vez del objeto de imagen (Return Format = "Image
// ID" en vez de "Image Array"/"Image URL") — cambiar eso en WordPress
// eliminaría esta llamada por completo, pero mientras tanto esto la deja
// en 1 sola petición sin importar cuántas villas/imágenes haya.
async function resolveMediaImagesBatch(ids: number[]): Promise<Map<number, AcfImageField | null>> {
    const resolved = new Map<number, AcfImageField | null>();
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return resolved;

    try {
        const params = uniqueIds.map((id) => `include[]=${id}`).join("&");
        const res = await fetch(`${API_URL}/media?${params}&per_page=${uniqueIds.length}`, {
            next: { revalidate: MEDIA_REVALIDATE_SECONDS },
            headers: NGROK_HEADERS,
        });
        if (!res.ok) return resolved;

        const items = await res.json();
        for (const item of Array.isArray(items) ? items : []) {
            const url = normalizeUrls(item?.source_url ?? null);
            if (!url) continue;
            resolved.set(item.id, {
                url,
                alt: item?.alt_text || "",
                width: Number(item?.media_details?.width) || undefined,
                height: Number(item?.media_details?.height) || undefined,
            });
        }
    } catch (error) {
        unstable_rethrow(error);
        console.error("No se pudo resolver el batch de imágenes de WordPress:", error);
    }

    return resolved;
}

function applyResolvedImages(villa: Villa, resolved: Map<number, AcfImageField | null>): Villa {
    const resolveField = (field: unknown): AcfImageField | null => {
        const normalized = normalizeImageField(field);
        if (normalized) return normalized;
        if (typeof field === "number" && Number.isInteger(field) && field > 0) {
            return resolved.get(field) ?? null;
        }
        return null;
    };

    return {
        ...villa,
        acf: {
            ...villa.acf,
            image_1: resolveField(villa.acf?.image_1),
            image_2: resolveField(villa.acf?.image_2),
            image_3: resolveField(villa.acf?.image_3),
            image_4: resolveField(villa.acf?.image_4),
            image_5: resolveField(villa.acf?.image_5),
            image_6: resolveField(villa.acf?.image_6),
            image_7: resolveField(villa.acf?.image_7),
            image_8: resolveField(villa.acf?.image_8),
        },
    };
}

// Helper genérico para peticiones a la API REST de WordPress
async function fetchWPWithSource<T>(endpoint: string): Promise<WordpressDataResult<T[]>> {
    const url = `${API_URL}${endpoint}`;
    const fallback = getWordpressFallback<T>(endpoint);
    try {
        const res = await fetch(url, {
            next: { revalidate: CONTENT_REVALIDATE_SECONDS },
            headers: NGROK_HEADERS,
            signal: AbortSignal.timeout(WORDPRESS_REQUEST_TIMEOUT_MS),
        });

        if (!res.ok) {
            console.error(`Error en API WordPress (${url}): ${res.status} ${res.statusText}`);
            return {
                data: fallback ?? [],
                source: fallback ? "fallback" : "wordpress",
            };
        }

        const data = await res.json();

        const normalized = normalizeUrls(data);
        return {
            data: Array.isArray(normalized) ? normalized : [normalized],
            source: "wordpress",
        };
    } catch (error) {
        unstable_rethrow(error);
        console.error(`No se pudo conectar a WordPress en ${url}:`, error);
        return {
            data: fallback ?? [],
            source: fallback ? "fallback" : "wordpress",
        };
    }
}

async function fetchWP<T>(endpoint: string): Promise<T[]> {
    return (await fetchWPWithSource<T>(endpoint)).data;
}

// Resuelve un ID de media de WordPress a su URL pública. Se usa cuando un
// campo ACF de tipo Image devuelve el ID crudo en vez de la URL (pasa con
// author_photo, sin importar el Return Format configurado en ACF).
async function resolveMediaUrl(mediaId: number): Promise<string | null> {
    try {
        const res = await fetch(`${API_URL}/media/${mediaId}`, {
            next: { revalidate: MEDIA_REVALIDATE_SECONDS },
            headers: NGROK_HEADERS,
        });
        if (!res.ok) return null;
        const data = await res.json();
        return normalizeUrls(data?.source_url ?? null);
    } catch (error) {
        unstable_rethrow(error);
        return null;
    }
}

// 1. Villas (villa)
export async function getVillasWithSource(): Promise<WordpressDataResult<Villa[]>> {
    const result = await fetchWPWithSource<Villa>("/villa?_embed");
    const resolved = await resolveMediaImagesBatch(result.data.flatMap(collectRawImageIds));
    return {
        data: result.data.map((villa) => applyResolvedImages(villa, resolved)),
        source: result.source,
    };
}

export async function getVillas(): Promise<Villa[]> {
    return (await getVillasWithSource()).data;
}

export async function getVillaBySlugWithSource(slug: string): Promise<WordpressDataResult<Villa | null>> {
    const result = await fetchWPWithSource<Villa>(`/villa?slug=${encodeURIComponent(slug)}&_embed`);
    const villa = result.data[0];
    if (!villa) return { data: null, source: result.source };
    const resolved = await resolveMediaImagesBatch(collectRawImageIds(villa));
    return { data: applyResolvedImages(villa, resolved), source: result.source };
}

export async function getVillaBySlug(slug: string): Promise<Villa | null> {
    return (await getVillaBySlugWithSource(slug)).data;
}

export async function getVillaReservations(villaId: number): Promise<ReservationPeriod[]> {
    return (await getVillaAvailability(villaId)).reservations;
}

export async function getVillaAvailability(villaId: number): Promise<VillaAvailability> {
    try {
        const response = await fetch(`${RESERVATIONS_API_URL}/villas/${villaId}/reservations`, {
            next: { revalidate: AVAILABILITY_REVALIDATE_SECONDS },
            headers: NGROK_HEADERS,
        });
        if (!response.ok) return { reservations: [], isAvailable: false };
        return { reservations: await response.json(), isAvailable: true };
    } catch (error) {
        unstable_rethrow(error);
        console.error("No se pudo cargar la disponibilidad de la villa:", error);
        return { reservations: [], isAvailable: false };
    }
}

// 2. Retiros (retiro) — slug real en WordPress: "retiro"
export async function getRetreats(): Promise<Retreat[]> {
    return fetchWP<Retreat>("/retiro?_embed");
}

export async function getRetreatBySlug(slug: string): Promise<Retreat | null> {
    const retreats = await fetchWP<Retreat>(`/retiro?slug=${encodeURIComponent(slug)}&_embed`);
    return retreats[0] || null;
}

// 3. Paquetes (paquete) — slug real en WordPress: "paquete"
export async function getPackages(): Promise<Package[]> {
    return fetchWP<Package>("/paquete?_embed");
}

// 4. Testimonios (testimonio) — slug real en WordPress: "testimonio"
export async function getTestimonialsWithSource(): Promise<WordpressDataResult<Testimonial[]>> {
    const result = await fetchWPWithSource<Testimonial>("/testimonio?_embed");

    // Resuelve author_photo cuando llega como número (ID de attachment),
    // en paralelo para no encadenar los fetches uno por uno.
    const data = await Promise.all(
        result.data.map(async (t) => {
            const photo = t.acf?.author_photo;
            if (typeof photo === "number") {
                const url = await resolveMediaUrl(photo);
                return { ...t, acf: { ...t.acf, author_photo: url ?? undefined } };
            }
            return t;
        })
    );

    return { data, source: result.source };
}

export async function getTestimonials(): Promise<Testimonial[]> {
    return (await getTestimonialsWithSource()).data;
}

// 5. Preguntas Frecuentes (faq)
export async function getFAQs(category?: string): Promise<FAQ[]> {
    const query = category ? `&category=${encodeURIComponent(category)}` : "";
    return fetchWP<FAQ>(`/faq?_embed${query}`);
}
