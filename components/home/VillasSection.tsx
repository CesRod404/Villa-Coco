/**
 * components/home/VillasSection.tsx
 * Server Component — recibe las villas ya resueltas desde app/(site)/page.tsx
 * (que las obtiene con getVillas()). Aquí solo se encarga del layout.
 */

import VillaCard from "@/components/villa/VillaCard";
import { Villa } from "@/types/wordpress";

export default function VillasSection({ villas }: { villas: Villa[] }) {
  if (villas.length === 0) {
    // Estado vacío — Semana 4 lo pide explícitamente
    return (
      <section id="villas" className="px-6 py-12 text-center">
        <p className="text-body text-muted">
          No hay villas disponibles en este momento. Vuelve pronto.
        </p>
      </section>
    );
  }

  return (
    <section id="villas" className="space-y-8 px-6 py-12">
      {villas.map((villa) => (
        <VillaCard key={villa.id} villa={villa} />
      ))}
    </section>
  );
}