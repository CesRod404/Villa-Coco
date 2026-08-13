import { notFound } from "next/navigation";
import Link from "next/link";
import { getVillaAvailability, getVillaBySlug } from "@/lib/wp";
import ReservationPlanner from "@/components/reservation/ReservationPlanner";

export default async function VillaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const villa = await getVillaBySlug(slug);
    if (!villa) notFound();

    const availability = await getVillaAvailability(villa.id);
    const image = villa._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

    return (
        <main className="min-h-screen bg-[#edf5f5] text-[#17304f]">
            <section className="mx-auto grid max-w-1440px gap-8 px-4 py-6 sm:px-7 sm:py-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(440px,.88fr)] lg:items-start lg:gap-12 lg:px-12 lg:py-14">
                <div className="lg:sticky lg:top-8 lg:self-start">
                    <Link href="/villas" className="text-sm font-semibold tracking-wide text-[#4d806f] hover:underline">← Volver a villas</Link>
                    <div className="mt-8 grid gap-6 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end lg:grid-cols-1">
                        <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#4d806f]">{villa.acf.location || "Isla Mujeres"} · México</p><h1 className="mt-3 font-serif text-[clamp(3.25rem,7vw,6.75rem)] leading-[.82] text-[#17304f]" dangerouslySetInnerHTML={{ __html: villa.title.rendered }} /></div>
                        <p className="border-l-2 border-[#dd9b4f] pl-4 text-sm leading-6 text-slate-600">{villa.acf.description_short || "Una estancia privada diseñada a tu ritmo."}</p>
                    </div>
                    {image ? <div className="relative mt-8 overflow-hidden rounded-4xl bg-[#d3e7e4] shadow-[0_24px_65px_rgba(23,48,79,.18)]"><img src={image} alt={villa._embedded?.["wp:featuredmedia"]?.[0]?.alt_text || villa.title.rendered} className="aspect-16/10 w-full object-cover sm:aspect-4/3 lg:aspect-5/4" /><div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[#17304f]/75 to-transparent px-6 pb-6 pt-16"><p className="max-w-lg text-sm leading-6 text-white">{villa.acf.description_long || villa.acf.description_short}</p></div></div> : null}
                    <dl className="mt-6 grid grid-cols-3 gap-2 text-center sm:gap-3">
                        <div className="rounded-2xl bg-white p-4"><dt className="text-xs uppercase tracking-wide text-slate-400">Recámaras</dt><dd className="mt-1 text-xl font-bold">{villa.acf.bedrooms || "—"}</dd></div>
                        <div className="rounded-2xl bg-white p-4"><dt className="text-xs uppercase tracking-wide text-slate-400">Baños</dt><dd className="mt-1 text-xl font-bold">{villa.acf.bathrooms || "—"}</dd></div>
                        <div className="rounded-2xl bg-white p-4"><dt className="text-xs uppercase tracking-wide text-slate-400">Suites</dt><dd className="mt-1 text-xl font-bold">{villa.acf.suites_count || "—"}</dd></div>
                    </dl>
                </div>
                <ReservationPlanner villaId={villa.id} villaName={villa.title.rendered.replace(/<[^>]*>/g, "")} maxGuests={villa.acf.suites_count ? villa.acf.suites_count * 2 : undefined} reservations={availability.reservations} availabilityOnline={availability.isAvailable} />
            </section>
        </main>
    );
}
