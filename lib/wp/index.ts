import { Villa, Retreat, Package, Testimonial, FAQ, ReservationPeriod, VillaAvailability, AcfImageField } from "../../types/wordpress";
import { unstable_rethrow } from "next/navigation";

export const WORDPRESS_BASE_URL = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || "http://localhost:8881";
const BASE_URL = WORDPRESS_BASE_URL;
const API_URL = `${BASE_URL}/wp-json/wp/v2`;
const RESERVATIONS_API_URL = `${BASE_URL}/wp-json/villa-coco/v1`;
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "1" };

const WORDPRESS_MEDIA_PROXY_PATH = "/api/wordpress-media/";


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

async function normalizeVillaImages(
    villa: Villa,
    mediaRequests = new Map<number, Promise<AcfImageField | null>>()
): Promise<Villa> {
    const resolveImageField = async (field: unknown): Promise<AcfImageField | null> => {
        const normalized = normalizeImageField(field);
        if (normalized) return normalized;

        if (typeof field !== "number" || !Number.isInteger(field) || field <= 0) {
            return null;
        }

        let request = mediaRequests.get(field);
        if (!request) {
            request = resolveMediaImage(field);
            mediaRequests.set(field, request);
        }

        return request;
    };

    const [image_1, image_2, image_3, image_4] = await Promise.all([
        resolveImageField(villa.acf?.image_1),
        resolveImageField(villa.acf?.image_2),
        resolveImageField(villa.acf?.image_3),
        resolveImageField(villa.acf?.image_4),
    ]);

    return {
        ...villa,
        acf: {
            ...villa.acf,
            image_1,
            image_2,
            image_3,
            image_4,
        },
    };
}

// Helper genérico para peticiones a la API REST de WordPress
async function fetchWP<T>(endpoint: string): Promise<T[]> {
    const url = `${API_URL}${endpoint}`;
    try {
        const res = await fetch(url, {
            cache: "no-store",
            headers: NGROK_HEADERS,
        });

        if (!res.ok) {
            console.error(`Error en API WordPress (${url}): ${res.status} ${res.statusText}`);
            return [];
        }

        const data = await res.json();

        const normalized = normalizeUrls(data);
        return Array.isArray(normalized) ? normalized : [normalized];
    } catch (error) {
        unstable_rethrow(error);
        console.error(`No se pudo conectar a WordPress en ${url}:`, error);
        return [];
    }
}

// Resuelve un ID de media de WordPress a su URL pública. Se usa cuando un
// campo ACF de tipo Image devuelve el ID crudo en vez de la URL (pasa con
// author_photo, sin importar el Return Format configurado en ACF).
async function resolveMediaUrl(mediaId: number): Promise<string | null> {
    try {
        const res = await fetch(`${API_URL}/media/${mediaId}`, {
            cache: "no-store",
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

async function resolveMediaImage(mediaId: number): Promise<AcfImageField | null> {
    try {
        const res = await fetch(`${API_URL}/media/${mediaId}`, {
            cache: "no-store",
            headers: NGROK_HEADERS,
        });
        if (!res.ok) return null;

        const data = await res.json();
        const url = normalizeUrls(data?.source_url ?? null);
        if (!url) return null;

        return {
            url,
            alt: data?.alt_text || "",
            width: Number(data?.media_details?.width) || undefined,
            height: Number(data?.media_details?.height) || undefined,
        };
    } catch (error) {
        unstable_rethrow(error);
        return null;
    }
}

// 1. Villas (villa)
export async function getVillas(): Promise<Villa[]> {
    const villas = await fetchWP<Villa>("/villa?_embed");
    const mediaRequests = new Map<number, Promise<AcfImageField | null>>();
    return Promise.all(villas.map((villa) => normalizeVillaImages(villa, mediaRequests)));
}

export async function getVillaBySlug(slug: string): Promise<Villa | null> {
    const villas = await fetchWP<Villa>(`/villa?slug=${encodeURIComponent(slug)}&_embed`);
    const villa = villas[0];
    return villa ? await normalizeVillaImages(villa) : null;
}

export async function getVillaReservations(villaId: number): Promise<ReservationPeriod[]> {
    return (await getVillaAvailability(villaId)).reservations;
}

export async function getVillaAvailability(villaId: number): Promise<VillaAvailability> {
    try {
        const response = await fetch(`${RESERVATIONS_API_URL}/villas/${villaId}/reservations`, {
            cache: "no-store",
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
export async function getTestimonials(): Promise<Testimonial[]> {
    const testimonials = await fetchWP<Testimonial>("/testimonio?_embed");

    // Resuelve author_photo cuando llega como número (ID de attachment),
    // en paralelo para no encadenar los fetches uno por uno.
    return Promise.all(
        testimonials.map(async (t) => {
            const photo = t.acf?.author_photo;
            if (typeof photo === "number") {
                const url = await resolveMediaUrl(photo);
                return { ...t, acf: { ...t.acf, author_photo: url ?? undefined } };
            }
            return t;
        })
    );
}

// 5. Preguntas Frecuentes (faq)
export async function getFAQs(category?: string): Promise<FAQ[]> {
    const query = category ? `&category=${encodeURIComponent(category)}` : "";
    return fetchWP<FAQ>(`/faq?_embed${query}`);
}
