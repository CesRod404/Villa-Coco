export type MixMatchVillaIdentity = {
  id: number;
  slug: string;
  name: string;
};

export type MixMatchPair<TVilla extends MixMatchVillaIdentity = MixMatchVillaIdentity> = {
  key: string;
  villas: [TVilla, TVilla];
};

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

function pairKey(first: MixMatchVillaIdentity, second: MixMatchVillaIdentity) {
  return [first.id, second.id].sort((a, b) => a - b).join("-");
}

export function buildMixMatchPairs<TVilla extends MixMatchVillaIdentity>(
  villas: TVilla[],
): Array<MixMatchPair<TVilla>> {
  const pairs: Array<MixMatchPair<TVilla>> = [];
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

export function buildMixMatchBookingHref(
  pair?: MixMatchPair,
): string | undefined {
  if (!pair) return undefined;

  const [first, second] = pair.villas;
  if (!first.slug || !second.slug || first.id === second.id) return undefined;

  return `/villas/${encodeURIComponent(first.slug)}?with=${encodeURIComponent(second.slug)}#reservation`;
}
