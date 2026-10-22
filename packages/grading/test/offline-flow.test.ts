import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { gradeExercise, gradePlacement, gradeText } from "../src/index.ts";

const catalog = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../apps/mobile/content/published.json"), "utf8"),
) as {
  placement: { accepted: Record<string, string[]>; items: Array<{ id: string }> };
  lessons: Array<{
    slug: string;
    kind: string;
    prerequisites: string[];
    exercises: Array<Record<string, unknown>>;
  }>;
};

test("placement then first lesson grade on device without an API", () => {
  const placed = gradePlacement(
    { p1: "שלום", p2: "הספר", p3: "כותב" },
    catalog.placement.accepted,
  );
  assert.equal(placed.score, 3);
  assert.equal(placed.level, "beginner");

  const first = catalog.lessons[0];
  assert.equal(first.slug, "script-alef-he");
  assert.equal(first.prerequisites.length, 0);
  const exercise = first.exercises[0];
  const accepted = exercise.accepted as string[];
  const grade = gradeExercise(exercise, { value: accepted[0] }, "en");
  assert.equal(grade.result, "correct");
  assert.ok(gradeText("שלום", catalog.placement.accepted.p1).result === "correct");
});
