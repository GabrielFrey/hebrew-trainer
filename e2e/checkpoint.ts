import { execFileSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";

const python = process.env.E2E_PYTHON || "apps/api/.venv/bin/python";

export type SeedExercise = {
  id: string;
  type: string;
  accepted?: string[];
  pairs?: Record<string, string>;
};

export function checkpointExercises(slug: string): SeedExercise[] {
  const script = `
from biti.seed import all_lesson_specs
import json
spec = next(s for s in all_lesson_specs() if s["slug"] == ${JSON.stringify(slug)})
rows = []
for e in spec["exercises"]:
    if e.get("optional") or e.get("type") in {"speak", "listen", "listen_mc", "listen_tap"}:
        continue
    rows.append({
        "id": e["id"],
        "type": e["type"],
        "accepted": e.get("accepted"),
        "pairs": e.get("pairs") or (e.get("pairs_by_lang") or {}).get("en"),
    })
print(json.dumps(rows))
`;
  const out = execFileSync(python, ["-c", script], {
    env: { ...process.env, PYTHONPATH: "apps/api" },
    encoding: "utf8",
  });
  return JSON.parse(out) as SeedExercise[];
}

export async function answerExercise(page: Page, ex: SeedExercise, correct: boolean) {
  if (ex.type === "mc" || ex.type === "drill" || ex.type === "identify_root" || ex.type === "identify_binyan") {
    const accepted = ex.accepted?.[0];
    if (correct && accepted) {
      await page.getByTestId(`choice-${accepted}`).click();
    } else {
      const choices = page.locator("[data-testid^='choice-']");
      const count = await choices.count();
      let clicked = false;
      for (let i = 0; i < count; i++) {
        const id = await choices.nth(i).getAttribute("data-testid");
        if (id !== `choice-${accepted}`) {
          await choices.nth(i).click();
          clicked = true;
          break;
        }
      }
      if (!clicked && count) await choices.last().click();
    }
  } else if (ex.type === "match" || ex.type === "match_tap") {
    const pairs = ex.pairs || {};
    for (const [left, right] of Object.entries(pairs)) {
      if (ex.type === "match") {
        await page.getByTestId(`match-${left}`).fill(correct ? right : "xxx");
      } else if (correct) {
        await page.getByTestId(`match-left-${left}`).click();
        await page.getByTestId(`match-right-${right}`).click();
      }
    }
  } else if (ex.type === "order_rtl" || ex.type === "tiles") {
    const tokens = correct ? ex.accepted || [] : [];
    for (const tok of tokens) {
      const token = page.getByTestId(`token-${tok}`);
      if (await token.count()) await token.click();
    }
  } else {
    const input = page.getByTestId("hebrew-input");
    if (await input.count()) {
      await input.fill(correct && ex.accepted?.[0] ? ex.accepted[0] : "ששש");
    }
  }
  await page.getByTestId("check-answer").click();
  await expect(page.getByTestId("feedback")).toBeVisible();
  await page.getByTestId("next-exercise").click();
}
