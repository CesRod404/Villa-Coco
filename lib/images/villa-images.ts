import manifestJson from "@/data/villa-images-manifest.json";
import type { AcfImageField, Villa } from "@/types/wordpress";

type ImageVariant = {
  src: string;
  width: number;
  height: number;
  bytes: number;
};

type ManifestImage = {
  field: string;
  alt: string;
  variants: {
    thumb: ImageVariant;
    card: ImageVariant;
    gallery: ImageVariant;
  };
};

type VillaImageManifest = {
  villas: Record<string, { images: ManifestImage[] }>;
};

export type ResponsiveVillaImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  srcSet?: string;
  thumbSrc: string;
  thumbWidth: number;
  thumbHeight: number;
  cardSrc: string;
  cardWidth: number;
  cardHeight: number;
  fallbackSrc?: string;
};

const manifest = manifestJson as VillaImageManifest;

function responsiveSourceSet(card: ImageVariant, gallery: ImageVariant) {
  const variants = [card, gallery]
    .filter((variant, index, list) =>
      list.findIndex((candidate) => candidate.width === variant.width) === index,
    )
    .sort((first, second) => first.width - second.width);

  return variants.map((variant) => `${variant.src} ${variant.width}w`).join(", ");
}

function fromManifest(villa: Villa): ResponsiveVillaImage[] {
  const entry = manifest.villas[villa.slug];
  if (!entry) return [];

  return entry.images.map((image) => ({
    src: image.variants.gallery.src,
    alt: image.alt || "",
    width: image.variants.gallery.width,
    height: image.variants.gallery.height,
    srcSet: responsiveSourceSet(image.variants.card, image.variants.gallery),
    thumbSrc: image.variants.thumb.src,
    thumbWidth: image.variants.thumb.width,
    thumbHeight: image.variants.thumb.height,
    cardSrc: image.variants.card.src,
    cardWidth: image.variants.card.width,
    cardHeight: image.variants.card.height,
  }));
}

function acfImages(villa: Villa): AcfImageField[] {
  return [
    villa.acf?.image_1,
    villa.acf?.image_2,
    villa.acf?.image_3,
    villa.acf?.image_4,
    villa.acf?.image_5,
    villa.acf?.image_6,
    villa.acf?.image_7,
    villa.acf?.image_8,
  ].filter((image): image is AcfImageField => Boolean(image?.url));
}

function fromWordpress(villa: Villa): ResponsiveVillaImage[] {
  const fields = acfImages(villa);
  const featured = villa._embedded?.["wp:featuredmedia"]?.[0];
  if (!fields.length && featured?.source_url) {
    fields.push({
      url: featured.source_url,
      alt: featured.alt_text || "",
      width: featured.media_details?.width,
      height: featured.media_details?.height,
    });
  }

  return fields.reduce<ResponsiveVillaImage[]>((images, image) => {
    if (!image.url || images.some((existing) => existing.src === image.url)) return images;
    const width = image.width || 1200;
    const height = image.height || Math.round(width * 0.667);
    images.push({
      src: image.url,
      alt: image.alt || "",
      width,
      height,
      thumbSrc: image.url,
      thumbWidth: width,
      thumbHeight: height,
      cardSrc: image.url,
      cardWidth: width,
      cardHeight: height,
    });
    return images;
  }, []);
}

export function getVillaImages(villa: Villa, fallbackVilla?: Villa): ResponsiveVillaImage[] {
  const optimized = fromManifest(villa);
  if (optimized.length) return optimized;

  const liveImages = fromWordpress(villa);
  if (!fallbackVilla) return liveImages;
  const fallbackImages = fromManifest(fallbackVilla).length
    ? fromManifest(fallbackVilla)
    : fromWordpress(fallbackVilla);

  return liveImages.map((image, index) => ({
    ...image,
    fallbackSrc: fallbackImages[index]?.src || fallbackImages[0]?.src,
  }));
}

export function getVillaPrimaryImage(villa: Villa, fallbackVilla?: Villa) {
  return getVillaImages(villa, fallbackVilla)[0];
}
