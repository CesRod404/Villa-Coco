"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./VillaGallery.module.css";

export type VillaGalleryImage = {
  src: string;
  alt?: string;
};

type VillaGalleryProps = {
  images: VillaGalleryImage[];
  title: string;
  href: string;
};

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
        <img
          src={activeImage.src}
          alt={activeImage.alt || title}
          loading="lazy"
        />
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
            <img src={image.src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
