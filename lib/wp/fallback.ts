import snapshot from "@/data/wordpress-fallback.json";
import type { Testimonial, Villa } from "@/types/wordpress";

type WordpressFallbackSnapshot = {
  generatedAt: string;
  villas: Villa[];
  testimonials: Testimonial[];
};

// El JSON conserva campos adicionales de la REST API de WordPress. Validamos
// su forma con las pruebas del snapshot y aquí lo reducimos al contrato que
// consume la aplicación.
const fallback = snapshot as unknown as WordpressFallbackSnapshot;

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function getWordpressFallback<T>(endpoint: string): T[] | null {
  const [pathname, queryString = ""] = endpoint.split("?");
  const searchParams = new URLSearchParams(queryString);

  if (pathname === "/villa") {
    const slug = searchParams.get("slug");
    const villas = slug
      ? fallback.villas.filter((villa) => villa.slug === slug)
      : fallback.villas;
    return clone(villas) as T[];
  }

  if (pathname === "/testimonio") {
    return clone(fallback.testimonials) as T[];
  }

  return null;
}

export const WORDPRESS_FALLBACK_GENERATED_AT = fallback.generatedAt;
