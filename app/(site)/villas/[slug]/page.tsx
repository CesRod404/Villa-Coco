import Link from "next/link";
import { notFound } from "next/navigation";
import ReservationPlanner from "@/components/reservation/ReservationPlanner";
import DataFallbackNotice from "@/components/common/DataFallbackNotice";
import { getVillaAvailability, getVillaBySlugWithSource } from "@/lib/wp";
import { getWordpressFallback } from "@/lib/wp/fallback";
import type { Villa } from "@/types/wordpress";
import { getVillaPrimaryImage } from "@/lib/images/villa-images";

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

function heroImage(villa: Villa, fallbackVilla?: Villa) {
  return getVillaPrimaryImage(villa, fallbackVilla);
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

  const [primaryResult, companionResult] = await Promise.all([
    getVillaBySlugWithSource(slug),
    companionSlug && companionSlug !== slug
      ? getVillaBySlugWithSource(companionSlug)
      : Promise.resolve(null),
  ]);
  const primaryVilla = primaryResult.data;
  const companionVilla = companionResult?.data ?? null;
  const isUsingFallback =
    primaryResult.source === "fallback" || companionResult?.source === "fallback";

  if (!primaryVilla) notFound();

  const villas = companionVilla ? [primaryVilla, companionVilla] : [primaryVilla];
  const fallbackVillas = getWordpressFallback<Villa>("/villa") || [];
  const fallbackVillaBySlug = new Map(fallbackVillas.map((villa) => [villa.slug, villa]));
  const availability = await Promise.all(villas.map((villa) => getVillaAvailability(villa.id)));
  const combined = villas.length === 2;
  const reservations = availability.flatMap((item) => item.reservations);
  const availabilityOnline = availability.every((item) => item.isAvailable);
  const maxGuests = villas.reduce((total, villa) => total + capacity(villa), 0) || 20;

  // Villa summary data for the reservation card (image, description, price, amenities)
  // reused inside ReservationPlanner to match the new form design.
  const summaryImage = heroImage(primaryVilla, fallbackVillaBySlug.get(primaryVilla.slug));
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
    <main className="min-h-screen bg-white text-[#17304f] lg:bg-[#edf5f5]">
      <section className="mx-auto max-w-[1440px] px-0 py-0 lg:px-12 lg:py-14">
        <DataFallbackNotice visible={isUsingFallback} />
        <Link href={combined ? "/#mix-match" : "/#villas"} className="mx-4 mt-5 hidden text-sm font-semibold tracking-wide text-[#4d806f] hover:underline lg:inline-block">
          ← {combined ? "Volver a Mix & Match" : "Volver a las villas"}
        </Link>

        <div id="reservation" className="mx-auto mt-0 max-w-[1160px] scroll-mt-8 lg:mt-8">
          <ReservationPlanner
            villas={villas.map((villa, index) => {
              return {
                id: villa.id,
                name: plainText(villa.title.rendered),
                image: heroImage(villa, fallbackVillaBySlug.get(villa.slug)),
                guests: capacity(villa),
                bedrooms: positiveNumber(villa.acf.bedrooms, villa.acf.habitaciones),
                bathrooms: positiveNumber(villa.acf.bathrooms, villa.acf.banos),
              };
            })}
            maxGuests={maxGuests}
            reservations={reservations}
            availabilityOnline={availabilityOnline}
            heroImage={summaryImage}
            heroImageAlt={summaryImage?.alt || plainText(primaryVilla.title.rendered)}
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
