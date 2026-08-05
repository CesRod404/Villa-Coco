import Link from "next/link";
import { getVillas } from "@/lib/wp";

export default async function VillasPage() {
    const villas = await getVillas();

    return (
        <main className="container mx-auto p-6 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Nuestras Villas</h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Propiedades exclusivas frente al mar en Isla Mujeres. Modelo de reserva bajo solicitud (*request-only*).
                    </p>
                </div>
            </div>

            {villas.length === 0 ? (
                <div className="p-8 border border-dashed rounded-xl bg-amber-50 border-amber-200 text-center">
                    <p className="text-amber-800 font-semibold mb-2">
                        No se pudieron cargar las villas desde WordPress.
                    </p>
                    <p className="text-sm text-amber-700">
                        Asegúrate de que tu servidor de WordPress esté corriendo en{" "}
                        <code className="bg-amber-100 px-2 py-0.5 rounded font-mono">
                            {process.env.WORDPRESS_API_URL || "http://localhost:8881/wp-json/wp/v2"}
                        </code>
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {villas.map((villa) => {
                        const featuredImg = villa._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
                        
                        return (
                            <article key={villa.id} className="border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                {featuredImg && (
                                    <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
                                        <img
                                            src={featuredImg}
                                            alt={villa.title?.rendered || "Villa"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <h2 className="text-xl font-bold text-slate-900">
                                                {villa.title?.rendered}
                                            </h2>
                                            {villa.acf?.location && (
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                    📍 {villa.acf.location}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-slate-600 mb-4 text-sm line-clamp-3">
                                            {villa.acf?.description_short}
                                        </p>

                                        {/* Especificaciones */}
                                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-xs text-slate-600 text-center mb-4">
                                            <div>
                                                <span className="font-bold text-slate-800 block text-sm">{villa.acf?.bedrooms || "-"}</span>
                                                Recámaras
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-800 block text-sm">{villa.acf?.bathrooms || "-"}</span>
                                                Baños
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-800 block text-sm">{villa.acf?.suites_count || "-"}</span>
                                                Suites
                                            </div>
                                        </div>

                                        {/* Casos de uso */}
                                        {villa.acf?.use_cases && villa.acf.use_cases.length > 0 && (
                                            <div className="flex gap-1.5 flex-wrap mb-4">
                                                {villa.acf.use_cases.map((useCase, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-100 capitalize"
                                                    >
                                                        {useCase}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Link
                                        href={`/villas/${villa.slug}`}
                                        className="w-full inline-block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                                    >
                                        Ver detalles y disponibilidad
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
