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
) as PathCatalog & { placement: { accepted: Record<string, string[]> } };
const core = makePath(catalog);

function fresh(): LocalSession {
  return { source: "local", token: "t", user: { level: "starter" } as LocalSession["user"], done: {}, attempts: {}, badges: [] };
}

test("start from Alef: no placement keeps the first starter lesson current", () => {
  const path = core.buildPath(fresh());
  assert.equal(path.current_slug, catalog.lessons.find((l) => l.level === "starter")!.slug);
});

test("high placement score tests out of earlier stages and moves the current node", () => {
  const graded = gradePlacement({ p1: "שלום", p2: "הספר", p3: "כותב" }, catalog.placement.accepted);
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
  const graded = gradePlacement({ p1: "", p2: "", p3: "" }, catalog.placement.accepted);
  const session = fresh();
  core.applyPlacement(session, graded.level);
  assert.deepEqual(session.done, {});
  assert.equal(catalog.lessons.find((l) => l.slug === core.buildPath(session).current_slug)!.level, "starter");
});
