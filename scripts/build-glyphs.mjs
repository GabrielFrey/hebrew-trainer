// Строит растровые шаблоны букв для распознавания рукописного ввода.
//
// Шаблоны получаются из настоящего шрифта (Noto Sans Hebrew), а не рисуются
// на глаз: ffmpeg рендерит глиф в серое изображение, мы режем его по рамке
// самой буквы и сжимаем в сетку GRID×GRID.
//
// Запуск: node scripts/build-glyphs.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FONT = '/usr/share/fonts/truetype/noto/NotoSansHebrew-Bold.ttf';
const CANVAS = 256;
const GRID = 20;
const INK_THRESHOLD = 160; // пиксель темнее — это чернила

const DATA = JSON.parse(readFileSync(new URL('../data/hebrew.json', import.meta.url), 'utf8'));

const work = mkdtempSync(join(tmpdir(), 'glyphs-'));

function renderGray(char) {
  const out = join(work, 'frame.raw');
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-f',
      'lavfi',
      '-i',
      `color=white:s=${CANVAS}x${CANVAS}`,
      '-vf',
      `drawtext=fontfile=${FONT}:text='${char}':fontcolor=black:fontsize=190:x=(w-text_w)/2:y=(h-text_h)/2`,
      '-frames:v',
      '1',
      '-pix_fmt',
      'gray',
      '-f',
      'rawvideo',
      out,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] }
  );
  return readFileSync(out);
}

/** Сжимает изображение в сетку GRID×GRID по рамке самой буквы. */
function toGrid(gray) {
  const ink = (x, y) => gray[y * CANVAS + x] < INK_THRESHOLD;

  let minX = CANVAS;
  let minY = CANVAS;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < CANVAS; y += 1) {
    for (let x = 0; x < CANVAS; x += 1) {
      if (!ink(x, y)) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error('глиф не отрисовался');

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  // Масштаб единый по осям, чтобы узкая вав не превратилась в квадрат.
  const span = Math.max(width, height);
  const offsetX = minX - (span - width) / 2;
  const offsetY = minY - (span - height) / 2;

  const rows = [];
  for (let gy = 0; gy < GRID; gy += 1) {
    let row = '';
    for (let gx = 0; gx < GRID; gx += 1) {
      const x0 = Math.round(offsetX + (gx * span) / GRID);
      const x1 = Math.round(offsetX + ((gx + 1) * span) / GRID);
      const y0 = Math.round(offsetY + (gy * span) / GRID);
      const y1 = Math.round(offsetY + ((gy + 1) * span) / GRID);
      let inked = 0;
      let total = 0;
      for (let y = y0; y < Math.max(y1, y0 + 1); y += 1) {
        for (let x = x0; x < Math.max(x1, x0 + 1); x += 1) {
          total += 1;
          if (x >= 0 && y >= 0 && x < CANVAS && y < CANVAS && ink(x, y)) inked += 1;
        }
      }
      row += total > 0 && inked / total >= 0.28 ? '#' : '.';
    }
    rows.push(row);
  }
  return { rows, aspect: Number((width / height).toFixed(3)) };
}

const glyphs = [];
DATA.letters.forEach((letter) => {
  const base = toGrid(renderGray(letter.char));
  glyphs.push({
    id: letter.id,
    char: letter.char,
    letterId: letter.id,
    form: 'base',
    nameRu: letter.nameRu,
    aspect: base.aspect,
    rows: base.rows,
  });
  if (letter.finalChar) {
    const final = toGrid(renderGray(letter.finalChar));
    glyphs.push({
      id: `${letter.id}-final`,
      char: letter.finalChar,
      letterId: letter.id,
      form: 'final',
      nameRu: `${letter.nameRu} конечная`,
      aspect: final.aspect,
      rows: final.rows,
    });
  }
});

rmSync(work, { recursive: true, force: true });

const payload = {
  meta: {
    note: 'Создаётся скриптом scripts/build-glyphs.mjs из шрифта Noto Sans Hebrew. Не редактируйте вручную.',
    grid: GRID,
    font: 'Noto Sans Hebrew Bold',
  },
  glyphs,
};
writeFileSync(
  new URL('../data/glyphs.json', import.meta.url),
  `${JSON.stringify(payload, null, 2)}\n`
);
process.stderr.write(`готово: ${glyphs.length} шаблонов ${GRID}x${GRID}\n`);
glyphs.forEach((g) => {
  process.stderr.write(`\n${g.char} (${g.id}) aspect=${g.aspect}\n${g.rows.join('\n')}\n`);
});
