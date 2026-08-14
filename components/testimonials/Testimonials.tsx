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

  const villaNameById = new Map(villas.map((v) => [v.id, v.title.rendered]));
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

      {/* key={current.id} fuerza a React a re-montar la card en cada
          cambio, lo que dispara la transición de fade de abajo */}
      <div key={current.id} className="animate-[fadein_0.4s_ease]">
        <TestimonialCard testimonio={current} villaName={villaName} />
      </div>

      {testimonios.length > 1 && (
        <>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrev}
              aria-label="Testimonio anterior"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-chip-alt text-navy-soft"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              aria-label="Siguiente testimonio"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-chip-alt text-navy-soft"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* puntitos de posición, útil para que el usuario vea cuántos hay */}
          <div className="flex justify-center gap-1.5">
            {testimonios.map((t, i) => (
              <span
                key={t.id}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === index ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}