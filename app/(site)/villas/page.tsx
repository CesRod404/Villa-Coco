import { getVillas } from "@/lib/wp";

export default async function VillasPage() {
    const villas = await getVillas();

    return (
        <main className="container mx-auto p-6 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6 text-slate-800">Nuestras Villas</h1>

            {villas.length === 0 ? (
                <div className="p-8 border border-dashed rounded-xl bg-amber-50 border-amber-200 text-center">
                    <p className="text-amber-800 font-semibold mb-2">
                        No se pudieron cargar las villas desde WordPress.
                    </p>
                    <p className="text-sm text-amber-700">
                        Asegúrate de que tu servidor de WordPress esté corriendo en{" "}
                        <code className="bg-amber-100 px-2 py-0.5 rounded font-mono">
                            {process.env.WORDPRESS_API_URL}
                        </code>
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {villas.map((villa) => (
                        <article key={villa.id} className="border border-slate-200 bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            {/* Título (Casa Coco) */}
                            <h2 className="text-xl font-bold text-slate-900 mb-2">
                                {villa.title?.rendered}
                            </h2>

                            {/* Datos de ACF */}
                            <p className="text-slate-600 mb-4 text-sm line-clamp-3">
                                {villa.acf?.descripcion_corta}
                            </p>

                            <div className="flex justify-between items-center text-sm font-medium pt-3 border-t border-slate-100">
                                <span className="text-slate-500">📍 {villa.acf?.ubicacion || "Ubicación N/A"}</span>
                                <span className="text-emerald-600 font-bold text-base">
                                    ${villa.acf?.precio} <span className="text-xs font-normal text-slate-500">/ noche</span>
                                </span>
                            </div>

                            {/* Amenidades */}
                            {villa.acf?.amenidades && villa.acf.amenidades.length > 0 && (
                                <div className="mt-4 flex gap-1.5 flex-wrap">
                                    {villa.acf.amenidades.map((amenidad, index) => (
                                        <span
                                            key={index}
                                            className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-100"
                                        >
                                            {amenidad}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}
