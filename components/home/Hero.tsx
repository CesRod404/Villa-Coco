/**
 * components/home/Hero.tsx
 * TODO: reemplazar el bg-secondary/70 de abajo por la imagen real del hero
 * (playa/villa) cuando tengas el asset exportado de Figma. Por ahora usa un
 * color sólido para no bloquear el resto del home.
 */

import FindMyVillaButton from "@/components/home/FindMyVillaButton";

export default function Hero() {
  return (
    <section className="relative flex h-[70vh] min-h-480px flex-col items-center justify-end gap-6 bg-secondary/70 bg-cover bg-center px-6 pb-12 text-center">
      {/* TODO: <Image src="/hero.jpg" fill className="object-cover -z-10" alt="" /> */}
      <div className="space-y-2">
        <p className="text-body text-white">Villas</p>
        <p className="text-label uppercase tracking-widest text-white">
          Lola · Encantada · Coco · Cielo
        </p>
      </div>
      <FindMyVillaButton />
    </section>
  );
}