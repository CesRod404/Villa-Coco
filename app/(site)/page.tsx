import Image from "next/image";
import localFont from "next/font/local";
import {
  BellRing,
  ChefHat,
  Compass,
  Heart,
  Mail,
  Phone,
  Ship,
  Sparkles,
  Waves,
} from "lucide-react";
import FindVillaChatButton from "@/components/home/FindVillaChatButton";
import HeroNavbar from "@/components/home/HeroNavbar";
import MixMatchConfigurator, {
  type MixMatchVilla,
} from "@/components/home/MixMatchConfigurator";
import TestimonialCarousel, {
  type TestimonialCardData,
} from "@/components/home/TestimonialCarousel";
import VillaCard from "@/components/villa/VillaCard";
import { getTestimonials, getVillas } from "@/lib/wp";
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

function villaImage(villa: Villa) {
  return villa._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
}

const services = [
  { icon: BellRing, label: "24-hour concierge" },
  { icon: Waves, label: "Yoga & wellness" },
  { icon: Ship, label: "Private boat transfers" },
  { icon: ChefHat, label: "Private chef on request" },
  { icon: Heart, label: "Weddings & events" },
  { icon: Compass, label: "Excursions & activities" },
];

export default async function HomePage() {
  const [villas, testimonials] = await Promise.all([
    getVillas(),
    getTestimonials(),
  ]);

  const mixMatchVillas: MixMatchVilla[] = villas.map((villa) => ({
    id: villa.id,
    slug: villa.slug,
    name: villaName(villa),
    image: villaImage(villa),
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
      context: plainText(item.acf?.author_context),
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
            <Sparkles aria-hidden="true" size={27} strokeWidth={2.25} />
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
          <div className={styles.servicesImage}>
            <Image
              src="/images/home/concierge-services.png"
              alt="Concierge ringing a service bell at a private coastal villa"
              width={1536}
              height={1024}
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>

          <div className={styles.servicesCopy}>
            <p><strong>Concierge excellence for your every desire.</strong> Housekeeping, gourmet breakfasts and curated experiences—every detail orchestrated around your stay.</p>
            <ol>
              <li><span>01</span><p><strong>Choose the right villa.</strong> Curated recommendations and direct communication.</p></li>
              <li><span>02</span><p><strong>Concierge coordination.</strong> One dedicated host handles every detail.</p></li>
              <li><span>03</span><p><strong>Seamless group planning.</strong> Invite your guests and shape the itinerary together.</p></li>
              <li><span>04</span><p><strong>Arrive and exhale.</strong> Your Isla Mujeres stay is ready.</p></li>
            </ol>
          </div>
        </div>

        <ul className={styles.serviceList} aria-label="Concierge services">
          {services.map(({ icon: Icon, label }) => (
            <li key={label}><Icon aria-hidden="true" size={34} strokeWidth={1.7} /><span>{label}</span></li>
          ))}
        </ul>
      </section>

      <footer id="contact" className={styles.footer}>
        <div className={styles.footerInner}>
          <Image src="/images/home/villas-logo.svg" alt="Villa Coco" width={130} height={130} className={styles.footerLogo} />

          <section aria-labelledby="direct-contact-title">
            <h2 id="direct-contact-title">Direct Contact</h2>
            <address>
              <a href="tel:+12065790798"><Phone aria-hidden="true" size={22} /> Mobile<br /><span>+1 206-579-0798</span></a>
              <a href="tel:+18334392626"><Phone aria-hidden="true" size={22} /> US Toll Free<br /><span>+1 833-439-2626</span></a>
              <a href="mailto:jeffrey@cocobisla.com"><Mail aria-hidden="true" size={22} /> Email<br /><span>jeffrey@cocobisla.com</span></a>
            </address>
          </section>

          <section aria-labelledby="front-desk-title">
            <h2 id="front-desk-title">Concierge & Front Desk</h2>
            <p>(7 a.m. – 11 p.m. Central)</p>
            <a href="https://wa.me/529983154343">Call & WhatsApp: +52 998 315 4343</a>
            <a href="tel:+529982096937">Call: +52 998 209 6937</a>
          </section>
        </div>
        <p className={styles.copyright}>© {new Date().getFullYear()} Villa Coco · Isla Mujeres, México</p>
      </footer>
    </main>
  );
}
