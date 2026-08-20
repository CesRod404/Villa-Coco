import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import styles from "./not-found.module.css";

const raleway = localFont({
  src: [
    { path: "../fonts/Raleway-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Raleway-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-raleway",
});

export default function NotFound() {
  return (
    <main className={`${styles.page} ${raleway.variable}`}>
      <div className={styles.background} aria-hidden="true" />

      <Image
        src="/images/home/villas-logo.svg"
        alt="Villa Coco"
        width={166}
        height={143}
        preload
        className={styles.logo}
      />

      <section className={styles.message} aria-labelledby="not-found-title">
        <h1 id="not-found-title" className={styles.title}>
          <span>Oops! Page</span>
          <span>Not Found</span>
        </h1>

        <p className={styles.lead}>
          It seems that this wave
          <br />
          carried you very far away.
        </p>

        <p className={styles.description}>
          The page you are looking for does
          <br />
          not exist or has been moved. Return
          <br />
          to the shore and find your perfect
          <br />
          room by the sea.
        </p>
      </section>

      <Link href="/" className={styles.homeLink}>
        <svg
          className={styles.arrow}
          viewBox="100 691 14 15"
          aria-hidden="true"
        >
          <path d="M106.778 691.935L106.798 691.955L102.111 696.774L100.461 698.472L114 698.472L114 698.528L100.461 698.528L102.111 700.226L106.798 705.046L106.778 705.066L100.395 698.5L106.778 691.935Z" />
        </svg>
        <span>Back to home</span>
      </Link>

      <svg
        className={styles.wave}
        viewBox="0 0 402 115"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M402 0.949C335 76.983 268-75.085 201 0.949C134 76.983 67-75.085 0 0.949V115H402V0.949Z" />
      </svg>
    </main>
  );
}
