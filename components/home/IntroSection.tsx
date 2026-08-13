/**
 * components/home/IntroSection.tsx
 */

export default function IntroSection() {
  return (
    <section className="space-y-6 bg-surface px-6 py-12 text-center">
      <div className="space-y-2">
        <p className="text-body text-secondary">
          🌴 Discover New Ways to <span className="italic">Paradise</span>
        </p>
        <p className="text-body text-foreground">
          Lola, Encantada, Coco, and Cielo await on the pristine shores of
          Isla Mujeres. Each villa is a sanctuary where luxury whispers and
          moments linger.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <p className="text-eyebrow uppercase text-primary">Our Collection</p>
        <span className="h-px w-8 bg-primary" />
      </div>
      <h2 className="text-section uppercase text-secondary">Villas</h2>
    </section>
  );
}