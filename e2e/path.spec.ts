import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { answerExercise, checkpointExercises } from "./checkpoint";

async function onboard(page: Page, lang: "en" | "he" = "en") {
  await page.goto("/");
  await expect(page.getByTestId("onboarding")).toBeVisible();
  await page.getByTestId(`lang-${lang}`).click();
  await page.getByTestId("start-alef").click();
  await expect(page.getByTestId("learn-path")).toBeVisible();
}

async function scan(page: Page, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious, `${name}: ${serious.map((v) => v.id).join(", ")}`).toEqual([]);
}

test.describe("learning path and checkpoints", () => {
  test("winding path, stage banner, current mascot, sequential lock, test-out gate", async ({ page }) => {
    await onboard(page);
    await expect(page.getByTestId("path-trail")).toBeVisible();
    await expect(page.getByTestId("stage-header-starter")).toBeVisible();
    await expect(page.getByTestId("stage-header-starter")).toContainText("Pre-Aleph");
    await expect(page.getByTestId("stage-header-starter")).toContainText("טרום-אלף");
    await expect(page.getByTestId("biti-on-current")).toBeVisible();
    await expect(page.getByTestId("path-script-alef-he")).toBeVisible();
    await expect(page.getByTestId("path-script-vav-lamed")).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByTestId("path-boss-starter")).toHaveAttribute("aria-disabled", "false");
    await scan(page, "learn-path");
  });

  test("RTL trail mirrors and keeps the current node", async ({ page }) => {
    await onboard(page, "he");
    const trail = page.getByTestId("path-trail");
    await expect(trail).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("biti-on-current")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("checkpoint start, fail with review, then pass with badge", async ({ page }) => {
    const exercises = checkpointExercises("boss-starter");
    expect(exercises.length).toBeGreaterThanOrEqual(5);
    await onboard(page);
    await page.getByTestId("path-boss-starter").click();
    await expect(page.getByTestId("checkpoint-start")).toBeVisible();
    await expect(page.getByTestId("checkpoint-start")).toContainText("Need 80% to pass");
    await scan(page, "checkpoint-start");
    await page.getByTestId("checkpoint-begin").click();
    await expect(page.getByTestId("lesson-player")).toBeVisible();
    for (const ex of exercises) {
      await answerExercise(page, ex, false);
    }
    await expect(page.getByTestId("checkpoint-fail")).toBeVisible();
    await expect(page.getByTestId("checkpoint-fail")).toContainText("Not yet");
    await expect(page.getByTestId("checkpoint-review")).toBeVisible();
    await scan(page, "checkpoint-fail");

    await page.goto("/learn");
    await expect(page.getByTestId("learn-path")).toBeVisible();
    await page.getByTestId("path-boss-starter").click();
    await expect(page.getByTestId("checkpoint-start")).toBeVisible();
    await page.getByTestId("checkpoint-begin").click();
    for (const ex of exercises) {
      await answerExercise(page, ex, true);
    }
    await expect(page.getByTestId("checkpoint-pass")).toBeVisible();
    await expect(page.getByTestId("checkpoint-pass")).toContainText("Passed");
    await expect(page.getByTestId("checkpoint-pass")).toContainText("Stage badge earned");
    await scan(page, "checkpoint-pass");
  });
});
