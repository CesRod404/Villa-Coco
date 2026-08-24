import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const manifest = JSON.parse(
  await readFile(path.join(projectRoot, "data", "villa-images-manifest.json"), "utf8"),
);

assert.equal(manifest.quality, 75, "Las variantes deben generarse con calidad WebP 75");
assert.ok(Object.keys(manifest.villas || {}).length > 0, "El manifiesto necesita villas");

let imageCount = 0;
for (const [slug, villa] of Object.entries(manifest.villas)) {
  assert.equal(villa.images.length, 8, `${slug} debe tener exactamente 8 imágenes`);
  for (const image of villa.images) {
    assert.match(image.field, /^image_[1-8]$/, `Campo inválido en ${slug}`);
    for (const variantName of ["thumb", "card", "gallery"]) {
      const variant = image.variants[variantName];
      assert.ok(variant?.src, `Falta ${variantName} en ${slug}/${image.field}`);
      const filePath = path.join(projectRoot, "public", variant.src.replace(/^\//, ""));
      await access(filePath);
      const fileStats = await stat(filePath);
      assert.ok(
        fileStats.size <= manifest.budgets[variantName],
        `${variant.src} excede ${manifest.budgets[variantName]} bytes`,
      );
      const metadata = await sharp(filePath).metadata();
      assert.equal(metadata.format, "webp", `${variant.src} debe ser WebP`);
      assert.equal(metadata.width, variant.width, `Ancho incorrecto en ${variant.src}`);
      assert.equal(metadata.height, variant.height, `Alto incorrecto en ${variant.src}`);
    }
    imageCount += 1;
  }
}

console.log(
  `Pipeline válido: ${imageCount} masters, ${imageCount * 3} WebP y todos dentro del presupuesto.`,
);
