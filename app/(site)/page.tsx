import Image from "next/image";
import localFont from "next/font/local";
import { Sparkles } from "lucide-react";
import FindVillaChatButton from "@/components/home/FindVillaChatButton";
import HeroNavbar from "@/components/home/HeroNavbar";
import VillaCard from "@/components/villa/VillaCard";
import { getVillas } from "@/lib/wp";
import styles from "./home.module.css";

const raleway = localFont({
  src: [
    { path: "../fonts/Raleway-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Raleway-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-raleway",
});

export default async function HomePage() {
  const villas = await getVillas();

  return (
    <main className={`${styles.pageShell} ${raleway.variable}`}>
      <section className={styles.hero} aria-labelledby="villas-hero-title">
        <div className={styles.atmosphere} aria-hidden="true" />

        <header className={styles.header}>
          <HeroNavbar />
        </header>

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
              <h1 id="villas-hero-title" className={styles.title}>
                Villas
              </h1>
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

      <section
        className={styles.introduction}
        aria-labelledby="villas-introduction-title"
      >
        <div className={styles.introductionInner}>
          <div className={styles.introductionHeading}>
            <span className={styles.introductionIcon} aria-hidden="true">
              <Image
                src="/images/home/intro-palm-logo.svg"
                alt=""
                width={51}
                height={49}
              />
            </span>
            <h2 id="villas-introduction-title">
              Discover New Ways to <em>Paradise</em>
            </h2>
          </div>

          <p className={styles.introductionText}>
            Lola, Encantada, Coco, and Cielo await on the pristine shores of
            Isla Mujeres. Each villa is a sanctuary where luxury whispers and
            moments linger.
          </p>
        </div>
      </section>

      <section
        className={styles.collection}
        aria-labelledby="villa-collection-title"
      >
        <header className={styles.collectionHeader}>
          <div className={styles.collectionEyebrow} aria-hidden="true">
            <span className={styles.collectionLine} />
            <span className={styles.collectionLabel}>Our Collection</span>
            <span className={styles.collectionLine} />
          </div>

          <h2 id="villa-collection-title" className={styles.collectionTitle}>
            Villas
          </h2>
        </header>

        <div className={styles.collectionCards}>
          {villas.map((villa) => (
            <VillaCard key={villa.id} villa={villa} />
          ))}
        </div>
      </section>
    </main>
  );
}
