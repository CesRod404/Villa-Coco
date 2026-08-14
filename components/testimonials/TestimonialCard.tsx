/**
 * components/testimonials/TestimonialCard.tsx
 */

import Image from "next/image";
import { Star } from "lucide-react";
import type { Testimonial } from "@/types/wordpress";

// Soporta los 3 posibles Return Format de un campo Image de ACF:
// "Image URL" (string), "Image Array" (objeto {url, alt, ...}), o
// "Image ID" (number, sin resolver aquí — cae al placeholder).
function resolvePhotoUrl(photo: unknown): string | null {
  if (typeof photo === "string" && photo.trim() !== "") return photo;
  if (photo && typeof photo === "object" && "url" in photo) {
    const url = (photo as { url?: string }).url;
    return url && url.trim() !== "" ? url : null;
  }
  return null;
}

export default function TestimonialCard({
  testimonio,
  villaName,
  variant = "active",
}: {
  testimonio: Testimonial;
  villaName?: string;
  // "active" = card central (blanca, elevada); "peek" = cards laterales
  // atenuadas del carrusel, ver diseño de Figma de la sección Testimonials.
  variant?: "active" | "peek";
}) {
  const { quote, author_name, author_context, rating, author_photo } = testimonio.acf;
  const photoUrl = resolvePhotoUrl(author_photo);
  const isActive = variant === "active";

  return (
    <div
      className={`mx-auto w-full origin-center rounded-md p-6 text-center transition-all duration-300 ${
        isActive
          ? "scale-105 bg-white shadow-card"
          : "scale-100 bg-chip-alt opacity-80 shadow-none"
      }`}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={author_name}
          width={70}
          height={70}
          className="mx-auto mb-4 rounded-full object-cover shadow-elevated"
        />
      ) : (
        <div className="mx-auto mb-4 h-[70px] w-[70px] rounded-full bg-surface shadow-elevated" />
      )}

      <p className="text-testimonial-name text-secondary">{author_name}</p>
      {author_context && (
        <p className="text-testimonial-meta text-ink-soft">{author_context}</p>
      )}

      {/* break-words evita que texto largo sin espacios (ej. datos de prueba,
          URLs) se desborde de la card */}
      <p className="mt-4 break-words text-left text-body text-foreground">{quote}</p>

      <div className="mt-4 flex items-center justify-between gap-2">
        {villaName ? (
          <span className="rounded-full border border-navy-soft bg-transparent px-3 py-1 text-chip text-navy-soft">
            {villaName}
          </span>
        ) : (
          <span />
        )}

        {typeof rating === "number" && (
          <div className="flex shrink-0 gap-0.5" aria-label={`${rating} de 5 estrellas`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < rating ? "fill-primary text-primary" : "fill-none text-border"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}