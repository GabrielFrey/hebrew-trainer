import { expect, test, type Page } from "@playwright/test";

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

test.describe("color palette screenshots 390x844", () => {
  test.skip(!process.env.COLOR_SHOTS, "set COLOR_SHOTS=1 to write artifacts");

  for (const scheme of ["light", "dark"] as const) {
    test(`${scheme} onboarding, path, lesson, feedback`, async ({ page }) => {
      await page.setViewportSize(VIEW);
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await expect(page.getByTestId("onboarding")).toBeVisible();
      await shot(page, `biti-color-onboarding-${scheme}`);

      await onboard(page);
      await shot(page, `biti-color-path-${scheme}`);

      await page.getByTestId("path-script-alef-he").click();
      await expect(page.getByTestId("lesson-player")).toBeVisible();
      await shot(page, `biti-color-lesson-${scheme}`);

      const choice = page.locator("[data-testid^='choice-']").first();
      await choice.click();
      await page.getByTestId("check-answer").click();
      await expect(page.getByTestId("feedback")).toBeVisible();
      await shot(page, `biti-color-feedback-${scheme}`);
    });
  }
});
