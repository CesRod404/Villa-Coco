/**
 * app/(site)/testimonials/page.tsx
 * Carrusel horizontal con scroll-snap: la card activa queda centrada y
 * completa, las cards vecinas se asoman cortadas a los lados — igual al
 * patrón del Figma. Es scroll nativo (swipe en mobile), sin JS extra.
 *
 * TODO: el Figma tiene bloques de color de fondo alternados (durazno/azul
 * claro) detrás de cada card — no tenemos esos hex confirmados todavía,
 * así que por ahora todo el carrusel usa un solo fondo (--surface).
 */

import { getVillas, getTestimonials } from "@/lib/wp";
import TestimonialCard from "@/components/testimonials/TestimonialCard";

export default async function TestimonialsPage() {
  const [testimonials, villas] = await Promise.all([getTestimonials(), getVillas()]);
  const villaNameById = new Map(villas.map((v) => [v.id, v.title.rendered]));

  return (
    <main className="space-y-8 bg-surface py-12">
      <header className="space-y-2 px-6 text-center">
        <p className="text-eyebrow uppercase text-primary">What People Say About</p>
        <h1 className="text-section uppercase text-secondary">Coco B</h1>
      </header>

      {testimonials.length === 0 ? (
        <div className="mx-6 rounded-md border border-dashed border-border bg-white p-8 text-center">
          <p className="text-body text-secondary">
            No hay testimonios disponibles en este momento.
          </p>
          <p className="mt-2 text-caption text-muted">
            Puedes añadir testimonios en WordPress bajo el CPT{" "}
            <code className="rounded bg-chip px-2 py-0.5 font-mono">testimonio</code>.
          </p>
        </div>
      ) : (
        <div
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[7.5vw] pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {testimonials.map((item) => (
            <div key={item.id} className="w-[85vw] max-w-sm shrink-0 snap-center">
              <TestimonialCard
                testimonio={item}
                villaName={
                  item.acf?.related_villa_id
                    ? villaNameById.get(item.acf.related_villa_id)
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}