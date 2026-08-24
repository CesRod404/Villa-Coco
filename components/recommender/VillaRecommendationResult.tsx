"use client";

/**
 * components/recommender/VillaRecommendationResult.tsx
 *
 * Pantalla final del Villa Recommender — se muestra después de
 * "Analyzing your preferences." Recibe la respuesta ya resuelta de
 * app/api/recommend (villa elegida por matching determinista + copy
 * generado por IA) y la renderiza siguiendo el Figma.
 *
 * Fila de stats corregida para seguir el Figma exactamente: metraje (m²)
 * → recámaras → huéspedes, en ese orden. Antes mostraba huéspedes →
 * recámaras → baños (orden distinto y sin metraje). El metraje solo se
 * pinta si WordPress lo trae — no existe todavía como campo ACF real, así
 * que por ahora se omite en vez de inventar un número (ver route.ts).
 */

import Link from "next/link";
import { X } from "lucide-react";
import styles from "./VillaRecommender.module.css";

export interface VillaRecommendationData {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  blurb: string;
  image: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    srcSet?: string;
  } | null;
  stats: {
    // Solo se puebla si WordPress tiene un campo de metraje cargado
    // (size_m2 / area_m2 / square_meters) — no existe todavía en el ACF
    // real, así que hoy este stat se omite en el card en vez de inventar
    // un número, igual que con el resto de los stats.
    areaSqm?: number;
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
    <div className={`${styles.modal} ${styles.resultModal} ${className}`}>
      {/* Top bar */}
      <div className={styles.topBar} style={{ justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={styles.iconButton}
        >
          <X size={22} />
        </button>
      </div>

      <div>
        <p className={styles.heading}>VILLA RECOMMENDER</p>
        <span className={styles.headingLine} />
      </div>

      <p className={styles.resultLabel}>
        Your Recommended Villa
      </p>

      {/* Imagen */}
      <div className={styles.resultImage}>
        {image ? (
          <img
            src={image.url}
            srcSet={image.srcSet}
            sizes="(max-width: 767px) calc(100vw - 80px), 384px"
            alt={image.alt || name}
            width={image.width || 600}
            height={image.height || 400}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[#53667b]">
            No image available
          </div>
        )}
      </div>

      {/* Nombre + tagline */}
      <div>
        <h2 className={styles.resultName}>
          {name}
        </h2>
        <p className={styles.resultTagline}>{tagline}</p>
      </div>

      {/* Blurb */}
      <p className={styles.resultBlurb}>{blurb}</p>

      {/* Stats — orden del Figma: metraje, recámaras, huéspedes */}
      <div className={styles.resultStats}>
        {stats.areaSqm && <span>{stats.areaSqm} M²</span>}
        {stats.bedrooms && <span>{stats.bedrooms} Bedrooms</span>}
        {stats.estimatedGuests && <span>Up to {stats.estimatedGuests} Guests</span>}
      </div>

      {/* Fechas disponibles */}
      <p className={styles.availableTitle}>
        Available Dates
      </p>
      <div className={styles.dateList}>
        {availableDates.map((d) => (
          <div
            key={d.range}
            className={styles.dateRow}
          >
            <span>{d.range}</span>
            <span
              className={d.available ? styles.available : ""}
            >
              {d.available ? "Available" : "Booked"}
            </span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className={styles.resultActions}>
        <Link
          href={`/villas/${data.slug}`}
          className={styles.primaryLink}
        >
          Inquire Here
        </Link>
        <button
          type="button"
          onClick={onStartOver}
          className={styles.startOver}
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
