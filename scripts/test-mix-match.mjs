import assert from "node:assert/strict";
import {
  buildMixMatchBookingHref,
  buildMixMatchPairs,
} from "../lib/mix-match.ts";

const villas = [
  { id: 129, slug: "casa-cielo", name: "Casa Cielo" },
  { id: 128, slug: "casa-encantada", name: "Casa Encantada" },
  { id: 126, slug: "casa-lola", name: "Casa Lola" },
  { id: 55, slug: "casa-coco", name: "Casa Coco" },
];

const pairs = buildMixMatchPairs(villas);

assert.equal(pairs.length, 2);
assert.equal(pairs[0].key, "126-128");
assert.equal(pairs[1].key, "55-129");
assert.equal(
  buildMixMatchBookingHref(pairs[0]),
  "/villas/casa-lola?with=casa-encantada#reservation",
);
assert.equal(
  buildMixMatchBookingHref(pairs[1]),
  "/villas/casa-coco?with=casa-cielo#reservation",
);
assert.equal(buildMixMatchBookingHref(undefined), undefined);

console.log("Mix & Match válido: cada opción abre su propia combinación de dos villas.");
