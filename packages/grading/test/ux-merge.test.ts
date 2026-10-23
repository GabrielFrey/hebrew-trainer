import assert from "node:assert/strict";
import test from "node:test";
import { glyphForChar, glyphs, recognise, strokesFromGlyph } from "../../../apps/mobile/lib/handwriting.ts";
import { addDailyXp, dailyXp, expectedAnswer } from "../../../apps/mobile/lib/offline-content.ts";

test("handwriting: 22 letters + 5 finals, each recognised from its own template", () => {
  assert.equal(glyphs.length, 27);
  for (const g of glyphs) assert.equal(recognise(strokesFromGlyph(g), g.id).verdict, "match", g.char);
});

test("handwriting: another letter is never accepted as the expected one", () => {
  const alef = glyphForChar("א")!;
  const shin = glyphForChar("ש")!;
  assert.notEqual(recognise(strokesFromGlyph(shin), alef.id).verdict, "match");
  assert.equal(recognise([], alef.id).verdict, "unsure");
});

test("daily goal XP accumulates per day and resets on a new day", () => {
  let d = addDailyXp(undefined, 30, "2026-10-23");
  d = addDailyXp(d, 20, "2026-10-23");
  assert.equal(dailyXp(d, "2026-10-23"), 50);
  assert.equal(dailyXp(d, "2026-10-24"), 0);
  assert.deepEqual(addDailyXp(d, 10, "2026-10-24"), { day: "2026-10-24", xp: 10 });
});

test("feedback shows a readable correct answer", () => {
  assert.equal(expectedAnswer({ type: "type_he" }, ["הספר"], "en"), "הספר");
  assert.equal(expectedAnswer({ type: "order_rtl" }, ["ש", "ל", "ו", "ם"], "en"), "שלום");
  assert.equal(expectedAnswer({ type: "order_rtl" }, ["אני", "קורא"], "en"), "אני קורא");
  const mc = { type: "mc", choices: [{ id: "a", en: "bread", ru: "хлеб" }, { id: "b", en: "milk", ru: "молоко" }] };
  assert.equal(expectedAnswer(mc, ["a"], "ru"), "хлеб");
  assert.equal(expectedAnswer({ type: "match_tap" }, ["x"], "en"), null);
});
