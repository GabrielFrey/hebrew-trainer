import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDirs = ["/opt/cursor/artifacts", "/workspace/artifacts"];
const sizes = [
  { name: "iphone-17e", ...devices["iPhone 14"], viewport: { width: 393, height: 852 } },
  { name: "iphone-18-pro", ...devices["iPhone 14 Pro"], viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 },
  { name: "iphone-air", ...devices["iPhone 14 Pro Max"], viewport: { width: 430, height: 932 } },
];

async function snap(page, file) {
  for (const dir of outDirs) {
    await mkdir(dir, { recursive: true });
    await page.screenshot({ path: join(dir, file), fullPage: false });
  }
}

const browser = await chromium.launch({ headless: true });
const spec = sizes[0];
const context = await browser.newContext({
  ...spec,
  locale: "en-US",
  viewport: spec.viewport,
});
const page = await context.newPage();
page.setDefaultTimeout(60_000);
await page.goto("http://localhost:43182/", { waitUntil: "networkidle" });
await page.getByTestId("onboarding").waitFor();
await page.getByTestId("lang-en").click();
await page.getByTestId("onboarding-title").waitFor();
await snap(page, "start-en-iphone.png");

await page.getByTestId("start-placement").click();
await page.getByTestId("placement").waitFor();
await snap(page, "placement-en-iphone.png");

await page.getByTestId("placement-skip").click();
await page.getByTestId("learn-path").waitFor();
const first = page.getByTestId("path-script-alef-he");
await first.waitFor();
await first.click();
await page.getByTestId("lesson-player").waitFor();
await snap(page, "lesson-en-iphone.png");

await browser.close();
console.log("wrote start-en-iphone.png, placement-en-iphone.png, lesson-en-iphone.png");
console.log("script dir", dirname(fileURLToPath(import.meta.url)));
