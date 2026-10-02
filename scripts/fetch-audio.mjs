// Скачивает произношения носителей с Викисклада и конвертирует их в m4a.
//
// Сопоставление идёт строго по точной огласованной форме: файл Викисловаря
// называется He-<слово с никудом>.ogg, и мы берём только полное совпадение с
// полем nikud. Совпадение по форме без огласовок запрещено — у одинаковых
// согласных бывают разные слова (כֵּן «да» и כַּן «подставка»).
//
// Запуск: node scripts/fetch-audio.mjs [--limit N]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { describe, listCategory, pointedFromTitle } from './commons-index.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const AUDIO_DIR = join(ROOT, 'assets/audio');
const DATA = JSON.parse(readFileSync(join(ROOT, 'data/hebrew.json'), 'utf8'));
const UA = 'hebrew-trainer-audio-fetcher/1.0 (educational app)';

const nfc = (value) => value.normalize('NFC');

/** Все записи, которым нужна озвучка: слово/фраза/абзац -> ожидаемый путь. */
function audioTargets() {
  const targets = [];
  DATA.words.forEach((w) => targets.push({ id: w.id, pointed: w.nikud, audio: w.audio }));
  DATA.phrases.forEach((p) => targets.push({ id: p.id, pointed: p.nikud, audio: p.audio }));
  DATA.passages.forEach((p) => targets.push({ id: p.id, pointed: p.nikud, audio: p.audio }));
  DATA.letters.forEach((l) => targets.push({ id: l.id, pointed: l.name, audio: l.audio }));
  return targets;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function download(url, destination) {
  // upload.wikimedia.org ограничивает частоту, поэтому качаем медленно и с повторами.
  const clean = url.split('?')[0];
  let lastStatus = 0;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (attempt > 0) await sleep(1500 * 2 ** (attempt - 1));
    const res = await fetch(clean, { headers: { 'User-Agent': UA, Accept: '*/*' } });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, buffer);
      return;
    }
    lastStatus = res.status;
    if (res.status !== 429 && res.status < 500) break;
  }
  throw new Error(`HTTP ${lastStatus} для ${clean}`);
}

function toM4a(source, destination) {
  mkdirSync(dirname(destination), { recursive: true });
  execFileSync(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-i', source, '-c:a', 'aac', '-b:a', '64k', '-ar', '44100', '-ac', '1', destination],
    { stdio: 'inherit' }
  );
}

const limitFlag = process.argv.indexOf('--limit');
const limit = limitFlag === -1 ? Infinity : Number(process.argv[limitFlag + 1]);

const titles = await listCategory();
const byPointed = new Map();
titles.forEach((title) => {
  const pointed = pointedFromTitle(title);
  if (pointed && !byPointed.has(nfc(pointed))) byPointed.set(nfc(pointed), title);
});
console.error(`в категории ${titles.length} файлов, ${byPointed.size} огласованных форм`);

const targets = audioTargets();
const matched = targets
  .map((target) => ({ ...target, title: byPointed.get(nfc(target.pointed)) }))
  .filter((target) => target.title)
  .slice(0, limit);

console.error(`точных совпадений: ${matched.length} из ${targets.length}`);
if (matched.length === 0) {
  console.error('нечего скачивать');
  process.exit(0);
}

const described = await describe(matched.map((m) => m.title));
const byTitle = new Map(described.map((entry) => [entry.title, entry]));

// Берём только файлы со свободной лицензией.
const FREE = /^(cc0|cc[- ]by|public domain|pd)/i;

const credits = [];
for (const target of matched) {
  const meta = byTitle.get(target.title);
  if (!meta) continue;
  if (!meta.license || !FREE.test(meta.license)) {
    console.error(`пропуск ${target.id}: лицензия «${meta.license}» не подходит`);
    continue;
  }
  const temp = join('/tmp/hebrew-audio', `${target.id}.src`);
  const destination = join(AUDIO_DIR, target.audio);
  try {
    await sleep(1200);
    await download(meta.url, temp);
    toM4a(temp, destination);
    rmSync(temp, { force: true });
    credits.push({
      id: target.id,
      file: target.audio,
      pointed: target.pointed,
      source: meta.descriptionUrl,
      author: meta.artist,
      license: meta.license,
      licenseUrl: meta.licenseUrl,
    });
    console.error(`✓ ${target.id} ← ${meta.title}`);
  } catch (error) {
    console.error(`✗ ${target.id}: ${error.message}`);
  }
}

credits.sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(join(AUDIO_DIR, 'credits.json'), `${JSON.stringify(credits, null, 2)}\n`);

// Статическая карта для Metro: require нельзя строить из переменной.
const lines = credits.map(
  (entry) => `  '${entry.file}': require('@/assets/audio/${entry.file}') as number,`
);
const module = `// Файл создаётся скриптом scripts/fetch-audio.mjs. Не редактируйте вручную.
// Metro требует статический require, поэтому карта записей генерируется.

/** Записи носителей, реально вложенные в сборку. */
export const audioAssets: Record<string, number> = {
${lines.join('\n')}
};

export function hasRecording(path: string | null | undefined): boolean {
  return typeof path === 'string' && path in audioAssets;
}
`;
writeFileSync(join(ROOT, 'lib/audio-assets.ts'), module);
console.error(`готово: ${credits.length} записей, обновлены credits.json и lib/audio-assets.ts`);
if (!existsSync(join(AUDIO_DIR, 'credits.json'))) process.exit(1);
