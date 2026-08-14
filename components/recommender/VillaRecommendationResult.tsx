"use client";

/**
 * components/recommender/VillaRecommendationResult.tsx
 *
 * Pantalla final del Villa Recommender — se muestra después de
 * "Analyzing your preferences." Recibe la respuesta ya resuelta de
 * app/api/recommend (villa elegida por matching determinista + copy
 * generado por IA) y la renderiza siguiendo el Figma.
 */

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

export interface VillaRecommendationData {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  blurb: string;
  image: { url: string; alt?: string } | null;
  stats: {
    bedrooms?: number;
    bathrooms?: number;
    estimatedGuests?: number;
  };
  availableDates: { range: string; available: boolean }[];
}

interface VillaRecommendationResultProps {
  data: VillaRecommendationData;
  onClose?: () => void;
  onStartOver?: () => void;
  className?: string;
}

export default function VillaRecommendationResult({
  data,
  onClose,
  onStartOver,
  className = "",
}: VillaRecommendationResultProps) {
  const { name, tagline, blurb, image, stats, availableDates } = data;

  return (
    <div
      style={{ width: 384, maxWidth: "100%" }}
      className={`mx-auto flex max-h-[85vh] flex-col overflow-y-auto rounded-md bg-background p-5 shadow-card ${className}`}
    >
      {/* Top bar */}
      <div className="mb-3 flex shrink-0 items-center justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-6 w-6 items-center justify-center rounded-full text-secondary transition-colors hover:bg-chip-alt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="shrink-0 text-center">
        <p className="text-heading text-primary">VILLA RECOMMENDER</p>
        <span className="mx-auto mt-1.5 block h-px w-8 bg-primary" />
      </div>

      <p className="text-caption mt-4 shrink-0 text-center font-semibold uppercase tracking-wide text-muted">
        Your Recommended Villa
      </p>

      {/* Imagen */}
      <div className="relative mt-3 aspect-4/3 w-full shrink-0 overflow-hidden rounded-md">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || name}
            fill
            sizes="384px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-chip-alt text-caption text-muted">
            No image available
          </div>
        )}
      </div>

      {/* Nombre + tagline */}
      <div className="mt-4 shrink-0 text-center">
        <h2 className="text-card-heading uppercase tracking-widest text-secondary">
          {name}
        </h2>
        <p className="text-tagline italic text-muted">{tagline}</p>
      </div>

      {/* Blurb */}
      <p className="text-card-body mt-3 shrink-0 text-secondary">{blurb}</p>

      {/* Stats */}
      <div className="mt-4 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-4 text-label uppercase text-primary">
        {stats.estimatedGuests && <span>Up to {stats.estimatedGuests} Guests</span>}
        {stats.bedrooms && <span>{stats.bedrooms} Bedrooms</span>}
        {stats.bathrooms && <span>{stats.bathrooms} Bathrooms</span>}
      </div>

      {/* Fechas disponibles */}
      <p className="text-toggle mt-4 shrink-0 uppercase text-secondary">
        Available Dates
      </p>
      <div className="mt-2 flex shrink-0 flex-col gap-2">
        {availableDates.map((d) => (
          <div
            key={d.range}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2.5"
          >
            <span className="text-caption text-secondary">{d.range}</span>
            <span
              className={`text-caption ${d.available ? "text-primary" : "text-muted"}`}
            >
              {d.available ? "Available" : "Booked"}
            </span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="mt-5 flex shrink-0 flex-col items-center gap-3">
        <Link
          href={`/villas/${data.slug}`}
          className="text-button block w-full rounded-md bg-secondary py-3 text-center uppercase text-white"
        >
          Inquire Here
        </Link>
        <button
          type="button"
          onClick={onStartOver}
          className="text-toggle uppercase text-muted underline underline-offset-2"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}