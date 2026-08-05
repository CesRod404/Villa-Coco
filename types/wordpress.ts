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
    featured_media?: number;
    _embedded?: {
        "wp:featuredmedia"?: Array<{
            source_url: string;
            alt_text?: string;
        }>;
    };
    acf: ACFType;
}

// 1. Villa (villa)
export interface VillaACFFields {
    description_short: string;
    description_long: string;
    gallery?: string[] | Array<{ url: string }>;
    suites_count: number;
    minimum_stay_nights: number;
    bedrooms: number;
    bathrooms: number;
    location: string;
    use_cases: Array<"family" | "wedding" | "corporate" | "wellness" | string>;
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
    author_name: string;
    author_context?: string;
    author_photo?: string | number;
    related_villa_id?: number;
    related_retreat_id?: number;
}

export type Testimonial = WPPost<TestimonialACFFields>;

// 5. FAQ (faq)
export interface FAQACFFields {
    question?: string;
    answer: string;
    category?: "villa" | "retreat" | "general" | string;
}

export type FAQ = WPPost<FAQACFFields>;
