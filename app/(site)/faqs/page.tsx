import { getFAQs } from "@/lib/wp";
import Link from "next/link";

export default async function FAQsPage() {
    const faqs = await getFAQs();

    return (
        <main className="container mx-auto p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Preguntas Frecuentes (FAQ)</h1>
                <p className="text-slate-600 text-sm mt-1">
                    Encuentra respuestas a las preguntas más comunes sobre nuestras villas, retiros y servicios.
                </p>
            </div>

            {faqs.length === 0 ? (
                <div className="p-8 border border-dashed rounded-xl bg-slate-50 border-slate-200 text-center">
                    <p className="text-slate-800 font-semibold mb-2">
                        No hay preguntas frecuentes registradas.
                    </p>
                    <p className="text-sm text-slate-600">
                        Agrega entradas en el panel de WordPress bajo el Custom Post Type <code className="bg-slate-200 px-2 py-0.5 rounded font-mono">faq</code>.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {faqs.map((faq) => (
                        <details key={faq.id} className="group border border-slate-200 bg-white rounded-xl p-5 [&_summary::-webkit-details-marker]:none">
                            <summary className="flex items-center justify-between cursor-pointer font-bold text-slate-900 text-base">
                                <span>{faq.acf?.question || faq.title?.rendered}</span>
                                <span className="ml-4 transition group-open:rotate-180 text-slate-400">
                                    ▼
                                </span>
                            </summary>

                            <div
                                className="mt-4 text-slate-600 text-sm leading-relaxed prose prose-sm max-w-none pt-4 border-t border-slate-100"
                                dangerouslySetInnerHTML={{ __html: faq.acf?.answer || "" }}
                            />

                            {faq.acf?.category && (
                                <div className="mt-3 flex justify-end">
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">
                                        Categoría: {faq.acf.category}
                                    </span>
                                </div>
                            )}

                        </details>
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
