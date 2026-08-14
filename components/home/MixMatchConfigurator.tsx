"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BedDouble, Users } from "lucide-react";
import styles from "./MixMatchConfigurator.module.css";

export type MixMatchVilla = {
  id: number;
  slug: string;
  name: string;
  image?: string;
  bedrooms: number;
  suites: number;
  guests: number;
};

function VillaChoice({
  label,
  selectedId,
  onChange,
  villas,
}: {
  label: string;
  selectedId?: number;
  onChange: (id: number) => void;
  villas: MixMatchVilla[];
}) {
  const villa = villas.find((item) => item.id === selectedId);

  return (
    <article className={styles.choice}>
      <label className={styles.selectLabel}>
        <span>{label}</span>
        <select
          value={selectedId ?? ""}
          onChange={(event) => onChange(Number(event.target.value))}
          disabled={villas.length < 2}
        >
          <option value="" disabled>
            Select a villa
          </option>
          {villas.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.imageFrame}>
        {villa?.image ? (
          <img src={villa.image} alt={villa.name} loading="lazy" />
        ) : (
          <span>{villas.length < 2 ? "Add another villa in WordPress" : "Image coming soon"}</span>
        )}
      </div>

      <div className={styles.choiceMeta}>
        <strong>{villa?.name || "Villa"}</strong>
        <span>
          <BedDouble aria-hidden="true" size={18} />
          {villa?.bedrooms || 0} bedrooms
        </span>
      </div>
    </article>
  );
}

export default function MixMatchConfigurator({ villas }: { villas: MixMatchVilla[] }) {
  const [firstId, setFirstId] = useState<number | undefined>(villas[0]?.id);
  const [secondId, setSecondId] = useState<number | undefined>(villas[1]?.id);

  const first = villas.find((villa) => villa.id === firstId);
  const second = villas.find((villa) => villa.id === secondId);

  const totals = useMemo(
    () => ({
      bedrooms: (first?.bedrooms || 0) + (second?.bedrooms || 0),
      suites: (first?.suites || 0) + (second?.suites || 0),
      guests: (first?.guests || 0) + (second?.guests || 0),
    }),
    [first, second],
  );

  const pairReady = Boolean(first && second && first.id !== second.id);
  const bookingHref = pairReady
    ? `/villas/${first!.slug}?with=${encodeURIComponent(second!.slug)}#reservation`
    : "#mix-match";

  function selectFirst(id: number) {
    setFirstId(id);
    if (id === secondId) setSecondId(villas.find((villa) => villa.id !== id)?.id);
  }

  function selectSecond(id: number) {
    setSecondId(id);
    if (id === firstId) setFirstId(villas.find((villa) => villa.id !== id)?.id);
  }

  return (
    <div className={styles.configurator}>
      <div className={styles.pairGrid}>
        <VillaChoice label="First villa" selectedId={firstId} onChange={selectFirst} villas={villas} />

        <div className={styles.plus} aria-hidden="true">
          +
        </div>

        <VillaChoice label="Second villa" selectedId={secondId} onChange={selectSecond} villas={villas} />
      </div>

      <div className={styles.summary} aria-live="polite">
        {pairReady ? (
          <>
            <div>
              <span>Your private compound</span>
              <strong>
                {first!.name} + {second!.name}
              </strong>
            </div>
            <dl>
              <div>
                <dt>Bedrooms / suites</dt>
                <dd>{totals.bedrooms || totals.suites}</dd>
              </div>
              <div>
                <dt>Up to</dt>
                <dd>
                  <Users aria-hidden="true" size={18} /> {totals.guests} guests
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p>
            Publish at least two villas in WordPress to activate combined availability and booking.
          </p>
        )}
      </div>

      {pairReady ? (
        <Link className={styles.inquire} href={bookingHref}>
          Check both calendars
          <ArrowRight aria-hidden="true" size={20} />
        </Link>
      ) : (
        <span className={`${styles.inquire} ${styles.disabled}`} aria-disabled="true">
          Check both calendars
          <ArrowRight aria-hidden="true" size={20} />
        </span>
      )}
    </div>
  );
}
