import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = process.argv[2] || "apps/mobile/dist";
const outDir = process.argv[3] || "/opt/cursor/artifacts/screenshots";
const port = Number(process.env.SHOT_PORT || 43183);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  let file = url.pathname === "/" ? "/index.html" : url.pathname;
  try {
    const buf = await readFile(join(root, file));
    res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
    res.end(buf);
  } catch {
    const buf = await readFile(join(root, "index.html"));
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(buf);
  }
});

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(outDir, `biti-mobile-web-${scheme}.png`), fullPage: false });
  await page.close();
}
await browser.close();
server.close();
console.log("wrote 390x844 light/dark screenshots");
