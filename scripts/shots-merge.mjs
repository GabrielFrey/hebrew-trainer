import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
const root = "apps/mobile/dist", out = process.argv[2] || "/workspace/biti-merge", port = 43191;
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".ttf": "font/ttf" };
const server = createServer(async (req, res) => {
  let p = new URL(req.url, "http://x").pathname; if (p === "/" || !extname(p)) p = "/index.html";
  try { const b = await readFile(join(root, p === "/" ? "/index.html" : p)); res.writeHead(200, { "content-type": mime[extname(p)] || "application/octet-stream" }); res.end(b); }
  catch { res.writeHead(200, { "content-type": "text/html" }); res.end(await readFile(join(root, "index.html"))); }
});
await new Promise((r) => server.listen(port, "127.0.0.1", r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("CONSOLE", m.text().slice(0, 300)); });
page.on("pageerror", (e) => console.log("PAGEERR", e.message));
const base = `http://127.0.0.1:${port}`;
const shot = (n, full = false) => page.screenshot({ path: join(out, n), fullPage: full });
const cat = JSON.parse(await readFile("apps/mobile/content/published.json", "utf8"));
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.getByTestId("start-placement").click();
await page.getByTestId("placement").waitFor();
const boards = page.getByTestId("hebrew-keyboard");
for (const [i, item] of cat.placement.items.entries()) {
  const word = cat.placement.accepted[item.id][0];
  for (const ch of word) await boards.nth(i).getByTestId(`key-${ch}`).first().click();
}
await shot("01-placement-18-items.png", true);
await page.getByTestId("placement-submit").click();
await page.getByTestId("placement-result").waitFor();
await shot("02-placement-result-gimel.png");
await page.getByTestId("placement-continue").click();
await page.waitForTimeout(1500);
await page.goto(base + "/learn", { waitUntil: "networkidle" });
await page.getByTestId("learn-path").waitFor();
await page.waitForTimeout(800); await page.getByTestId("daily-goal").scrollIntoViewIfNeeded(); await shot("03-learn-path-daily-goal.png");
await page.goto(base + "/learn/gimel-daily-1", { waitUntil: "networkidle" });
await page.getByTestId("lesson-player").waitFor();
await shot("04-lesson-hud.png");
await page.waitForTimeout(1500); const ex0 = cat.lessons.find((l) => l.slug === "gimel-daily-1").exercises[0]; await page.getByTestId(`choice-${ex0.choices.find((c) => !ex0.accepted.includes(c.id)).id}`).click();
await page.getByTestId("check-answer").click();
await page.waitForTimeout(1500); await page.getByTestId("feedback").waitFor({ timeout: 5000 });
await page.getByTestId("feedback").scrollIntoViewIfNeeded();
await shot("05-feedback-correct-answer.png");
await page.goto(base + "/learn/script-dagesh-ktav", { waitUntil: "networkidle" });
await page.getByTestId("lesson-player").waitFor();
await page.waitForTimeout(1500); for (let k = 0; k < 3; k++) { await page.getByTestId("check-answer").click(); await page.getByTestId("next-exercise").click(); }
const pad = page.getByTestId("handwriting-canvas");
await pad.waitFor(); await pad.scrollIntoViewIfNeeded();
const b = await pad.boundingBox();
// draw a rough alef-like X with a stroke
const line = async (x1, y1, x2, y2) => { await page.mouse.move(b.x + x1 * b.width, b.y + y1 * b.height); await page.mouse.down(); for (let s = 1; s <= 12; s++) await page.mouse.move(b.x + (x1 + (x2 - x1) * s / 12) * b.width, b.y + (y1 + (y2 - y1) * s / 12) * b.height); await page.mouse.up(); };
await line(0.25, 0.25, 0.75, 0.72); await line(0.7, 0.25, 0.6, 0.45); await line(0.4, 0.5, 0.3, 0.72);
await page.waitForTimeout(300);
await shot("06-handwriting-trace.png");
await browser.close(); server.close();
console.log("ok");
