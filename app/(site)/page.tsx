import Image from "next/image";
import localFont from "next/font/local";
import { Mail, Phone } from "lucide-react";
import FindVillaChatButton from "@/components/home/FindVillaChatButton";
import HeroNavbar from "@/components/home/HeroNavbar";
import MixMatchConfigurator, {
  type MixMatchVilla,
} from "@/components/home/MixMatchConfigurator";
import TestimonialCarousel, {
  type TestimonialCardData,
} from "@/components/home/TestimonialCarousel";
import VillaCard from "@/components/villa/VillaCard";
import DataFallbackNotice from "@/components/common/DataFallbackNotice";
import { getTestimonialsWithSource, getVillasWithSource } from "@/lib/wp";
import type { Villa } from "@/types/wordpress";
import styles from "./home.module.css";

const raleway = localFont({
  src: [
    { path: "../fonts/Raleway-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Raleway-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-raleway",
});

function plainText(value?: string) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#8217;|&rsquo;/gi, "’")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function positiveNumber(...values: unknown[]) {
  for (const value of values) {
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

function villaName(villa: Villa) {
  return plainText(villa.title?.rendered) || "Villa";
}

function formatTestimonialDate(value?: string) {
  const raw = plainText(value);
  if (!raw) return "";

  let year: number | undefined;
  let month: number | undefined;
  let day = 1;

  if (/^\d{8}$/.test(raw)) {
    year = Number(raw.slice(0, 4));
    month = Number(raw.slice(4, 6));
    day = Number(raw.slice(6, 8));
  } else {
    const iso = raw.match(/^(\d{4})[-/]([01]\d)[-/]([0-3]\d)$/);
    const dayFirst = raw.match(/^([0-3]\d)[-/]([01]\d)[-/](\d{4})$/);

    if (iso) {
      year = Number(iso[1]);
      month = Number(iso[2]);
      day = Number(iso[3]);
    } else if (dayFirst) {
      year = Number(dayFirst[3]);
      month = Number(dayFirst[2]);
      day = Number(dayFirst[1]);
    }
  }

  if (!year || !month || month > 12 || day > 31) return raw;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function villaImages(villa: Villa): MixMatchVilla["images"] {
  const featured = villa._embedded?.["wp:featuredmedia"]?.[0];
  const candidates = [
    villa.acf.image_1,
    villa.acf.image_2,
    villa.acf.image_3,
    villa.acf.image_4,
    featured?.source_url
      ? {
          url: featured.source_url,
          width: featured.media_details?.width,
          height: featured.media_details?.height,
        }
      : null,
  ];

  return candidates.reduce<MixMatchVilla["images"]>((images, image) => {
    if (!image?.url || images.some((existing) => existing.src === image.url)) return images;

    images.push({ src: image.url, width: image.width, height: image.height });
    return images;
  }, []);
}

const services = [
  { iconSrc: "/images/icons/service-concierge.svg", label: "24-hour concierge", iconWidth: 32, iconHeight: 32 },
  { iconSrc: "/images/icons/service-yoga.svg", label: "Yoga & wellness", iconWidth: 32, iconHeight: 32 },
  { iconSrc: "/images/icons/service-boat.svg", label: "Private boat transfers", iconWidth: 32, iconHeight: 32 },
  { iconSrc: "/images/icons/service-chef.svg", label: "Private chef on request", iconWidth: 32, iconHeight: 32 },
  // Wedding rings + toast glass, combined side by side (48x24) to match the Figma lockup.
  { iconSrc: "/images/icons/service-weddings.svg", label: "Weddings & events", iconWidth: 48, iconHeight: 24 },
  { iconSrc: "/images/icons/service-excursions.svg", label: "Excursions & activities", iconWidth: 32, iconHeight: 32 },
];

export default async function HomePage() {
  const [villaResult, testimonialResult] = await Promise.all([
    getVillasWithSource(),
    getTestimonialsWithSource(),
  ]);
  const villas = villaResult.data;
  const testimonials = testimonialResult.data;
  const isUsingFallback =
    villaResult.source === "fallback" || testimonialResult.source === "fallback";

  const mixMatchVillas: MixMatchVilla[] = villas.map((villa) => ({
    id: villa.id,
    slug: villa.slug,
    name: villaName(villa),
    images: villaImages(villa),
    bedrooms: positiveNumber(villa.acf.bedrooms, villa.acf.habitaciones),
    suites: positiveNumber(villa.acf.suites_count),
    guests:
      positiveNumber(
        villa.acf.guests,
        villa.acf.max_guests,
        villa.acf.capacity,
        villa.acf.capacidad_personas,
      ) || positiveNumber(villa.acf.suites_count) * 2,
  }));

  const testimonialCards: TestimonialCardData[] = testimonials.map((item) => {
    const relatedId = Array.isArray(item.acf?.related_villa_id)
      ? item.acf.related_villa_id[0]
      : item.acf?.related_villa_id;
    const relatedVilla = villas.find((villa) => villa.id === relatedId);
    const authorPhoto = item.acf?.author_photo;

    return {
      id: item.id,
      quote: plainText(item.acf?.quote || item.content?.rendered || item.title?.rendered),
      authorName: plainText(item.acf?.author_name) || "Villa Coco guest",
      context:
        [plainText(item.acf?.lugar), formatTestimonialDate(item.acf?.fecha)]
          .filter(Boolean)
          .join(" · ") || plainText(item.acf?.author_context),
      photo:
        typeof authorPhoto === "string" && authorPhoto
          ? authorPhoto
          : typeof authorPhoto === "object" && authorPhoto?.url
            ? authorPhoto.url
            : undefined,
      villaName: relatedVilla ? villaName(relatedVilla) : "Villa Coco",
      rating: item.acf?.rating,
    };
  });

  return (
    <main className={`${styles.pageShell} ${raleway.variable}`}>
      <header className={styles.header}>
        <HeroNavbar />
      </header>

      <section id="home" className={styles.hero} aria-labelledby="villas-hero-title">
        <DataFallbackNotice visible={isUsingFallback} overlay />
        <div className={styles.atmosphere} aria-hidden="true" />

        <div className={styles.heroContent}>
          <div className={styles.brandLockup}>
            <div className={styles.logoFrame}>
              <Image
                src="/images/home/villas-logo.svg"
                alt=""
                width={204}
                height={204}
                className={styles.logo}
              />
            </div>

            <div className={styles.titleGroup}>
              <h1 id="villas-hero-title" className={styles.title}>Villas</h1>
              <p className={styles.villaNames}>
                Lola <span>•</span> Encantada <span>•</span> Coco <span>•</span> Cielo
              </p>
            </div>
          </div>

          <FindVillaChatButton className={styles.cta}>
            <Image
              className={styles.ctaIcon}
              src="/images/icons/find-villa.svg"
              alt=""
              width={32}
              height={32}
            />
            <span>Find my villa</span>
          </FindVillaChatButton>
        </div>
      </section>

      <section className={styles.introduction} aria-labelledby="villas-introduction-title">
        <div className={styles.introductionInner}>
          <div className={styles.introductionHeading}>
            <span className={styles.introductionIcon} aria-hidden="true">
              <Image src="/images/home/intro-palm-logo.svg" alt="" width={51} height={49} />
            </span>
            <h2 id="villas-introduction-title">Discover New Ways to <em>Paradise</em></h2>
          </div>

          <p className={styles.introductionText}>
            Lola, Encantada, Coco, and Cielo await on the pristine shores of Isla Mujeres.
            Each villa is a sanctuary where luxury whispers and moments linger.
          </p>
        </div>
      </section>

      <section id="villas" className={styles.collection} aria-labelledby="villa-collection-title">
        <header className={styles.collectionHeader}>
          <div className={styles.collectionEyebrow} aria-hidden="true">
            <span className={styles.collectionLine} />
            <span className={styles.collectionLabel}>Our Collection</span>
            <span className={styles.collectionLine} />
          </div>
          <h2 id="villa-collection-title" className={styles.collectionTitle}>Villas</h2>
        </header>

        <div className={styles.collectionCards}>
          {villas.map((villa) => <VillaCard key={villa.id} villa={villa} />)}
        </div>
      </section>

      <section id="mix-match" className={styles.mixMatch} aria-labelledby="mix-match-title">
        <header className={styles.darkSectionHeader}>
          <div className={styles.darkEyebrow}><span /><strong>Mix &</strong><span /></div>
          <h2 id="mix-match-title">Match</h2>
          <p>Pair two side-by-side villas for larger groups</p>
        </header>
        <MixMatchConfigurator villas={mixMatchVillas} />
      </section>

      <section id="testimonials" className={styles.testimonials} aria-labelledby="testimonials-title">
        <header className={styles.lightSectionHeader}>
          <div className={styles.lightEyebrow}><span /><strong>What people say about</strong><span /></div>
          <h2 id="testimonials-title">Coco B</h2>
        </header>
        <TestimonialCarousel testimonials={testimonialCards} />
      </section>

      <section id="services" className={styles.services} aria-labelledby="services-title">
        <header className={styles.lightSectionHeader}>
          <div className={styles.lightEyebrow}><span /><strong>Concierge</strong><span /></div>
          <h2 id="services-title">Services</h2>
        </header>

        <div className={styles.servicesStory}>
          <h3 className={styles.servicesStoryTitle}>
            <Image
              className={styles.servicesStoryIcon}
              src="/images/icons/service-concierge.svg"
              alt=""
              width={32}
              height={32}
            />
            <span>Concierge services</span>
          </h3>

          <div className={styles.servicesImage}>
            <Image
              src="/images/home/SERVICES.png"
              alt="Concierge ringing a service bell at a private coastal villa"
              width={400}
              height={405}
              sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 820px) calc(100vw - 40px), 400px"
            />
          </div>

          <div className={styles.servicesCopy}>
            <p><strong>Concierge excellence for your every desire.</strong> Housekeeping, gourmet breakfasts, curated experiences. Perfection orchestrated.</p>
            <ol>
              <li><Image className={styles.serviceStepIcon} src="/images/home/service-steps/step-01.svg" alt="" width={24} height={24} /><p><strong>Choose the right villa:</strong> Curated recommendations. Direct communication. No guesswork.</p></li>
              <li><Image className={styles.serviceStepIcon} src="/images/home/service-steps/step-02.svg" alt="" width={24} height={24} /><p><strong>Concierge coordination:</strong> Your dedicated concierge handles every detail of your stay.</p></li>
              <li><Image className={styles.serviceStepIcon} src="/images/home/service-steps/step-03.svg" alt="" width={24} height={24} /><p><strong>Seamless group planning:</strong> Invite your guests and build your itinerary in our private guest portal.</p></li>
              <li><Image className={styles.serviceStepIcon} src="/images/home/service-steps/step-04.svg" alt="" width={24} height={24} /><p><strong><em>Start planning your Tulum villa stay.</em></strong></p></li>
            </ol>
          </div>
        </div>

        <p className={styles.servicesComplement}>
          Complement your stay with our in-villa services &amp; on request experiences
        </p>

        <ul className={styles.serviceList} aria-label="Concierge services">
          {services.map(({ iconSrc, label, iconWidth, iconHeight }) => (
            <li key={label}>
              <Image
                className={styles.serviceIcon}
                src={iconSrc}
                alt=""
                width={iconWidth}
                height={iconHeight}
              />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer id="contact" className={styles.footer}>
        <div className={styles.footerInner}>
          <Image src="/images/home/villas-logo.svg" alt="Villa Coco" width={72} height={61} className={styles.footerLogo} />

          <div className={styles.footerColumns}>
            <section className={styles.footerDesk} aria-labelledby="front-desk-title">
              <h2 id="front-desk-title">Concierge & Front Desk</h2>
              <div className={styles.footerDeskDetails}>
                <p>(7 a.m. - 11 p.m. Central)</p>
                <a href="https://wa.me/529983154343">Call & WhatsApp: +52 - 998 - 315 - 4343</a>
                <a href="tel:+529982096937">Call: +52 998 209 6937</a>
              </div>
            </section>

            <section className={styles.footerDirect} aria-labelledby="direct-contact-title">
              <h2 id="direct-contact-title">Direct Contact</h2>
              <address>
                <a href="tel:+12065790798"><Phone aria-hidden="true" size={22} /> Mobile<br /><span>+1 206-579-0798</span></a>
                <a href="tel:+18334392626"><Phone aria-hidden="true" size={22} /> US Toll Free<br /><span>+1 833-439-2626</span></a>
                <a href="mailto:jeffrey@cocobisla.com"><Mail aria-hidden="true" size={22} /> Email<br /><span>jeffrey@cocobisla.com</span></a>
              </address>
            </section>
          </div>

          <p className={styles.cookiePreferences}>Cookies preferences</p>
        </div>
      </footer>
    </main>
  );
}
