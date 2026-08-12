import { Villa, Retreat, Package, Testimonial, FAQ, ReservationPeriod, VillaAvailability } from "../../types/wordpress";

export const WORDPRESS_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_API_URL || "http://localhost:8881";
const BASE_URL = WORDPRESS_BASE_URL;
const API_URL = `${BASE_URL}/wp-json/wp/v2`;
const RESERVATIONS_API_URL = `${BASE_URL}/wp-json/villa-coco/v1`;


function normalizeUrls(obj: any): any{
    if(typeof obj === "string"){
        return obj
            .replace("https://localhost:8881", BASE_URL)
            .replace("https://localhost:8881", BASE_URL);
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

// 1. Villas (villa)
export async function getVillas(): Promise<Villa[]> {
    return fetchWP<Villa>("/villa?_embed");
}

export async function getVillaBySlug(slug: string): Promise<Villa | null> {
    const villas = await fetchWP<Villa>(`/villa?slug=${encodeURIComponent(slug)}&_embed`);
    return villas[0] || null;
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
    return fetchWP<Testimonial>("/testimonio?_embed");
}

// 5. Preguntas Frecuentes (faq)
export async function getFAQs(category?: string): Promise<FAQ[]> {
    const query = category ? `&category=${encodeURIComponent(category)}` : "";
    return fetchWP<FAQ>(`/faq?_embed${query}`);
}
