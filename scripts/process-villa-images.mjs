import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const mastersRoot = path.join(projectRoot, ".cache", "villa-image-masters");
const outputRoot = path.join(projectRoot, "public", "images", "villas");
const manifestPath = path.join(projectRoot, "data", "villa-images-manifest.json");
const requestHeaders = { "ngrok-skip-browser-warning": "1" };
const imageFields = Array.from({ length: 8 }, (_, index) => `image_${index + 1}`);

const variants = {
  thumb: { maxWidth: 240, budget: 25 * 1024 },
  card: { maxWidth: 800, budget: 100 * 1024 },
  gallery: { maxWidth: 1600, budget: 250 * 1024 },
};

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

function safeFilePart(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function publicPath(filePath) {
  return `/${path.relative(path.join(projectRoot, "public"), filePath).replaceAll("\\", "/")}`;
}

async function fetchResponse(url) {
  const response = await fetch(url, {
    headers: requestHeaders,
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) {
    throw new Error(`WordPress respondió ${response.status} para ${new URL(url).pathname}`);
  }
  return response;
}

async function fetchJson(url) {
  return (await fetchResponse(url)).json();
}

function sourceFromField(field, mediaById) {
  const media = typeof field === "number" ? mediaById.get(field) : null;
  const url =
    media?.source_url ||
    (typeof field === "string" ? field : field?.url || field?.src);
  if (!url) return null;

  return {
    url,
    alt: media?.alt_text || field?.alt || "",
    width: Number(media?.media_details?.width || field?.width) || undefined,
    height: Number(media?.media_details?.height || field?.height) || undefined,
    mediaId: media?.id || (typeof field === "number" ? field : undefined),
  };
}

async function downloadMaster(source, slug, fieldName) {
  const response = await fetchResponse(source.url);
  const contentType = response.headers.get("content-type")?.split(";")[0] || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`${slug}/${fieldName} no devolvió una imagen (${contentType || "sin content-type"})`);
  }

  const extension = contentType === "image/jpeg" ? ".jpeg" : `.${contentType.split("/")[1] || "img"}`;
  const destination = path.join(mastersRoot, slug, `${fieldName}${extension}`);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  return destination;
}

function targetWidth(variantName, sourceWidth) {
  if (variantName === "gallery") return Math.min(variants.gallery.maxWidth, sourceWidth);
  if (variantName === "card") {
    const widthBelowGallery = Math.max(320, Math.round(sourceWidth * 0.8));
    return Math.min(variants.card.maxWidth, widthBelowGallery, sourceWidth);
  }
  return Math.min(variants.thumb.maxWidth, sourceWidth);
}

async function renderWithinBudget(masterPath, destination, variantName, sourceWidth) {
  const config = variants[variantName];
  let width = targetWidth(variantName, sourceWidth);
  let result;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    result = await sharp(masterPath)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 75, effort: 6, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });

    if (result.data.byteLength <= config.budget) break;
    width = Math.max(96, Math.floor(width * 0.9));
  }

  if (!result || result.data.byteLength > config.budget) {
    throw new Error(
      `${path.basename(masterPath)} excede el presupuesto ${variantName}: ${result?.data.byteLength || 0} bytes`,
    );
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, result.data);
  return {
    src: publicPath(destination),
    width: result.info.width,
    height: result.info.height,
    bytes: result.data.byteLength,
  };
}

await loadLocalEnvironment();

const wordpressBaseUrl = (
  process.env.WORDPRESS_API_URL ||
  process.env.WORDPRESS_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_WORDPRESS_URL ||
  "http://localhost:8881"
).replace(/\/+$/, "");
const apiUrl = `${wordpressBaseUrl}/wp-json/wp/v2`;
const villas = await fetchJson(`${apiUrl}/villa?_embed&per_page=100`);

const mediaIds = [
  ...new Set(
    villas.flatMap((villa) =>
      imageFields
        .map((fieldName) => villa.acf?.[fieldName])
        .filter((field) => typeof field === "number" && field > 0),
    ),
  ),
];
const media = mediaIds.length
  ? await fetchJson(
      `${apiUrl}/media?${mediaIds.map((id) => `include[]=${id}`).join("&")}&per_page=${mediaIds.length}`,
    )
  : [];
const mediaById = new Map(media.map((item) => [item.id, item]));

const manifest = {
  generatedAt: new Date().toISOString(),
  quality: 75,
  budgets: Object.fromEntries(
    Object.entries(variants).map(([name, config]) => [name, config.budget]),
  ),
  villas: {},
};

for (const villa of villas) {
  const slug = safeFilePart(villa.slug || villa.id);
  const images = [];

  for (const fieldName of imageFields) {
    const source = sourceFromField(villa.acf?.[fieldName], mediaById);
    if (!source) continue;

    const masterPath = await downloadMaster(source, slug, fieldName);
    const metadata = await sharp(masterPath).metadata();
    const sourceWidth = metadata.width || source.width;
    const sourceHeight = metadata.height || source.height;
    if (!sourceWidth || !sourceHeight) {
      throw new Error(`No se pudieron leer las dimensiones de ${slug}/${fieldName}`);
    }

    const outputDirectory = path.join(outputRoot, slug);
    const generated = {};
    for (const variantName of ["thumb", "card", "gallery"]) {
      generated[variantName] = await renderWithinBudget(
        masterPath,
        path.join(outputDirectory, `${fieldName}-${variantName}.webp`),
        variantName,
        sourceWidth,
      );
    }

    images.push({
      field: fieldName,
      mediaId: source.mediaId,
      alt: source.alt,
      original: {
        url: source.url,
        width: sourceWidth,
        height: sourceHeight,
        format: metadata.format,
      },
      variants: generated,
    });
  }

  if (!images.length) throw new Error(`La villa ${slug} no tiene imágenes image_1…image_8`);
  manifest.villas[slug] = { id: villa.id, images };
  console.log(`${slug}: ${images.length} JPEG procesados a WebP`);
}

await mkdir(path.dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Manifiesto generado en ${path.relative(projectRoot, manifestPath)}`);
