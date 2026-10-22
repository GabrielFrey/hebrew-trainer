import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { gradeExercise } from "../src/index.ts";
import {
  dueCards,
  offlineAlphabet,
  type AlphabetData,
  offlinePractice,
  scheduleCard,
  type SrsCard,
} from "../../../apps/mobile/lib/offline-content.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../apps/mobile");
const read = (p: string) => readFileSync(join(root, p), "utf8");

test("alphabet tab has 22 letters, 5 finals, dagesh variants offline", () => {
  const a = offlineAlphabet(JSON.parse(read("content/alphabet.json")) as AlphabetData);
  assert.equal(a.print.length, 22);
  assert.equal(a.print[0].glyph, "א");
  assert.deepEqual(a.finals.map((f) => f.glyph), ["ך", "ם", "ן", "ף", "ץ"]);
  assert.deepEqual(a.variants.map((v) => v.pair.join("")), ["בּב", "כּכ", "פּפ", "שׁשׂ"]);
  for (const l of a.print) {
    for (const lang of ["ru", "uk", "en", "es", "fr"]) assert.ok(l.name[lang], `${l.id} ${lang}`);
    assert.ok(l.name_he && l.translit && l.sound.ru && l.sound.en && l.example.he && l.example.gloss.ru && l.example.gloss.en, l.id);
  }
  assert.ok(a.lookalikes.length > 0);
});

test("verbs tab has bundled paradigms offline", () => {
  const v = JSON.parse(read("content/verbs.json")) as { paradigms: Array<{ root: string; present: object }> };
  assert.ok(v.paradigms.length >= 150, String(v.paradigms.length));
  const full = v.paradigms as Array<{ binyan: string; past?: Record<string, unknown>; future?: Record<string, unknown> }>;
  assert.equal(new Set(full.map((p) => p.binyan)).size, 7);
  assert.ok(full.filter((p) => p.past && p.future).length >= 150);
  assert.ok(v.paradigms.every((p) => p.root && p.present));
});

test("review + practice tabs work from local SRS store", () => {
  const card: SrsCard = { id: "l:e1", kind: "exercise", prompt: { he: "שלום" }, accepted: ["שלום"], step: 0, due_day: "2026-10-23" };
  const cards = { [card.id]: card };
  assert.equal(dueCards(cards, "2026-10-23").length, 1);
  assert.equal(offlinePractice({ a: 0.5, b: 1 }, cards, 5, "2026-10-23").due_cards, 1);
  assert.deepEqual(offlinePractice({ a: 0.5, b: 1 }, cards, 5, "2026-10-23").weak_lessons, ["a"]);
  const g = gradeExercise({ type: "type_he", accepted: card.accepted, mode: "relaxed" }, { value: "שלום" }, "en");
  assert.equal(g.result, "correct");
  const next = scheduleCard(card, true, "2026-10-23");
  assert.equal(next.due_day, "2026-10-26");
  assert.equal(scheduleCard(next, false, "2026-10-26").due_day, "2026-10-27");
});

test("local-api serves every tab path offline", () => {
  const src = read("lib/local-api.ts");
  for (const p of ['"/alphabet"', '"/verbs"', '"/practice"', '"/srs/due"', '"/curriculum/path"']) assert.ok(src.includes(p), p);
});
