import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { gradeExercise } from "../src/index.ts";
import { createCurriculum, mergeCatalog, type Catalog, type CatalogLesson, type Curriculum } from "../../../apps/mobile/lib/curriculum.ts";
import { makePath, type PathCatalog } from "../../../apps/mobile/lib/path-core.ts";
import type { LocalSession } from "../../../apps/mobile/lib/session.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../apps/mobile/content");
const published = JSON.parse(readFileSync(join(root, "published.json"), "utf8")) as Catalog;
const data = JSON.parse(readFileSync(join(root, "curriculum.json"), "utf8")) as Curriculum;
const { catalog, lesson } = mergeCatalog(published, data);
const core = makePath(catalog as unknown as PathCatalog);
const HEB = /[\u05D0-\u05EA]/;
const GATES = new Set(catalog.gateKinds);

function full(slug: string): CatalogLesson {
  const found = lesson(slug);
  assert.ok(found, slug);
  return found;
}

function fresh(): LocalSession {
  return { source: "local", token: "t", user: { level: "starter" } as LocalSession["user"], done: {}, attempts: {}, badges: [] };
}

function correctPayload(ex: Record<string, unknown>): { value?: unknown; pairs?: Record<string, string> } {
  const accepted = ex.accepted as string[] | undefined;
  if (ex.type === "match_tap" || ex.type === "match") return { pairs: (ex.pairs_by_lang as Record<string, Record<string, string>>)?.en || (ex.pairs as Record<string, string>) };
  if (ex.type === "order_rtl" || ex.type === "tiles") return { value: accepted };
  return { value: accepted?.[0] };
}

test("every stage has lessons and a gate; slugs are unique", () => {
  const slugs = catalog.lessons.map((l) => l.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const level of catalog.levels) {
    const rows = catalog.lessons.filter((l) => l.level === level.id);
    assert.ok(rows.some((l) => !GATES.has(l.kind)), `${level.id} has no lessons`);
    assert.equal(rows.filter((l) => GATES.has(l.kind)).length, 1, `${level.id} gate`);
    assert.equal((catalog.checkpointSlugs as Record<string, string>)[level.id], rows.find((l) => GATES.has(l.kind))!.slug);
  }
});

test("every curriculum item is used once and has Hebrew, Russian and English", () => {
  const used = data.stages.flatMap((s) => s.lessons.flatMap((l) => l.items));
  assert.equal(new Set(used).size, used.length);
  assert.deepEqual(new Set(used), new Set(Object.keys(data.items)));
  for (const [id, item] of Object.entries(data.items)) {
    if (item.t === "d") {
      for (const row of [...item.lines, ...item.replies]) assert.ok(HEB.test(row.p) && row.en && row.ru, id);
      assert.equal(item.replies.filter((r) => r.ok).length, 1, id);
    } else {
      assert.ok(HEB.test(item.he) && HEB.test(item.p) && item.en && item.ru, id);
    }
    if (item.t === "v") {
      for (const lang of ["uk", "es", "fr"] as const) assert.ok(item[lang], `${id} ${lang}`);
      for (const lang of ["he", "en", "ru", "uk", "es", "fr"]) assert.ok(item.src[lang], `${id} source ${lang}`);
    }
  }
});

