import { getPackages } from "@/lib/wp";
import Link from "next/link";
export default async function PackagesPage() {
    const packages = await getPackages();

    return (
        <main className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Paquetes Disponibles</h1>
                <p className="text-slate-600 text-sm mt-1">
                    Conoce nuestros paquetes integrales para estancias en villas y retiros.
                </p>
            </div>

            {packages.length === 0 ? (
                <div className="p-8 border border-dashed rounded-xl bg-purple-50 border-purple-200 text-center">
                    <p className="text-purple-800 font-semibold mb-2">
                        No hay paquetes configurados actualmente.
                    </p>
                    <p className="text-sm text-purple-700">
                        Agrega paquetes en WordPress bajo el Custom Post Type <code className="bg-purple-100 px-2 py-0.5 rounded font-mono">package</code>.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                        <article key={pkg.id} className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {pkg.title?.rendered}
                                    </h2>
                                    {pkg.acf?.duration && (
                                        <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-semibold">
                                            ⏱️ {pkg.acf.duration}
                                        </span>
                                    )}
                                </div>

                                <div className="text-slate-600 mb-4 text-sm prose prose-sm" dangerouslySetInnerHTML={{ __html: pkg.acf?.description || "" }} />

                                {pkg.acf?.includes && (
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Qué incluye:</h3>
                                        <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                                            {pkg.acf.includes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
            <Link
                href="/"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-md transition-colors"
            >
                Volver a inicio
            </Link>
        </main>
    );
}
