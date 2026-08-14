import { Villa, Retreat, Package, Testimonial, FAQ, ReservationPeriod, VillaAvailability, AcfImageField } from "../../types/wordpress";

export const WORDPRESS_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_API_URL || "http://localhost:8881";
const BASE_URL = WORDPRESS_BASE_URL;
const API_URL = `${BASE_URL}/wp-json/wp/v2`;
const RESERVATIONS_API_URL = `${BASE_URL}/wp-json/villa-coco/v1`;


function normalizeUrls(obj: any): any{
    if(typeof obj === "string"){
        return obj.replace(/https?:\/\/(localhost|127\.0\.0\.1):8881/g, BASE_URL);
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
    if (field && typeof field === "object" && typeof field.url === "string" && field.url.trim() !== "") {
        return { url: field.url, alt: field.alt || "" };
    }
    return null;
}

function normalizeVillaImages(villa: Villa): Villa {
    return {
        ...villa,
        acf: {
            ...villa.acf,
            image_1: normalizeImageField(villa.acf?.image_1),
            image_2: normalizeImageField(villa.acf?.image_2),
            image_3: normalizeImageField(villa.acf?.image_3),
        },
    };
}

// Helper genérico para peticiones a la API REST de WordPress
async function fetchWP<T>(endpoint: string): Promise<T[]> {
    const url = `${API_URL}${endpoint}`;
    try {
        const res = await fetch(url, {
            cache: "no-store",
        });

        if (!res.ok) {
            console.error(`Error en API WordPress (${url}): ${res.status} ${res.statusText}`);
            return [];
        }

        const data = await res.json();

        const normalized = normalizeUrls(data);
        return Array.isArray(normalized) ? normalized : [normalized];
    } catch (error) {
        console.error(`No se pudo conectar a WordPress en ${url}:`, error);
        return [];
    }
}

// Resuelve un ID de media de WordPress a su URL pública. Se usa cuando un
// campo ACF de tipo Image devuelve el ID crudo en vez de la URL (pasa con
// author_photo, sin importar el Return Format configurado en ACF).
async function resolveMediaUrl(mediaId: number): Promise<string | null> {
    try {
        const res = await fetch(`${API_URL}/media/${mediaId}`, { cache: "no-store" });
        if (!res.ok) return null;
        const data = await res.json();
        return normalizeUrls(data?.source_url ?? null);
    } catch {
        return null;
    }
}

// 1. Villas (villa)
export async function getVillas(): Promise<Villa[]> {
    const villas = await fetchWP<Villa>("/villa?_embed");
    return villas.map(normalizeVillaImages);
}

export async function getVillaBySlug(slug: string): Promise<Villa | null> {
    const villas = await fetchWP<Villa>(`/villa?slug=${encodeURIComponent(slug)}&_embed`);
    const villa = villas[0];
    return villa ? normalizeVillaImages(villa) : null;
}

export async function getVillaReservations(villaId: number): Promise<ReservationPeriod[]> {
    return (await getVillaAvailability(villaId)).reservations;
}

export async function getVillaAvailability(villaId: number): Promise<VillaAvailability> {
    try {
        const response = await fetch(`${RESERVATIONS_API_URL}/villas/${villaId}/reservations`, { cache: "no-store" });
        if (!response.ok) return { reservations: [], isAvailable: false };
        return { reservations: await response.json(), isAvailable: true };
    } catch (error) {
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