test("machine-derived legacy entries are flagged for native review", () => {
  for (const [id, item] of Object.entries(data.items)) {
    if (item.t === "v") continue;
    if (/#f\d+-/.test(item.src) || item.t === "s" || item.t === "d") assert.equal(item.review, 1, id);
  }
});

test("excluded slang never ships", () => {
  const banned = ["חרא", "חרטא", "מניאק", "נדפק", "לעזאזל", "מבסס", "תזרים", "חפור"];
  const hebrew = new Set(Object.values(data.items).flatMap((i) => (i.t === "d" ? [] : [i.he])));
  for (const word of banned) assert.ok(!hebrew.has(word), word);
});

test("every lesson is reachable from a fresh start", () => {
  const session = fresh();
  for (let round = 0; round < catalog.lessons.length + 5; round++) {
    let progressed = false;
    for (const spec of catalog.lessons) {
      if (spec.slug in session.done || !core.unlocked(spec.slug, session.done)) continue;
      session.done[spec.slug] = 1;
      progressed = true;
    }
    if (!progressed) break;
  }
  const missing = catalog.lessons.filter((l) => !(l.slug in session.done)).map((l) => l.slug);
  assert.deepEqual(missing, []);
});

test("curriculum lessons expand to 5–12 valid exercises that grade correct with the right answer", () => {
  for (const stage of data.stages) {
    for (const slug of [...stage.lessons.map((l) => l.slug), stage.gate.slug]) {
      const spec = full(slug);
      assert.ok(spec.exercises.length >= 5 && spec.exercises.length <= 12, `${slug}: ${spec.exercises.length}`);
      const ids = spec.exercises.map((e) => e.id);
      assert.equal(new Set(ids).size, ids.length, slug);
      for (const ex of spec.exercises) {
        for (const lang of ["en", "ru", "uk", "es", "fr"]) assert.ok((ex.prompt as Record<string, string>)[lang], `${ex.id} prompt ${lang}`);
        if (ex.type === "mc") {
          const choices = ex.choices as Array<Record<string, string>>;
          assert.ok(choices.length >= 3, ex.id);
          assert.equal(new Set(choices.map((c) => c.id)).size, choices.length, ex.id);
          assert.ok(choices.some((c) => c.id === (ex.accepted as string[])[0]), ex.id);
          for (const c of choices) assert.ok(c.he || (c.en && c.ru), `${ex.id} choice ${c.id}`);
        }
        if (ex.type === "order_rtl") {
          assert.deepEqual([...(ex.tokens as string[])].sort(), [...(ex.accepted as string[])].sort(), ex.id);
          assert.notDeepEqual(ex.tokens, ex.accepted, ex.id);
        }
        if (ex.type === "match_tap") {
          const pairs = (ex.pairs_by_lang as Record<string, Record<string, string>>).en;
          assert.deepEqual(Object.keys(pairs), ex.left, ex.id);
        }
        if (ex.type === "type_he") assert.ok(HEB.test((ex.accepted as string[])[0]), ex.id);
        assert.equal(gradeExercise(ex, correctPayload(ex), "en").result, "correct", ex.id);
      }
    }
  }
});

test("expansion is deterministic across app restarts", () => {
  const again = createCurriculum(data);
  for (const stage of data.stages) {
    const slug = stage.lessons[0].slug;
    assert.deepEqual(again.lesson(slug), full(slug));
    assert.deepEqual(again.lesson(stage.gate.slug), full(stage.gate.slug));
  }
});

test("uk/es/fr never show English under their own label", () => {
  for (const stage of data.stages) {
    for (const spec of stage.lessons.map((l) => full(l.slug))) {
      for (const ex of spec.exercises) {
        for (const c of (ex.choices as Array<Record<string, string>> | undefined) || []) {
          for (const lang of ["uk", "es", "fr"]) if (c[lang] && c.en && !c.he) assert.ok(c[lang] !== c.en || spec.track === "literature", `${ex.id} ${lang}`);
        }
        const byLang = ex.pairs_by_lang as Record<string, Record<string, string>> | undefined;
        if (byLang) for (const lang of ["uk", "es", "fr"]) assert.ok(!byLang[lang], `${ex.id} ${lang} pairs`);
      }
      if (spec.track !== "literature") assert.deepEqual(spec.l10n_fallback, ["uk", "es", "fr"], spec.slug);
      else assert.deepEqual(spec.l10n_fallback, [], spec.slug);
    }
  }
});

test("passing the Gimel gate continues the main path into Dalet; sections open as side tracks", () => {
  const session = fresh();
  core.applyPlacement(session, "upper");
  const path = core.buildPath(session);
  const current = catalog.lessons.find((l) => l.slug === path.current_slug)!;
  assert.equal(current.level, "upper");
  const slang = path.stages.find((s) => s.id === "slang")!;
  assert.ok(slang.open && slang.section);
  assert.ok(!path.stages.find((s) => s.id === "idioms")!.open);
  assert.ok(!path.stages.find((s) => s.id === "advanced")!.open);
  assert.ok(!session.badges.includes("slang"));
  assert.deepEqual(core.opensNext("upper"), ["idioms", "advanced"]);
  assert.deepEqual(core.opensNext("advanced"), ["literary", "fluent"]);
});
