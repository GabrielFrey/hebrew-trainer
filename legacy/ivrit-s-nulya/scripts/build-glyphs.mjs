// Строит растровые шаблоны букв для распознавания рукописного ввода.
//
// Шаблоны получаются из настоящего шрифта (Noto Sans Hebrew), а не рисуются
// на глаз: ffmpeg рендерит глиф в серое изображение на ОБЩЕЙ базовой линии,
// мы переносим его в сетку GRID×GRID, сохраняя спуск ниже строки.
//
// Запуск: node scripts/build-glyphs.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FONT = '/usr/share/fonts/truetype/noto/NotoSansHebrew-Bold.ttf';
const CANVAS = 256;
const GRID = 20;
const FONTSIZE = 160;
/** Пиксель холста, на который ffmpeg ставит фонтовую базовую линию. */
const BASELINE_PX = 180;
/**
 * Строка сетки, куда попадает базовая линия. Над ней — тело буквы (и ламед),
 * под ней — спуск конечных ך ן ף ץ и куф.
 */
const BASELINE_ROW = 14;
const INK_THRESHOLD = 160;

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
      `drawtext=fontfile=${FONT}:text='${char}':fontcolor=black:fontsize=${FONTSIZE}:x=(w-text_w)/2:y=${BASELINE_PX}-ascent`,
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

/**
 * Утончение Чжана — Суня. Человек ведёт пальцем одну тонкую линию, а шрифт
 * даёт залитый глиф в несколько клеток толщиной. Чтобы сравнивать подобное с
 * подобным, шаблон сводится к осевой линии. Топология при этом сохраняется,
 * поэтому замкнутые пустоты (ם, ס) остаются замкнутыми.
 */
function thin(cells, size) {
  const at = (grid, x, y) =>
    x < 0 || y < 0 || x >= size || y >= size ? 0 : grid[y * size + x] ? 1 : 0;

  let grid = [...cells];
  for (let pass = 0; pass < 100; pass += 1) {
    let removedAny = false;

    for (const step of [0, 1]) {
      const doomed = [];
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          if (!at(grid, x, y)) continue;
          const p = [
            at(grid, x, y - 1),
            at(grid, x + 1, y - 1),
            at(grid, x + 1, y),
            at(grid, x + 1, y + 1),
            at(grid, x, y + 1),
            at(grid, x - 1, y + 1),
            at(grid, x - 1, y),
            at(grid, x - 1, y - 1),
          ];
          const neighbours = p.reduce((sum, value) => sum + value, 0);
          if (neighbours < 2 || neighbours > 6) continue;

          let transitions = 0;
          for (let i = 0; i < 8; i += 1) {
            if (p[i] === 0 && p[(i + 1) % 8] === 1) transitions += 1;
          }
          if (transitions !== 1) continue;

          const [n, , e, , s, , w] = p;
          const first = step === 0 ? n * e * s : n * e * w;
          const second = step === 0 ? e * s * w : n * s * w;
          if (first !== 0 || second !== 0) continue;

          doomed.push(y * size + x);
        }
      }
      if (doomed.length > 0) {
        doomed.forEach((index) => {
          grid[index] = false;
        });
        removedAny = true;
      }
    }

    if (!removedAny) break;
  }
  return grid;
}

/**
 * Рендер идёт на общей базовой линии, из неё считаем спуск. Сама сетка 20×20
 * по-прежнему обрезается по рамке чернил: иначе короткая י после утончения
 * превращается в пять точек с дырами, и сравнение с шаблоном ломается.
 */
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
  const ascent = Math.max(BASELINE_PX - minY, 1);
  const relativeDescent = Number(((maxY - BASELINE_PX) / ascent).toFixed(3));

  // Масштаб единый по осям, чтобы узкая вав не превратилась в квадрат.
  const span = Math.max(width, height);
  const offsetX = minX - (span - width) / 2;
  const offsetY = minY - (span - height) / 2;

  const filled = new Array(GRID * GRID).fill(false);
  for (let gy = 0; gy < GRID; gy += 1) {
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
      filled[gy * GRID + gx] = total > 0 && inked / total >= 0.28;
    }
  }

  const skeleton = thin(filled, GRID);
  const rows = [];
  for (let gy = 0; gy < GRID; gy += 1) {
    let row = '';
    for (let gx = 0; gx < GRID; gx += 1) {
      row += skeleton[gy * GRID + gx] ? '#' : '.';
    }
    rows.push(row);
  }

  return {
    rows,
    aspect: Number((width / height).toFixed(3)),
    relativeDescent,
  };
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
    relativeDescent: base.relativeDescent,
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
      relativeDescent: final.relativeDescent,
      rows: final.rows,
    });
  }
});

rmSync(work, { recursive: true, force: true });

const payload = {
  meta: {
    note: 'Создаётся скриптом scripts/build-glyphs.mjs из шрифта Noto Sans Hebrew. Не редактируйте вручную. Рендер на общей базовой линии.',
    grid: GRID,
    baselineRow: BASELINE_ROW,
    font: 'Noto Sans Hebrew Bold',
  },
  glyphs,
};
writeFileSync(
  new URL('../data/glyphs.json', import.meta.url),
  `${JSON.stringify(payload, null, 2)}\n`
);
process.stderr.write(`готово: ${glyphs.length} шаблонов ${GRID}x${GRID}, baselineRow=${BASELINE_ROW}\n`);
glyphs.forEach((g) => {
  process.stderr.write(
    `\n${g.char} (${g.id}) aspect=${g.aspect} descent=${g.relativeDescent}\n${g.rows.join('\n')}\n`
  );
});
