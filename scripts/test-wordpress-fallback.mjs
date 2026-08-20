import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const snapshot = JSON.parse(
  await readFile(path.join(projectRoot, "data", "wordpress-fallback.json"), "utf8"),
);

assert.match(snapshot.generatedAt, /^\d{4}-\d{2}-\d{2}T/, "generatedAt debe ser una fecha ISO");
assert.ok(Array.isArray(snapshot.villas) && snapshot.villas.length > 0, "El fallback necesita villas");
assert.ok(
  Array.isArray(snapshot.testimonials) && snapshot.testimonials.length > 0,
  "El fallback necesita testimonios",
);

const slugs = new Set();
for (const villa of snapshot.villas) {
  assert.equal(typeof villa.id, "number", "Cada villa necesita id");
  assert.ok(villa.slug, "Cada villa necesita slug");
  assert.ok(!slugs.has(villa.slug), `Slug duplicado: ${villa.slug}`);
  slugs.add(villa.slug);
  assert.ok(villa.title?.rendered, `La villa ${villa.slug} necesita título`);
  assert.ok(villa.acf?.description_short, `La villa ${villa.slug} necesita descripción`);

  const featured = villa._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const gallery = [
    featured,
    villa.acf?.image_1?.url,
    villa.acf?.image_2?.url,
    villa.acf?.image_3?.url,
    villa.acf?.image_4?.url,
  ].filter(Boolean);
  assert.ok(gallery.length > 0, `La villa ${villa.slug} necesita al menos una imagen`);

  for (const imageUrl of gallery) {
    assert.match(imageUrl, /^\/images\/fallback\//, `Imagen no local: ${imageUrl}`);
    await access(path.join(projectRoot, "public", imageUrl.replace(/^\//, "")));
  }
}

for (const testimonial of snapshot.testimonials) {
  assert.ok(testimonial.acf?.quote, "Cada testimonio necesita una cita");
  assert.ok(testimonial.acf?.author_name, "Cada testimonio necesita autor");
  const photo = testimonial.acf?.author_photo;
  if (photo) {
    assert.match(photo, /^\/images\/fallback\//, `Foto no local: ${photo}`);
    await access(path.join(projectRoot, "public", photo.replace(/^\//, "")));
  }
}

console.log(
  `Fallback válido: ${snapshot.villas.length} villas, ${snapshot.testimonials.length} testimonios y recursos locales disponibles.`,
);
