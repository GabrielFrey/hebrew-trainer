import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { gradePlacement } from "../src/index.ts";
import { makePath, type PathCatalog } from "../../../apps/mobile/lib/path-core.ts";
import type { LocalSession } from "../../../apps/mobile/lib/session.ts";

const catalog = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../apps/mobile/content/published.json"), "utf8"),
) as PathCatalog & {
  placement: { accepted: Record<string, string[]>; levels: Record<string, string>; passRatio: number; maxLevel: string };
};
const opts = { levels: catalog.placement.levels, passRatio: catalog.placement.passRatio, maxLevel: catalog.placement.maxLevel };
function answersUpTo(stages: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, lvl] of Object.entries(catalog.placement.levels)) if (stages.includes(lvl)) out[id] = catalog.placement.accepted[id][0];
  return out;
}
const core = makePath(catalog);

function fresh(): LocalSession {
  return { source: "local", token: "t", user: { level: "starter" } as LocalSession["user"], done: {}, attempts: {}, badges: [] };
}

test("start from Alef: no placement keeps the first starter lesson current", () => {
  const path = core.buildPath(fresh());
  assert.equal(path.current_slug, catalog.lessons.find((l) => l.level === "starter")!.slug);
});

test("high placement score tests out of earlier stages and moves the current node", () => {
  const graded = gradePlacement(answersUpTo(["starter"]), catalog.placement.accepted, opts);
  assert.equal(graded.level, "beginner");
  const session = fresh();
  const stage = core.applyPlacement(session, graded.level);
  assert.equal(stage.id, "beginner");
  assert.equal(session.user.level, "beginner");
  assert.ok(session.badges.includes("starter"));
  const path = core.buildPath(session);
  const current = catalog.lessons.find((l) => l.slug === path.current_slug)!;
  assert.equal(current.level, "beginner");
  const starter = path.stages.find((s) => s.id === "starter")!;
  assert.ok(starter.checkpoint.completed);
  assert.ok(path.stages.find((s) => s.id === "beginner")!.open);
});

test("low placement score stays at the start", () => {
  const graded = gradePlacement({}, catalog.placement.accepted, opts);
  const session = fresh();
  core.applyPlacement(session, graded.level);
  assert.deepEqual(session.done, {});
  assert.equal(catalog.lessons.find((l) => l.slug === core.buildPath(session).current_slug)!.level, "starter");
});

test("placement has a graded 15-20 item set spanning four stages", () => {
  const ids = Object.keys(catalog.placement.accepted);
  assert.ok(ids.length >= 15 && ids.length <= 20);
  for (const stage of ["starter", "beginner", "elementary", "intermediate"]) {
    assert.ok(Object.values(catalog.placement.levels).filter((l) => l === stage).length >= 3, stage);
  }
});

for (const [answered, expected] of [
  [["starter", "beginner"], "elementary"],
  [["starter", "beginner", "elementary"], "intermediate"],
  [["starter", "beginner", "elementary", "intermediate"], "intermediate"],
] as const) {
  test(`placement into ${expected} after passing ${answered.join("+")}`, () => {
    const graded = gradePlacement(answersUpTo([...answered]), catalog.placement.accepted, opts);
    assert.equal(graded.level, expected);
    const session = fresh();
    core.applyPlacement(session, graded.level);
    const path = core.buildPath(session);
    const current = catalog.lessons.find((l) => l.slug === path.current_slug)!;
    assert.equal(current.level, expected);
    const order = ["starter", "beginner", "elementary", "intermediate"];
    for (const id of order.slice(0, order.indexOf(expected))) {
      const st = path.stages.find((s) => s.id === id)!;
      assert.ok(st.checkpoint.completed, id);
      assert.ok(st.nodes.every((n) => n.completed), id);
      assert.ok(session.badges.includes(id));
    }
    assert.ok(path.stages.find((s) => s.id === expected)!.open);
  });
}

test("skipping a lower stage blocks higher placement", () => {
  const graded = gradePlacement(answersUpTo(["elementary", "intermediate"]), catalog.placement.accepted, opts);
  assert.equal(graded.level, "starter");
});

test("Bet and Gimel are published with a checkpoint and valid exercises", () => {
  for (const stage of ["elementary", "intermediate"]) {
    const rows = catalog.lessons.filter((l) => l.level === stage) as Array<Record<string, any>>;
    assert.ok(rows.filter((l) => l.kind === "lesson").length >= 8);
    const gate = rows.find((l) => l.kind === "checkpoint")!;
    assert.equal(gate.slug, (catalog.checkpointSlugs as Record<string, string>)[stage]);
    for (const l of rows) {
      assert.ok(l.exercises.length >= 5 && l.exercises.length <= 12, l.slug);
      const exIds = l.exercises.map((e: any) => e.id);
      assert.equal(new Set(exIds).size, exIds.length, l.slug);
      for (const e of l.exercises) {
        if (e.type === "match_tap") assert.ok(Object.keys(e.pairs).length >= 2);
        else assert.ok(e.accepted.length > 0, `${l.slug}:${e.id}`);
        if (e.type === "mc" || e.type === "identify_root") assert.ok(e.choices.some((c: any) => e.accepted.includes(c.id)));
        assert.ok(e.prompt.en && e.prompt.ru);
      }
    }
  }
  const slugs = catalog.lessons.map((l) => l.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});
