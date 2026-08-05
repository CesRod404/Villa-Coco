import Link from "next/link";
import { notFound } from "next/navigation";
import { getVillaBySlug } from "@/lib/wp";

export default async function VillaDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const villa = await getVillaBySlug(slug);

    if (!villa) {
        return (
            <main className="container mx-auto p-6 max-w-4xl text-center py-16">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Villa no encontrada</h1>
                <p className="text-slate-600 mb-6">No pudimos encontrar la villa con el identificador &quot;{slug}&quot;.</p>
                <Link href="/villas" className="text-emerald-600 hover:underline font-medium">
                    ← Volver a la lista de villas
                </Link>
            </main>
        );
    }

    const featuredImg = villa._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

    return (
        <main className="container mx-auto p-6 max-w-4xl">
            <Link href="/villas" className="text-sm text-emerald-600 hover:underline mb-4 inline-block font-medium">
                ← Volver a todas las villas
            </Link>

            {featuredImg && (
                <div className="h-80 w-full bg-slate-100 rounded-2xl overflow-hidden mb-6 relative">
                    <img
                        src={featuredImg}
                        alt={villa.title?.rendered}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900">{villa.title?.rendered}</h1>
                    {villa.acf?.location && (
                        <p className="text-slate-500 font-medium mt-1">📍 {villa.acf.location}</p>
                    )}
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
                    Reserva bajo solicitud
                </span>
            </div>

            {/* Tarjeta de métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-8 text-center">
                <div>
                    <span className="text-slate-500 text-xs block">Recámaras</span>
                    <span className="text-lg font-bold text-slate-800">{villa.acf?.bedrooms || "N/A"}</span>
                </div>
                <div>
                    <span className="text-slate-500 text-xs block">Baños</span>
                    <span className="text-lg font-bold text-slate-800">{villa.acf?.bathrooms || "N/A"}</span>
                </div>
                <div>
                    <span className="text-slate-500 text-xs block">Capacidad Suites</span>
                    <span className="text-lg font-bold text-slate-800">{villa.acf?.suites_count || "N/A"}</span>
                </div>
                <div>
                    <span className="text-slate-500 text-xs block">Estancia Mínima</span>
                    <span className="text-lg font-bold text-slate-800">{villa.acf?.minimum_stay_nights ? `${villa.acf.minimum_stay_nights} noches` : "N/A"}</span>
                </div>
            </div>

            {/* Descripción Larga */}
            <div className="prose max-w-none text-slate-700 mb-8">
                <h2 className="text-2xl font-semibold mb-3 text-slate-800">Descripción</h2>
                <div dangerouslySetInnerHTML={{ __html: villa.acf?.description_long || villa.acf?.description_short || "" }} />
            </div>

            {/* Casos de uso */}
            {villa.acf?.use_cases && villa.acf.use_cases.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Ideal para</h3>
                    <div className="flex gap-2 flex-wrap">
                        {villa.acf.use_cases.map((useCase, index) => (
                            <span key={index} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium capitalize">
                                {useCase}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}
