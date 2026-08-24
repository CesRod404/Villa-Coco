"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import styles from "./TestimonialCarousel.module.css";

export type TestimonialCardData = {
  id: number;
  quote: string;
  authorName: string;
  context?: string;
  photo?: string;
  villaName?: string;
  rating?: number;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function TestimonialCarousel({ testimonials }: { testimonials: TestimonialCardData[] }) {
  const [active, setActive] = useState(0);

  if (!testimonials.length) {
    return (
      <p className={styles.empty}>
        Guest stories will appear here as soon as they are published in WordPress.
      </p>
    );
  }

  const visibleCount = Math.min(3, testimonials.length);
  const offset = visibleCount === 1 ? 0 : visibleCount === 2 ? 0 : -1;
  const visible = Array.from({ length: visibleCount }, (_, index) => {
    const itemIndex = (active + index + offset + testimonials.length) % testimonials.length;
    return { item: testimonials[itemIndex], itemIndex };
  });

  function move(direction: number) {
    setActive((current) => (current + direction + testimonials.length) % testimonials.length);
  }

  return (
    <div className={styles.carousel}>
      <div className={styles.cards}>
        {visible.map(({ item, itemIndex }, index) => {
          const centered = visibleCount === 1 || index === Math.floor(visibleCount / 2);
          const rating = Math.max(1, Math.min(5, item.rating || 5));

          return (
            <article
              key={`${item.id}-${itemIndex}`}
              className={`${styles.card} ${centered ? styles.featured : ""}`}
            >
              {item.photo ? (
                <img
                  className={styles.avatar}
                  src={item.photo}
                  alt=""
                  width={70}
                  height={70}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className={styles.avatarFallback} aria-hidden="true">
                  {initials(item.authorName)}
                </span>
              )}

              <div className={styles.author}>
                <h3>{item.authorName}</h3>
                {item.context ? <p>{item.context}</p> : null}
              </div>

              <blockquote>{item.quote}</blockquote>

              <footer>
                <span>{item.villaName || "Villa Coco"}</span>
                <span className={styles.rating} aria-label={`${rating} out of 5 stars`}>
                  {Array.from({ length: rating }, (_, star) => (
                    <Star key={star} aria-hidden="true" size={16} fill="currentColor" />
                  ))}
                </span>
              </footer>
            </article>
          );
        })}
      </div>

      {testimonials.length > 1 ? (
        <div className={styles.controls}>
          <button type="button" onClick={() => move(-1)} aria-label="Previous testimonial">
            <ArrowLeft aria-hidden="true" size={24} />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next testimonial">
            <ArrowRight aria-hidden="true" size={24} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
