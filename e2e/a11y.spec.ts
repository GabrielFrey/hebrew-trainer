import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/");
  await page.getByTestId("lang-en").click();
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

test.describe("axe", () => {
  test("onboarding", async ({ page }) => {
    await page.goto("/");
    await scan(page, "onboarding");
  });

  test("learn path, lesson, review, alphabet, verbs, profile, placement", async ({ page }) => {
    await login(page);
    await scan(page, "learn");
    await page.getByTestId("path-script-alef-he").click();
    await expect(page.getByTestId("lesson-player")).toBeVisible();
    await scan(page, "lesson");
    await page.getByTestId("nav-review").click();
    await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
    await scan(page, "review");
    await page.getByTestId("nav-alphabet").click();
    await expect(page.getByTestId("alphabet")).toBeVisible();
    await scan(page, "alphabet");
    await page.getByTestId("nav-verbs").click();
    await expect(page.getByTestId("verbs")).toBeVisible();
    await scan(page, "verbs");
    await page.getByTestId("nav-profile").click();
    await expect(page.getByTestId("profile")).toBeVisible();
    await scan(page, "profile");
    await page.goto("/placement");
    await expect(page.getByTestId("placement")).toBeVisible();
    await scan(page, "placement");
  });
});
