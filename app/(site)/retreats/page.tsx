import Link from "next/link";
import { getRetreats } from "@/lib/wp";

export default async function RetreatsPage() {
    const retreats = await getRetreats();

    return (
        <main className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Retiros de Bienestar</h1>
                <p className="text-slate-600 text-sm mt-1">
                    Experiencias transformadoras de Yoga, Wellness, Fitness y Gastronomía en Coco B Wellness.
                </p>
            </div>

            {retreats.length === 0 ? (
                <div className="p-8 border border-dashed rounded-xl bg-teal-50 border-teal-200 text-center">
                    <p className="text-teal-800 font-semibold mb-2">
                        No se encontraron retiros registrados.
                    </p>
                    <p className="text-sm text-teal-700">
                        Asegúrate de agregar retiros en el panel de administración de WordPress bajo el tipo de contenido <code className="bg-teal-100 px-2 py-0.5 rounded font-mono">retreat</code>.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {retreats.map((retreat) => {
                        const featuredImg = retreat._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

                        return (
                            <article key={retreat.id} className="border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                {featuredImg && (
                                    <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
                                        <img
                                            src={featuredImg}
                                            alt={retreat.title?.rendered || "Retiro"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="text-xs uppercase tracking-wider font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
                                                {retreat.acf?.retreat_type || "Retiro"}
                                            </span>
                                            {retreat.acf?.spots_left !== undefined && (
                                                <span className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                                    ¡Quedan {retreat.acf.spots_left} lugares!
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="text-xl font-bold text-slate-900 mb-2">
                                            {retreat.title?.rendered}
                                        </h2>

                                        {retreat.acf?.host_name && (
                                            <p className="text-xs text-slate-500 mb-3">
                                                Facilitador: <span className="font-semibold text-slate-700">{retreat.acf.host_name}</span>
                                            </p>
                                        )}

                                        <div className="text-slate-600 mb-4 text-sm line-clamp-3 prose prose-sm" dangerouslySetInnerHTML={{ __html: retreat.acf?.description || "" }} />

                                        {/* Fechas */}
                                        <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1 mb-4">
                                            <div>🗓️ <strong>Fechas:</strong> {retreat.acf?.start_date} al {retreat.acf?.end_date}</div>
                                            <div>👥 <strong>Capacidad Total:</strong> {retreat.acf?.capacity} participantes</div>
                                        </div>
                                    </div>

                                    {retreat.acf?.price_indicative && (
                                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Precio indicativo:</span>
                                            <span className="font-bold text-teal-700">${retreat.acf.price_indicative}</span>
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
            <Link
                href="/"
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-md transition-colors"
            >
                Volver a inicio
            </Link>
        </main>

    );
}
