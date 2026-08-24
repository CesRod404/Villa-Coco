"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ResponsiveVillaImage } from "@/lib/images/villa-images";
import styles from "./VillaGallery.module.css";

export type VillaGalleryImage = ResponsiveVillaImage;

type VillaGalleryProps = {
  images: VillaGalleryImage[];
  title: string;
  href: string;
};

function ResilientImage({
  image,
  alt,
  thumbnail = false,
}: {
  image: VillaGalleryImage;
  alt: string;
  thumbnail?: boolean;
}) {
  const primarySrc = thumbnail ? image.thumbSrc : image.src;
  const [src, setSrc] = useState(image.fallbackSrc || primarySrc);

  useEffect(() => {
    setSrc(image.fallbackSrc || primarySrc);
    if (!image.fallbackSrc || image.fallbackSrc === primarySrc) return;

    const candidate = new window.Image();
    candidate.onload = () => setSrc(primarySrc);
    candidate.src = primarySrc;
    return () => {
      candidate.onload = null;
    };
  }, [image.fallbackSrc, primarySrc]);

  const isPrimary = src === primarySrc;
  return (
    <img
      src={src}
      srcSet={!thumbnail && isPrimary ? image.srcSet : undefined}
      sizes={thumbnail ? "80px" : "(max-width: 767px) 100vw, (max-width: 1120px) calc(100vw - 48px), 594px"}
      alt={alt}
      width={thumbnail ? image.thumbWidth : image.width}
      height={thumbnail ? image.thumbHeight : image.height}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function VillaGallery({ images, title, href }: VillaGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (!images.length) {
    return (
      <div className={styles.gallery}>
        <div className={styles.empty}>Images coming soon</div>
      </div>
    );
  }

  const activeIndex = Math.min(selected, images.length - 1);
  const activeImage = images[activeIndex];

  return (
    <div className={styles.gallery}>
      <Link
        href={href}
        className={styles.mainImage}
        aria-label={`Ver disponibilidad de ${title}`}
      >
        <ResilientImage image={activeImage} alt={activeImage.alt || title} />
      </Link>

      <div className={styles.thumbnails} aria-label={`${title} image gallery`}>
        {images.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            onClick={() => setSelected(index)}
            aria-label={`Show image ${index + 1} of ${images.length}`}
            aria-pressed={activeIndex === index}
            className={`${styles.thumbnail} ${
              activeIndex === index ? styles.thumbnailActive : ""
            }`}
          >
            <ResilientImage image={image} alt="" thumbnail />
          </button>
        ))}
      </div>
    </div>
  );
}
