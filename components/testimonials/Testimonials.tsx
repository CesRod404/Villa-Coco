/**
 * components/testimonials/Testimonials.tsx
 * Client Component. Recibe testimonios Y villas ya resueltos desde
 * app/(site)/page.tsx (Server Component) — así puede resolver
 * related_villa_id (número) al nombre real de la villa sin hacer un
 * fetch adicional en el cliente.
 */
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TestimonialCard from "./TestimonialCard";
import type { Testimonial, Villa } from "@/types/wordpress";

export default function Testimonials({
  testimonios,
  villas = [],
}: {
  testimonios: Testimonial[];
  villas?: Villa[];
}) {
  const [index, setIndex] = useState(0);

  if (testimonios.length === 0) {
    return null; // estado vacío
  }

  const villaNameById = new Map(villas.map((v) => [v.id, v.title.rendered]));

  const goPrev = () => setIndex((i) => (i === 0 ? testimonios.length - 1 : i - 1));
  const goNext = () => setIndex((i) => (i === testimonios.length - 1 ? 0 : i + 1));

  const current = testimonios[index];
  const villaName = current.acf.related_villa_id
    ? villaNameById.get(current.acf.related_villa_id)
    : undefined;

  return (
    <section className="space-y-8 py-16 text-center">
      <div className="space-y-2">
        <p className="text-eyebrow uppercase text-primary">What People Say About</p>
        <h2 className="text-section uppercase text-secondary">Coco B</h2>
      </div>

      <TestimonialCard testimonio={current} villaName={villaName} />

      {testimonios.length > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={goPrev}
            aria-label="Testimonio anterior"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-chip-alt text-navy-soft"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goNext}
            aria-label="Siguiente testimonio"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-chip-alt text-navy-soft"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}