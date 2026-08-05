import { getTestimonials } from "@/lib/wp";

export default async function TestimonialsPage() {
    const testimonials = await getTestimonials();

    return (
        <main className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Testimonios de Huéspedes</h1>
                <p className="text-slate-600 text-sm mt-1">
                    Lee lo que nuestros huéspedes y visitantes opinan sobre su experiencia en nuestras villas y retiros.
                </p>
            </div>

            {testimonials.length === 0 ? (
                <div className="p-8 border border-dashed rounded-xl bg-blue-50 border-blue-200 text-center">
                    <p className="text-blue-800 font-semibold mb-2">
                        No hay testimonios disponibles en este momento.
                    </p>
                    <p className="text-sm text-blue-700">
                        Puedes añadir testimonios en WordPress bajo el CPT <code className="bg-blue-100 px-2 py-0.5 rounded font-mono">testimonial</code>.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((item) => (
                        <article key={item.id} className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <div className="text-emerald-500 text-3xl font-serif mb-2">“</div>
                                <p className="text-slate-700 italic text-sm mb-6 leading-relaxed">
                                    {item.acf?.quote || item.title?.rendered}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                                {item.acf?.author_photo && (
                                    <img
                                        src={typeof item.acf.author_photo === "string" ? item.acf.author_photo : ""}
                                        alt={item.acf?.author_name || "Autor"}
                                        className="w-10 h-10 rounded-full object-cover bg-slate-200"
                                    />
                                )}
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">
                                        {item.acf?.author_name || "Huésped satisfecho"}
                                    </h3>
                                    {item.acf?.author_context && (
                                        <p className="text-xs text-slate-500">
                                            {item.acf.author_context}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}
