import styles from "./DataFallbackNotice.module.css";

type DataFallbackNoticeProps = {
  visible: boolean;
  overlay?: boolean;
};

export default function DataFallbackNotice({
  visible,
  overlay = false,
}: DataFallbackNoticeProps) {
  if (!visible) return null;

  return (
    <aside
      className={`${styles.notice} ${overlay ? styles.overlay : ""}`}
      role="status"
      title="WordPress no está disponible; se muestran los últimos datos guardados."
    >
      <span className={styles.statusDot} aria-hidden="true" />
      <span>Caché de datos de villas y reseñas</span>
    </aside>
  );
}
