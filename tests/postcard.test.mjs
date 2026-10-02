import test from "node:test";
import assert from "node:assert/strict";
import { makeCard, isCard, templates, photoData } from "../src/lib/postcard.ts";

test("every template produces a complete serializable, independent document", () => {
  for (const template of templates) {
    const card = makeCard(template.id);
    assert.equal(isCard(JSON.parse(JSON.stringify(card))), true);
    assert.equal(card.template, template.id);
    assert.equal(
      new Set(card.layers.map((l) => l.id)).size,
      card.layers.length,
    );
    card.layers[0].text = "Edited";
    assert.notEqual(makeCard(template.id).layers[0].text, "Edited");
  }
});
test("unknown template falls back to a usable starter", () => {
  assert.equal(makeCard("unknown").name, "Endless summer");
  assert.equal(isCard(makeCard("unknown")), true);
});
test("storage validator rejects missing fields and malformed layers without throwing", () => {
  for (const value of [
    null,
    {},
    [],
    { ...makeCard(), layers: [null] },
    { ...makeCard(), layers: [{ id: "bad" }] },
  ]) {
    assert.equal(isCard(value), false);
  }
});
test("storage validator rejects remote image sources and non-finite geometry", () => {
  assert.equal(
    isCard({ ...makeCard(), photo: "https://example.com/tracker.jpg" }),
    false,
  );
  assert.equal(isCard({ ...makeCard(), zoom: Infinity }), false);
  assert.equal(isCard({ ...makeCard(), zoom: 0.5 }), false);
  const card = makeCard();
  card.layers[0].x = NaN;
  assert.equal(isCard(card), false);
});
test("storage validator permits normalized local photo data and caps layer count", () => {
  const card = makeCard();
  assert.equal(
    isCard({ ...card, photo: "data:image/jpeg;base64,/9j/AA==" }),
    true,
  );
  assert.equal(
    isCard({ ...card, layers: Array(31).fill(card.layers[0]) }),
    false,
  );
});
test("photo upload rejects unsupported media before decoding", async () => {
  await assert.rejects(
    photoData(new File(["<svg/>"], "image.svg", { type: "image/svg+xml" })),
    /JPG, PNG or WebP/,
  );
});
test("photo upload rejects oversized media before decoding", async () => {
  await assert.rejects(
    photoData(
      new File([new Uint8Array(16 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      }),
    ),
    /15 MB/,
  );
});
