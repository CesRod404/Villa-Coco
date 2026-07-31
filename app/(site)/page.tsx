import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
      <h1 className="text-4xl font-bold text-emerald-800 mb-4">Villa Coco</h1>
      <p className="text-slate-600 mb-8 text-lg text-center max-w-md">
        Bienvenido a Villa Coco. Explora nuestras villas exclusivas conectadas a WordPress Headless.
      </p>
      <Link
        href="/villas"
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-md transition-colors"
      >
        Ver Villas (/villas)
      </Link>
    </main>
  );
}
