import Image from "next/image";
import localFont from "next/font/local";
import styles from "./loading.module.css";

const raleway = localFont({
  src: [
    { path: "../fonts/Raleway-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Raleway-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-raleway",
});

export default function Loading() {
  return (
    <main
      className={`${styles.screen} ${raleway.variable}`}
      role="status"
      aria-live="polite"
      aria-label="Cargando Villa Coco"
    >
      <div className={styles.brand}>
        <div className={styles.mark} aria-hidden="true">
          <span className={styles.orbit} />
          <span className={styles.seal}>
            <Image
              src="/images/home/villas-logo.svg"
              alt=""
              width={166}
              height={143}
              preload
              className={styles.logo}
            />
          </span>
        </div>

        <div className={styles.copy}>
          <p className={styles.wordmark}>COCO·B·ISLA</p>
          <p className={styles.loadingText}>LOADING</p>
        </div>
      </div>
    </main>
  );
}
