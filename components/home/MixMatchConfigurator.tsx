"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ResponsiveVillaImage } from "@/lib/images/villa-images";
import styles from "./MixMatchConfigurator.module.css";

export type MixMatchVilla = {
  id: number;
  slug: string;
  name: string;
  images: ResponsiveVillaImage[];
  bedrooms: number;
  suites: number;
  guests: number;
};

type VillaPair = {
  key: string;
  villas: [MixMatchVilla, MixMatchVilla];
};

type PairImageAssignments = Map<number, ResponsiveVillaImage | undefined>;

function ResilientPairImage({ image }: { image: ResponsiveVillaImage }) {
  const [src, setSrc] = useState(image.fallbackSrc || image.src);

  useEffect(() => {
    setSrc(image.fallbackSrc || image.src);
    if (!image.fallbackSrc || image.fallbackSrc === image.src) return;

    const candidate = new window.Image();
    candidate.onload = () => setSrc(image.src);
    candidate.src = image.src;
    return () => {
      candidate.onload = null;
    };
  }, [image.fallbackSrc, image.src]);

  return (
    <img
      src={src}
      srcSet={src === image.src ? image.srcSet : undefined}
      sizes="(max-width: 759px) calc(50vw - 28px), 171px"
      alt=""
      width={image.width}
      height={image.height}
      loading="lazy"
      decoding="async"
    />
  );
}

const preferredPairs = [
  ["lola", "encantada"],
  ["coco", "cielo"],
] as const;

function normalizedName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function shortName(name: string) {
  return name.replace(/^(casa|villa)\s+/i, "").trim();
}

function pairKey(first: MixMatchVilla, second: MixMatchVilla) {
  return [first.id, second.id].sort((a, b) => a - b).join("-");
}

function buildPairs(villas: MixMatchVilla[]): VillaPair[] {
  const pairs: VillaPair[] = [];
  const usedIds = new Set<number>();

  for (const [firstName, secondName] of preferredPairs) {
    const first = villas.find(
      (villa) => !usedIds.has(villa.id) && normalizedName(villa.name).includes(firstName),
    );
    const second = villas.find(
      (villa) =>
        villa.id !== first?.id &&
        !usedIds.has(villa.id) &&
        normalizedName(villa.name).includes(secondName),
    );

    if (first && second) {
      pairs.push({ key: pairKey(first, second), villas: [first, second] });
      usedIds.add(first.id);
      usedIds.add(second.id);
    }
  }

  const remaining = villas.filter((villa) => !usedIds.has(villa.id));
  for (let index = 0; index + 1 < remaining.length; index += 2) {
    const first = remaining[index];
    const second = remaining[index + 1];
    pairs.push({ key: pairKey(first, second), villas: [first, second] });
  }

  if (!pairs.length && villas.length >= 2) {
    pairs.push({ key: pairKey(villas[0], villas[1]), villas: [villas[0], villas[1]] });
  }

  return pairs.slice(0, 2);
}

function assignPairImages(pairs: VillaPair[]): PairImageAssignments {
  const assignments: PairImageAssignments = new Map();
  const usedSources = new Set<string>();

  for (const pair of pairs) {
    for (const villa of pair.villas) {
      const selected =
        villa.images.find((image) => !usedSources.has(image.src)) ||
        villa.images[0];

      assignments.set(villa.id, selected);
      if (selected) usedSources.add(selected.src);
    }
  }

  return assignments;
}

function PairCard({
  pair,
  images,
  selected,
  onSelect,
}: {
  pair: VillaPair;
  images: PairImageAssignments;
  selected: boolean;
  onSelect: () => void;
}) {
  const [first, second] = pair.villas;
  const roomTotal = first.bedrooms + second.bedrooms || first.suites + second.suites;
  const pairName = `${shortName(first.name)} & ${shortName(second.name)}`;

  return (
    <button
      type="button"
      className={`${styles.pairCard} ${selected ? styles.pairCardSelected : ""}`}
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      aria-label={`Select ${pairName}`}
    >
      <span className={styles.pairHeading}>
        <strong>{pairName}</strong>
        <span>{roomTotal} Total Bedrooms / Suites</span>
      </span>

      <span className={styles.pairImages} aria-hidden="true">
        {[first, second].map((villa) => {
          const image = images.get(villa.id);

          return (
            <span className={styles.imageFrame} key={villa.id}>
              {image ? (
                <ResilientPairImage image={image} />
              ) : (
                <span>Image coming soon</span>
              )}
            </span>
          );
        })}
      </span>
    </button>
  );
}

export default function MixMatchConfigurator({ villas }: { villas: MixMatchVilla[] }) {
  const pairs = useMemo(() => buildPairs(villas), [villas]);
  const pairImages = useMemo(() => assignPairImages(pairs), [pairs]);
  const [selectedKey, setSelectedKey] = useState<string | undefined>(pairs[0]?.key);
  const selectedPair = pairs.find((pair) => pair.key === selectedKey) || pairs[0];
  const [first, second] = selectedPair?.villas || [];
  const pairReady = Boolean(first && second);
  const bookingHref = pairReady
    ? `/villas/${first.slug}?with=${encodeURIComponent(second.slug)}#reservation`
    : "#mix-match";

  return (
    <div className={styles.configurator}>
      {pairs.length ? (
        <div className={styles.pairGrid} role="radiogroup" aria-label="Side-by-side villa combinations">
          {pairs.map((pair) => (
            <PairCard
              key={pair.key}
              pair={pair}
              images={pairImages}
              selected={pair.key === selectedPair?.key}
              onSelect={() => setSelectedKey(pair.key)}
            />
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>
          Publish at least two villas in WordPress to activate Mix & Match.
        </p>
      )}

      <p className={styles.selectionStatus} aria-live="polite">
        {pairReady ? `${first.name} and ${second.name} selected` : "Select two villas"}
      </p>

      {pairReady ? (
        <Link className={styles.inquire} href={bookingHref}>
          Inquire here
        </Link>
      ) : (
        <span className={`${styles.inquire} ${styles.disabled}`} aria-disabled="true">
          Inquire here
        </span>
      )}
    </div>
  );
}
