import Link from "next/link";
import { notFound } from "next/navigation";
import ReservationPlanner from "@/components/reservation/ReservationPlanner";
import { getVillaAvailability, getVillaBySlug } from "@/lib/wp";
import type { Villa } from "@/types/wordpress";

function plainText(value?: string) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function positiveNumber(...values: unknown[]) {
  for (const value of values) {
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

function capacity(villa: Villa) {
  return (
    positiveNumber(
      villa.acf.guests,
      villa.acf.max_guests,
      villa.acf.capacity,
      villa.acf.capacidad_personas,
    ) || positiveNumber(villa.acf.suites_count) * 2
  );
}

export default async function VillaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ with?: string | string[] }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const companionSlug = Array.isArray(query.with) ? query.with[0] : query.with;

  const [primaryVilla, companionVilla] = await Promise.all([
    getVillaBySlug(slug),
    companionSlug && companionSlug !== slug ? getVillaBySlug(companionSlug) : Promise.resolve(null),
  ]);

  if (!primaryVilla) notFound();

  const villas = companionVilla ? [primaryVilla, companionVilla] : [primaryVilla];
  const availability = await Promise.all(villas.map((villa) => getVillaAvailability(villa.id)));
  const names = villas.map((villa) => plainText(villa.title.rendered));
  const combined = villas.length === 2;
  const combinedName = names.join(" + ");
  const reservations = availability.flatMap((item) => item.reservations);
  const availabilityOnline = availability.every((item) => item.isAvailable);
  const maxGuests = villas.reduce((total, villa) => total + capacity(villa), 0) || 20;

  return (
    <main className="min-h-screen bg-[#edf5f5] text-[#17304f]">
      <section className="mx-auto grid max-w-[1440px] gap-8 px-4 py-6 sm:px-7 sm:py-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(440px,.88fr)] lg:items-start lg:gap-12 lg:px-12 lg:py-14">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Link href={combined ? "/#mix-match" : "/#villas"} className="text-sm font-semibold tracking-wide text-[#4d806f] hover:underline">
            ← {combined ? "Volver a Mix & Match" : "Volver a las villas"}
          </Link>

          <div className="mt-8 grid gap-6 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end lg:grid-cols-1">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#4d806f]">
                {combined ? "Mix & Match" : primaryVilla.acf.location || "Isla Mujeres"} · México
              </p>
              <h1 className="mt-3 font-serif text-[clamp(2.8rem,6vw,6.2rem)] leading-[.9] text-[#17304f]">
                {combinedName}
              </h1>
            </div>
            <p className="border-l-2 border-[#dd9b4f] pl-4 text-sm leading-6 text-slate-600">
              {combined
                ? "Two private villas, one shared itinerary and a single availability request."
                : primaryVilla.acf.description_short || "Una estancia privada diseñada a tu ritmo."}
            </p>
          </div>

          <div className={`mt-8 grid gap-4 ${combined ? "sm:grid-cols-2" : ""}`}>
            {villas.map((villa) => {
              const image = villa._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
              return image ? (
                <figure key={villa.id} className="relative m-0 overflow-hidden rounded-[2rem] bg-[#d3e7e4] shadow-[0_24px_65px_rgba(23,48,79,.18)]">
                  <img
                    src={image}
                    alt={villa._embedded?.["wp:featuredmedia"]?.[0]?.alt_text || plainText(villa.title.rendered)}
                    className={`w-full object-cover ${combined ? "aspect-[4/3]" : "aspect-[16/10] sm:aspect-[4/3] lg:aspect-[5/4]"}`}
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17304f]/85 to-transparent px-6 pb-5 pt-14 font-semibold text-white">
                    {plainText(villa.title.rendered)}
                  </figcaption>
                </figure>
              ) : null;
            })}
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-2 text-center sm:gap-3">
            <div className="rounded-2xl bg-white p-4"><dt className="text-xs uppercase tracking-wide text-slate-400">Recámaras</dt><dd className="mt-1 text-xl font-bold">{villas.reduce((sum, villa) => sum + positiveNumber(villa.acf.bedrooms, villa.acf.habitaciones), 0) || "—"}</dd></div>
            <div className="rounded-2xl bg-white p-4"><dt className="text-xs uppercase tracking-wide text-slate-400">Suites</dt><dd className="mt-1 text-xl font-bold">{villas.reduce((sum, villa) => sum + positiveNumber(villa.acf.suites_count), 0) || "—"}</dd></div>
            <div className="rounded-2xl bg-white p-4"><dt className="text-xs uppercase tracking-wide text-slate-400">Huéspedes</dt><dd className="mt-1 text-xl font-bold">{maxGuests}</dd></div>
          </dl>
        </div>

        <div id="reservation" className="scroll-mt-8">
          <ReservationPlanner
            villas={villas.map((villa) => ({ id: villa.id, name: plainText(villa.title.rendered) }))}
            maxGuests={maxGuests}
            reservations={reservations}
            availabilityOnline={availabilityOnline}
          />
        </div>
      </section>
    </main>
  );
}
