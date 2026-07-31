import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
      <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-6xl font-extrabold text-emerald-600 mb-2">404</h2>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">Página no encontrada</h1>
        <p className="text-slate-600 mb-6">
          Lo sentimos, la villa o página que estás buscando no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
