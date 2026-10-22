/** Same gate as ESLint no-restricted-syntax for bare crypto.randomUUID. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const roots = [
  "apps/mobile",
  "packages/grading",
  "packages/hebrew-text",
  "packages/i18n",
  "packages/design-tokens",
];
const skip = new Set([".expo", "dist", "node_modules", "content"]);
const skipFiles = new Set(["eslint.config.mjs", "hermes-env.mjs"]);
const ext = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const bare = /(?<![\w.])crypto\.randomUUID/;
const hits = [];

function codeLines(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .split("\n")
    .map((line) => line.split("//", 1)[0]);
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name) || skipFiles.has(name)) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path);
    else if ([...ext].some((e) => name.endsWith(e)) && !name.includes(".test.")) {
      const raw = readFileSync(path, "utf8");
      codeLines(raw).forEach((code, i) => {
        if (bare.test(code)) hits.push(`${relative(repoRoot, path)}:${i + 1}:${raw.split("\n")[i].trim()}`);
      });
    }
  }
}

for (const root of roots) walk(join(repoRoot, root));
if (hits.length) {
  console.error("bare crypto.randomUUID is a Hermes crash; use newId() from apps/mobile/lib/id.ts");
  for (const h of hits) console.error(h);
  process.exit(1);
}
console.log("ok: no bare crypto.randomUUID");
