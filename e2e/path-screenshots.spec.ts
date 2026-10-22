import { expect, test, type Page } from "@playwright/test";
import { answerExercise, checkpointExercises } from "./checkpoint";

const DIR = "/opt/cursor/artifacts/screenshots";
const VIEW = { width: 390, height: 844 };

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${DIR}/${name}.png`, animations: "disabled" });
}

async function onboard(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("onboarding")).toBeVisible();
  await page.getByTestId("lang-en").click();
  await page.getByTestId("start-alef").click();
  await expect(page.getByTestId("learn-path")).toBeVisible();
}

test.describe("path screenshots 390x844", () => {
  for (const scheme of ["light", "dark"] as const) {
    test(`${scheme} path, stage header, checkpoint start/pass/fail`, async ({ page }) => {
      const exercises = checkpointExercises("boss-starter");
      await page.setViewportSize(VIEW);
      await page.emulateMedia({ colorScheme: scheme });
      await onboard(page);
      await expect(page.getByTestId("path-trail")).toBeVisible();
      await expect(page.getByTestId("biti-on-current")).toBeVisible();
      await shot(page, `biti-path-${scheme}`);
      await page.getByTestId("stage-header-starter").scrollIntoViewIfNeeded();
      await shot(page, `biti-path-stage-header-${scheme}`);

      await page.getByTestId("path-boss-starter").click();
      await expect(page.getByTestId("checkpoint-start")).toBeVisible();
      await shot(page, `biti-checkpoint-start-${scheme}`);

      await page.getByTestId("checkpoint-begin").click();
      for (const ex of exercises) {
        await answerExercise(page, ex, false);
      }
      await expect(page.getByTestId("checkpoint-fail")).toBeVisible();
      await shot(page, `biti-checkpoint-fail-${scheme}`);

      await page.goto("/learn");
      await page.getByTestId("path-boss-starter").click();
      await expect(page.getByTestId("checkpoint-start")).toBeVisible();
      await page.getByTestId("checkpoint-begin").click();
      for (const ex of exercises) {
        await answerExercise(page, ex, true);
      }
      await expect(page.getByTestId("checkpoint-pass")).toBeVisible();
      await shot(page, `biti-checkpoint-pass-${scheme}`);
    });
  }
});
