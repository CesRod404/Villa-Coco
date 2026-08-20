import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const fallbackRoot = path.join(projectRoot, "public", "images", "fallback", "wordpress");
const snapshotPath = path.join(projectRoot, "data", "wordpress-fallback.json");
const requestHeaders = { "ngrok-skip-browser-warning": "1" };

async function loadLocalEnvironment() {
  try {
    const contents = await readFile(path.join(projectRoot, ".env.local"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (!match || process.env[match[1].trim()]) continue;
      process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

await loadLocalEnvironment();

const wordpressBaseUrl = (
  process.env.WORDPRESS_API_URL ||
  process.env.WORDPRESS_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_WORDPRESS_URL ||
  "http://localhost:8881"
).replace(/\/+$/, "");
const apiUrl = `${wordpressBaseUrl}/wp-json/wp/v2`;

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: requestHeaders,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`WordPress respondió ${response.status} para ${new URL(url).pathname}`);
  }
  return response.json();
}

function safeFilePart(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function extensionFor(url, contentType) {
  const urlExtension = path.extname(new URL(url).pathname).toLowerCase();
  if (/^\.(avif|gif|jpe?g|png|svg|webp)$/.test(urlExtension)) return urlExtension;

  const byType = {
    "image/avif": ".avif",
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
  };
  return byType[contentType?.split(";")[0]] || ".img";
}

async function saveImage(sourceUrl, relativeStem) {
  if (!sourceUrl) return null;

  const response = await fetch(sourceUrl, {
    headers: requestHeaders,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`No se pudo descargar ${new URL(sourceUrl).pathname}: ${response.status}`);
  }

  const extension = extensionFor(sourceUrl, response.headers.get("content-type"));
  const relativePath = `${relativeStem}${extension}`.replaceAll("\\", "/");
  const destination = path.join(fallbackRoot, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  return `/images/fallback/wordpress/${relativePath}`;
}

const mediaRequests = new Map();
async function getMedia(mediaId) {
  if (!mediaRequests.has(mediaId)) {
    mediaRequests.set(mediaId, fetchJson(`${apiUrl}/media/${mediaId}`));
  }
  return mediaRequests.get(mediaId);
}

async function localizeImageField(field, relativeStem) {
  if (!field) return null;

  const media = typeof field === "number" ? await getMedia(field) : null;
  const sourceUrl =
    media?.source_url ||
    (typeof field === "string" ? field : field?.url || field?.src);
  if (!sourceUrl) return null;

  const localUrl = await saveImage(sourceUrl, relativeStem);
  return {
    url: localUrl,
    alt: media?.alt_text || field?.alt || "",
    width: Number(media?.media_details?.width || field?.width) || undefined,
    height: Number(media?.media_details?.height || field?.height) || undefined,
  };
}

async function snapshotVilla(villa) {
  const copy = structuredClone(villa);
  const slug = safeFilePart(copy.slug || copy.id);
  const featured = copy._embedded?.["wp:featuredmedia"]?.[0];

  if (featured?.source_url) {
    featured.source_url = await saveImage(featured.source_url, `${slug}/featured`);
  }

  for (const fieldName of ["image_1", "image_2", "image_3", "image_4"]) {
    copy.acf[fieldName] = await localizeImageField(copy.acf?.[fieldName], `${slug}/${fieldName}`);
  }

  if (Array.isArray(copy.acf?.gallery)) {
    copy.acf.gallery = await Promise.all(
      copy.acf.gallery.map(async (image, index) => {
        const localized = await localizeImageField(image, `${slug}/gallery-${index + 1}`);
        return localized || image;
      }),
    );
  }

  return copy;
}

async function snapshotTestimonial(testimonial) {
  const copy = structuredClone(testimonial);
  const photo = copy.acf?.author_photo;
  if (!photo) return copy;

  const localized = await localizeImageField(
    photo,
    `testimonials/${safeFilePart(copy.id)}-author`,
  );
  copy.acf.author_photo = localized?.url || undefined;
  return copy;
}

const [rawVillas, rawTestimonials] = await Promise.all([
  fetchJson(`${apiUrl}/villa?_embed`),
  fetchJson(`${apiUrl}/testimonio?_embed`),
]);

const [villas, testimonials] = await Promise.all([
  Promise.all(rawVillas.map(snapshotVilla)),
  Promise.all(rawTestimonials.map(snapshotTestimonial)),
]);

const snapshot = {
  generatedAt: new Date().toISOString(),
  villas,
  testimonials,
};

await mkdir(path.dirname(snapshotPath), { recursive: true });
await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

console.log(`Fallback actualizado: ${villas.length} villas y ${testimonials.length} testimonios.`);
