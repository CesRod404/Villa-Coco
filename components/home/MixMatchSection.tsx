/**
 * components/home/MixMatchSection.tsx
 *
 * TODO: contenido estático por ahora — tomado del inventario de contenido,
 * no viene de un CPT todavía. Cuando el Paquete CPT (CMS-03) esté
 * confirmado con estos combos, reemplazar este arreglo por un fetch real
 * (ej. getPackages(), que ya existe en lib/wordpress.ts).
 */

const COMBOS = [
  {
    name: "Lola & Encantada",
    totalLabel: "13 Total Bedrooms / Suites",
    images: ["/combo-lola-encantada-1.jpg", "/combo-lola-encantada-2.jpg"],
  },
  {
    name: "Coco & Cielo",
    totalLabel: "14 Total Bedrooms / Suites",
    images: ["/combo-coco-cielo-1.jpg", "/combo-coco-cielo-2.jpg"],
  },
];

export default function MixMatchSection() {
  return (
    <section className="space-y-8 px-6 py-12 text-center">
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-primary" />
          <p className="text-eyebrow uppercase text-primary">Mix &</p>
          <span className="h-px w-8 bg-primary" />
        </div>
        <h2 className="text-section uppercase text-secondary">Match</h2>
        <p className="text-body text-muted">
          Pair two side-by-side villas for larger groups
        </p>
      </div>

      <div className="space-y-8 text-left">
        {COMBOS.map((combo) => (
          <div key={combo.name}>
            <h3 className="text-group-heading uppercase text-secondary">
              {combo.name}
            </h3>
            <p className="text-meta text-ink-soft">{combo.totalLabel}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {combo.images.map((src, i) => (
                // TODO: swap por <Image> con los assets reales exportados de Figma
                <div
                  key={i}
                  className="aspect-square rounded-md bg-surface"
                  style={{ backgroundImage: `url(${src})`, backgroundSize: "cover" }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="border border-secondary px-8 py-4 text-button uppercase text-secondary">
        Let&apos;s Mix &amp; Match
      </button>
    </section>
  );
}