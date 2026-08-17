"use client";

import Link from "next/link";
import { Bath, BedDouble, ChevronDown, Users } from "lucide-react";
import type { Villa } from "@/types/wordpress";
import VillaGallery, { type VillaGalleryImage } from "./VillaGallery";
import styles from "./VillaCard.module.css";

function plainText(value?: string) {
  if (!value) return "";

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#8217;|&rsquo;/gi, "’")
    .replace(/&quot;/gi, '"')
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã/g, "Á")
    .replace(/Ã‰/g, "É")
    .replace(/Ã/g, "Í")
    .replace(/Ã“/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã‘/g, "Ñ")
    .replace(/Â/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImages(villa: Villa): VillaGalleryImage[] {
  const images: VillaGalleryImage[] = [];
  const addImage = (image?: VillaGalleryImage | null) => {
    const src = image?.src?.trim();

    if (!src || images.some((existing) => existing.src === src)) return;

    images.push({ src, alt: image?.alt || "" });
  };

  const featured = villa._embedded?.["wp:featuredmedia"]?.[0];

  if (featured?.source_url) {
    addImage({
      src: featured.source_url,
      alt: featured.alt_text || "",
    });
  }

  for (const image of [
    villa.acf?.image_1,
    villa.acf?.image_2,
    villa.acf?.image_3,
    villa.acf?.image_4,
  ]) {
    if (image?.url) addImage({ src: image.url, alt: image.alt });
  }

  // Conserva compatibilidad con villas que todavía usen el campo Gallery de ACF Pro.
  const gallery = villa.acf?.gallery;
  if (Array.isArray(gallery)) {
    for (const image of gallery) {
      const normalized =
        typeof image === "string"
          ? { src: image, alt: "" }
          : { src: image.url || image.src || "", alt: image.alt || "" };

      addImage(normalized);
    }
  }

  return images;
}

function firstPositiveNumber(values: unknown[]) {
  for (const value of values) {
    const number =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value.replace(/[^0-9.]/g, ""))
          : Number.NaN;

    if (Number.isFinite(number) && number > 0) return number;
  }

  return undefined;
}

function normalizeAmenities(villa: Villa) {
  const acf = villa.acf;
  const source = acf.amenities || acf.features || acf.use_cases || [];

  const amenities = (Array.isArray(source) ? source : [source])
    .flatMap((value) => String(value).split(","))
    .map((value) => value.replace(/[_-]+/g, " ").trim())
    .filter(Boolean);

  return Array.from(new Set(amenities)).slice(0, 8);
}

export default function VillaCard({ villa }: { villa: Villa }) {
  const title = plainText(villa.title?.rendered) || "Villa";
  const villaName = title.replace(/^Casa\s+/i, "") || title;
  const excerpt =
    villa.acf?.description_short ||
    villa.excerpt?.rendered ||
    villa.content?.rendered ||
    "A private island retreat designed for meaningful stays.";
  const description = plainText(excerpt);
  const images = extractImages(villa);
  const acf = villa.acf;
  const guests =
    firstPositiveNumber([
      acf.guests,
      acf.max_guests,
      acf.capacity,
      acf.capacidad_personas,
    ]) || (acf.suites_count ? acf.suites_count * 2 : undefined);
  const bedrooms = firstPositiveNumber([acf.bedrooms, acf.habitaciones]);
  const bathrooms = firstPositiveNumber([acf.bathrooms, acf.banos]);
  const price = firstPositiveNumber([
    acf.price,
    acf.precio,
    acf.nightly_rate,
    acf.price_per_night,
  ]);
  const amenities = normalizeAmenities(villa);
  const detailHref = `/villas/${villa.slug}`;

  return (
    <article className={styles.card} aria-labelledby={`villa-${villa.id}-title`}>
      <VillaGallery images={images} title={title} href={detailHref} />

      <div className={styles.content}>
        <div className={styles.heading}>
          <span className={styles.kicker}>Casa</span>
          <h3 id={`villa-${villa.id}-title`}>
            <Link href={detailHref}>{villaName}</Link>
          </h3>
        </div>

        <div className={styles.descriptionBlock}>
          <p>{description}</p>
          <Link href={detailHref} className={styles.readMore}>
            <ChevronDown aria-hidden="true" size={14} strokeWidth={2.5} />
            <span>Read more</span>
          </Link>
        </div>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <Users aria-hidden="true" size={22} strokeWidth={2.2} />
            <dt className={styles.visuallyHidden}>Guests</dt>
            <dd>{guests || "—"} guests</dd>
          </div>
          <div className={styles.stat}>
            <BedDouble aria-hidden="true" size={22} strokeWidth={2.2} />
            <dt className={styles.visuallyHidden}>Bedrooms</dt>
            <dd>{bedrooms || "—"} bedrooms</dd>
          </div>
          <div className={styles.stat}>
            <Bath aria-hidden="true" size={22} strokeWidth={2.2} />
            <dt className={styles.visuallyHidden}>Bathrooms</dt>
            <dd>{bathrooms || "—"} bathrooms</dd>
          </div>
        </dl>

        <div className={styles.amenities} aria-label="Villa features">
          {amenities.map((amenity) => (
            <span key={amenity}>{amenity}</span>
          ))}
        </div>

        <div className={styles.booking}>
          <div className={styles.price}>
            {price ? (
              <>
                <span>From</span>
                <strong>${price.toLocaleString("en-US")}</strong>
                <span>/ night + taxes</span>
              </>
            ) : (
              <strong className={styles.priceOnRequest}>Rate upon request</strong>
            )}
          </div>

          <Link href={`${detailHref}#reservation`} className={styles.inquire}>
            Inquire here
          </Link>
        </div>
      </div>
    </article>
  );
}
