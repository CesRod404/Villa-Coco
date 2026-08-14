/**
 * components/testimonials/Testimonials.tsx
 * Carrusel con auto-rotación: cambia de testimonio solo cada
 * AUTOPLAY_MS milisegundos. Si el usuario usa las flechas, el
 * temporizador se reinicia (para no saltar justo después de que
 * interactúa). Se detiene solo si hay 0 o 1 testimonio.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TestimonialCard from "./TestimonialCard";
import type { Testimonial, Villa } from "@/types/wordpress";

const AUTOPLAY_MS = 5000;

export default function Testimonials({
  testimonios,
  villas = [],
}: {
  testimonios: Testimonial[];
  villas?: Villa[];
}) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goPrev = () => setIndex((i) => (i === 0 ? testimonios.length - 1 : i - 1));
  const goNext = () => setIndex((i) => (i === testimonios.length - 1 ? 0 : i + 1));

  // Auto-avanza cada AUTOPLAY_MS. Se reinicia cada vez que "index" cambia
  // (incluyendo cuando cambia por un clic manual en las flechas), así el
  // usuario siempre tiene el tiempo completo antes del próximo salto.
  useEffect(() => {
    if (testimonios.length <= 1) return;

    timerRef.current = setInterval(() => {
      setIndex((i) => (i === testimonios.length - 1 ? 0 : i + 1));
    }, AUTOPLAY_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, testimonios.length]);

  const handlePrev = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    goPrev();
  };

  const handleNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    goNext();
  };

  if (testimonios.length === 0) {
    return null;
  }

  const count = testimonios.length;
  const villaNameById = new Map(villas.map((v) => [v.id, v.title.rendered]));
  const villaNameFor = (t: Testimonial) =>
    t.acf.related_villa_id ? villaNameById.get(t.acf.related_villa_id) : undefined;

  const current = testimonios[index];
  const prevIndex = index === 0 ? count - 1 : index - 1;
  const nextIndex = index === count - 1 ? 0 : index + 1;

  return (
    <section className="space-y-8 bg-white py-16 text-center">
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-primary" />
          <p className="text-eyebrow uppercase text-primary">What People Say About</p>
          <span className="h-px w-8 bg-primary" />
        </div>
        <h2 className="text-section uppercase text-secondary">Coco B</h2>
      </div>

      {/* Carrusel de 3 cards: mismo ancho base para las 3 (consistente), la
          activa solo crece un poco (scale) para destacar, en vez de tener
          un tamaño de card distinto — ver diseño de Figma de la sección
          Testimonials. En mobile solo se muestra la card activa para no
          apretar el layout. */}
      <div className="flex items-center justify-center gap-4 overflow-hidden px-4">
        {count > 2 && (
          <div className="hidden w-72 shrink-0 md:block">
            <TestimonialCard
              testimonio={testimonios[prevIndex]}
              villaName={villaNameFor(testimonios[prevIndex])}
              variant="peek"
            />
          </div>
        )}

        {/* key={current.id} fuerza a React a re-montar la card en cada
            cambio, lo que dispara la transición de fade de abajo */}
        <div key={current.id} className="w-72 shrink-0 animate-[fadein_0.4s_ease]">
          <TestimonialCard testimonio={current} villaName={villaNameFor(current)} variant="active" />
        </div>

        {count > 1 && (
          <div className="hidden w-72 shrink-0 md:block">
            <TestimonialCard
              testimonio={testimonios[nextIndex]}
              villaName={villaNameFor(testimonios[nextIndex])}
              variant="peek"
            />
          </div>
        )}
      </div>

      {count > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrev}
            aria-label="Testimonio anterior"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-navy-soft bg-chip-alt text-navy-soft"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            aria-label="Siguiente testimonio"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-navy-soft bg-chip-alt text-navy-soft"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}