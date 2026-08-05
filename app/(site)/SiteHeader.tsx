import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white py-4 px-6">
      <div className="container mx-auto flex justify-between items-center max-w-6xl">
        <Link href="/" className="text-xl font-bold text-emerald-700">
          Villa Coco
        </Link>
        <nav className="flex gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-emerald-600 transition-colors">Inicio</Link>
          <Link href="/villas" className="hover:text-emerald-600 transition-colors">Villas</Link>
          <Link href="/retreats" className="hover:text-emerald-600 transition-colors">Retiros</Link>
          <Link href="/packages" className="hover:text-emerald-600 transition-colors">Paquetes</Link>
          <Link href="/testimonials" className="hover:text-emerald-600 transition-colors">Testimonios</Link>
          <Link href="/faqs" className="hover:text-emerald-600 transition-colors">FAQ</Link>
          <Link href="/contacto" className="hover:text-emerald-600 transition-colors">Contacto</Link>
        </nav>
      </div>
    </header>
  );
}
