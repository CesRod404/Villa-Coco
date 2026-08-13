"use client";

import { useState } from "react";
import VillaGallery from "./VillaGallery";
import Link from "next/link";
import { Villa } from "../../types/wordpress";

function stripHtml(html?: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

function extractImages(villa: Villa) {
  const images: { src: string; alt?: string }[] = [];
  const candidates = [villa.acf?.image_1, villa.acf?.image_2, villa.acf?.image_3];
  for (const field of candidates) {
    if (field && field.url) {
      images.push({ src: field.url, alt: field.alt || "" });
    }
  }
  if (images.length === 0) {
    const featured = villa._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    const featuredAlt = villa._embedded?.["wp:featuredmedia"]?.[0]?.alt_text || "";
    if (featured) images.push({ src: featured, alt: featuredAlt });
  }
  return images;
}

// TODO: "Wi-Fi included / private pool / parking lot / Chef upon request" del
// Figma NO es un campo de WordPress todavía — no existe amenities en el ACF.
// Mientras se agrega ese campo (o se decide usar use_cases en su lugar),
// se deja como lista estática para no bloquear el home visualmente.
// Avisar a César / decidir en el próximo sync antes de la demo.
const STATIC_AMENITIES_PLACEHOLDER = [
  "Wi-Fi included",
  "private pool",
  "parking lot",
  "Chef upon request",
];

export default function VillaCard({ villa }: { villa: Villa }) {
  const [expanded, setExpanded] = useState(false);

  const title = villa.title?.rendered || "Untitled";
  const description =
    villa.acf?.description_short || stripHtml((villa as any).excerpt?.rendered || villa.content?.rendered || "");
  const images = extractImages(villa);

  return (
    <article className="overflow-hidden rounded-md bg-white shadow-card">
      <VillaGallery images={images} title={title} />

      <div className="p-5">
        <h3
          className="text-card-heading uppercase text-secondary"
          dangerouslySetInnerHTML={{ __html: title }}
        />

        <p className={`mt-2 text-card-body text-foreground ${expanded ? "" : "line-clamp-3"}`}>
          {description}
        </p>
        {description.length > 140 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-toggle uppercase text-primary"
          >
            {expanded ? "Read Less" : "Read More"}
          </button>
        )}

        {/* Stats — solo con campos que SÍ existen en WordPress */}
        <div className="mt-4 flex items-center gap-4 text-stat text-secondary">
          {villa.acf?.bedrooms && <span>{villa.acf.bedrooms} bedrooms</span>}
          {villa.acf?.bathrooms && <span>{villa.acf.bathrooms} bathrooms</span>}
          {villa.acf?.suites_count && <span>{villa.acf.suites_count} suites</span>}
        </div>

        {/* Amenidades — placeholder estático, ver TODO arriba */}
        <div className="mt-3 flex flex-wrap gap-2">
          {STATIC_AMENITIES_PLACEHOLDER.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-chip px-3 py-1 text-caption text-chip-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {villa.acf?.precio && (
          <p className="mt-4 text-price text-secondary">
            From ${villa.acf.precio}
            <span className="ml-1 text-price-suffix text-muted">/ night + taxes</span>
          </p>
        )}

        <Link
          href={`/villas/${villa.slug}`}
          className="mt-4 block bg-secondary py-4 text-center text-button uppercase text-white"
        >
          Inquire Here
        </Link>
      </div>
    </article>
  );
}