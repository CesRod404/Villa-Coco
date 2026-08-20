// Base WordPress Post Response
export interface WPPost<ACFType> {
    id: number;
    slug: string;
    date?: string;
    title: {
        rendered: string;
    };
    content?: {
        rendered: string;
    };
    excerpt?: {
        rendered: string;
    };
    featured_media?: number;
    _embedded?: {
        "wp:featuredmedia"?: Array<{
            source_url: string;
            alt_text?: string;
            media_details?: {
                width?: number;
                height?: number;
            };
        }>;
    };
    acf: ACFType;
}

// ACF "Image" field con Return Format = "Image Array" devuelve un objeto
// como { url, alt, sizes, ... }, o null/false si el campo está vacío.
export interface AcfImageField {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
}

// 1. Villa (villa)
export interface VillaACFFields {
    description_short: string;
    description_long: string;
    gallery?: string | string[] | Array<{ url?: string; src?: string; alt?: string }>;
    image_1?: AcfImageField | null;
    image_2?: AcfImageField | null;
    image_3?: AcfImageField | null;
    image_4?: AcfImageField | null;
    suites_count: number;
    minimum_stay_nights: number;
    bedrooms: number;
    bathrooms: number;
    location: string;
    use_cases: Array<"family" | "wedding" | "corporate" | "wellness" | string>;
    amenities?: string[] | string;
    features?: string[] | string;
    guests?: number;
    max_guests?: number;
    capacity?: number;
    capacidad_personas?: number;
    habitaciones?: number;
    banos?: number;
    price?: number | string;
    precio?: number | string;
    nightly_rate?: number | string;
    price_per_night?: number | string;
}

export type Villa = WPPost<VillaACFFields>;

// 2. Retiro (retreat)
export interface RetreatACFFields {
    retreat_type: "yoga" | "culinary" | "women" | "fitness" | "corporate" | string;
    start_date: string;
    end_date: string;
    capacity: number;
    spots_left: number;
    host_name?: string;
    description: string;
    price_indicative?: number;
    related_villa_id?: number;
}

export type Retreat = WPPost<RetreatACFFields>;

// 3. Paquete (package)
export interface PackageACFFields {
    description: string;
    includes: string;
    duration: string;
    related_villa_id?: number;
    related_retreat_id?: number;
}

export type Package = WPPost<PackageACFFields>;

// 4. Testimonio (testimonial)
export interface TestimonialACFFields {
    quote: string;
    lugar?: string;
    fecha?: string;
    author_name: string;
    author_context?: string;
    author_photo?: string | number | { url?: string; alt?: string };
    rating?: number;
    related_villa_id?: number | number[];
    related_retreat_id?: number | number[];
}

export type Testimonial = WPPost<TestimonialACFFields>;

// 5. FAQ (faq)
export interface FAQACFFields {
    question?: string;
    answer: string;
    category?: "villa" | "retreat" | "general" | string;
}

export type FAQ = WPPost<FAQACFFields>;

export interface ReservationPeriod {
    id: number;
    check_in: string;
    check_out: string;
}

export interface VillaAvailability {
    reservations: ReservationPeriod[];
    isAvailable: boolean;
}
