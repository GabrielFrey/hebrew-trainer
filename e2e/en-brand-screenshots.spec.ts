import { expect, test, type Page } from "@playwright/test";

const DIR = "/opt/cursor/artifacts/screenshots";

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${DIR}/${name}.png`, animations: "disabled" });
}

test.describe("English locale product name", () => {
  test("onboarding and path say Biti Hebrew, never Ivrit", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByTestId("onboarding")).toBeVisible();
    await page.getByTestId("lang-en").click();
    await expect(page.getByTestId("onboarding-title")).toContainText("Welcome to Biti Hebrew");
    await expect(page.getByTestId("onboarding-title")).not.toContainText("Ivrit");
    await expect(page.getByTestId("course-he-en")).toContainText("Hebrew–English");
    await shot(page, "biti-en-onboarding");

    await page.getByTestId("start-alef").click();
    await expect(page.getByTestId("learn-path")).toBeVisible();
    await expect(page.getByTestId("brand-name")).toHaveText("Biti Hebrew");
    await expect(page.getByTestId("learn-path")).not.toContainText("Ivrit");
    await shot(page, "biti-en-path");
  });
});
