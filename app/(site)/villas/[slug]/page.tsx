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

function heroImage(villa: Villa) {
  const featured = villa._embedded?.["wp:featuredmedia"]?.[0];
  return {
    src: featured?.source_url || villa.acf.image_1?.url,
    alt: featured?.alt_text || villa.acf.image_1?.alt || plainText(villa.title.rendered),
  };
}

function nightlyPrice(villa: Villa) {
  return positiveNumber(
    villa.acf.price,
    villa.acf.precio,
    villa.acf.nightly_rate,
    villa.acf.price_per_night,
  ) || undefined;
}

function amenityTags(villa: Villa) {
  const source = villa.acf.amenities || villa.acf.features || villa.acf.use_cases || [];
  const amenities = (Array.isArray(source) ? source : [source])
    .flatMap((value) => String(value).split(","))
    .map((value) => value.replace(/[_-]+/g, " ").trim())
    .filter(Boolean);
  return Array.from(new Set(amenities)).slice(0, 8);
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
  const combined = villas.length === 2;
  const reservations = availability.flatMap((item) => item.reservations);
  const availabilityOnline = availability.every((item) => item.isAvailable);
  const maxGuests = villas.reduce((total, villa) => total + capacity(villa), 0) || 20;

  // Villa summary data for the reservation card (image, description, price, amenities)
  // reused inside ReservationPlanner to match the new form design.
  const summaryImage = heroImage(primaryVilla);
  const summaryDescription = combined
    ? "Two private villas, one shared itinerary and a single availability request."
    : primaryVilla.acf.description_short
      ? plainText(primaryVilla.acf.description_short)
      : undefined;
  const summaryPrice = combined ? undefined : nightlyPrice(primaryVilla);
  const summaryAmenities = amenityTags(primaryVilla);
  const totalBedrooms = villas.reduce((sum, villa) => sum + positiveNumber(villa.acf.bedrooms, villa.acf.habitaciones), 0) || undefined;
  const totalBathrooms = villas.reduce((sum, villa) => sum + positiveNumber(villa.acf.bathrooms, villa.acf.banos), 0) || undefined;

  return (
    <main className="min-h-screen bg-[#edf5f5] text-[#17304f]">
      <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 sm:py-10 lg:px-12 lg:py-14">
        <Link href={combined ? "/#mix-match" : "/#villas"} className="text-sm font-semibold tracking-wide text-[#4d806f] hover:underline">
          ← {combined ? "Volver a Mix & Match" : "Volver a las villas"}
        </Link>

        <div id="reservation" className="mx-auto mt-8 max-w-[1160px] scroll-mt-8">
          <ReservationPlanner
            villas={villas.map((villa) => ({ id: villa.id, name: plainText(villa.title.rendered) }))}
            maxGuests={maxGuests}
            reservations={reservations}
            availabilityOnline={availabilityOnline}
            heroImage={summaryImage.src}
            heroImageAlt={summaryImage.alt}
            description={summaryDescription}
            price={summaryPrice}
            amenities={summaryAmenities}
            bedrooms={totalBedrooms}
            bathrooms={totalBathrooms}
          />
        </div>
      </section>
    </main>
  );
}
