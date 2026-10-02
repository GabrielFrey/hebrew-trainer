import glyphData from '@/data/glyphs.json';
import type { Grade } from '@/lib/types';

export type Point = { x: number; y: number };
export type Stroke = Point[];

export type GlyphTemplate = {
  id: string;
  char: string;
  letterId: string;
  form: 'base' | 'final';
  nameRu: string;
  aspect: number;
  rows: string[];
};

type GlyphFile = {
  meta: { grid: number; font: string; note: string };
  glyphs: GlyphTemplate[];
};

const file = glyphData as unknown as GlyphFile;

export const GRID = file.meta.grid;
export const glyphs: GlyphTemplate[] = file.glyphs;

const glyphById = new Map(glyphs.map((g) => [g.id, g]));
const glyphByChar = new Map(glyphs.map((g) => [g.char, g]));

export function getGlyph(id: string): GlyphTemplate | undefined {
  return glyphById.get(id);
}

export function glyphForChar(char: string): GlyphTemplate | undefined {
  return glyphByChar.get(char);
}

export function glyphsForLetter(letterId: string): GlyphTemplate[] {
  return glyphs.filter((g) => g.letterId === letterId);
}

type Mask = {
  cells: boolean[];
  aspect: number;
  inkCount: number;
  /** Доля чернил в каждой строке и каждом столбце, нормированная на максимум. */
  rowProfile: number[];
  colProfile: number[];
  /** Число замкнутых пустот: отличает ם от מ и ס от כ. */
  holes: number;
};

/** Расширение на одну клетку: закрывает разрывы в один пиксель. */
function dilate(cells: boolean[]): boolean[] {
  const out = new Array<boolean>(GRID * GRID).fill(false);
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (!cells[y * GRID + x]) continue;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
          out[ny * GRID + nx] = true;
        }
      }
    }
  }
  return out;
}

/**
 * Замкнутые области фона — заливка от границы, остаток и есть пустоты.
 *
 * Считаем по расширенной копии: рисунок и шаблон попадают в сетку немного
 * по-разному, и разрыв в одну клетку не должен превращать замкнутое ס в
 * открытое. Широкие просветы (у ח снизу, у ט сверху) расширение переживают.
 */
function countHoles(source: boolean[]): number {
  const cells = dilate(source);
  const outside = new Array<boolean>(GRID * GRID).fill(false);
  const queue: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return;
    const index = y * GRID + x;
    if (outside[index] || cells[index]) return;
    outside[index] = true;
    queue.push(index);
  };
  for (let i = 0; i < GRID; i += 1) {
    push(i, 0);
    push(i, GRID - 1);
    push(0, i);
    push(GRID - 1, i);
  }
  for (let head = 0; head < queue.length; head += 1) {
    const index = queue[head] as number;
    const x = index % GRID;
    const y = Math.floor(index / GRID);
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  const seen = new Array<boolean>(GRID * GRID).fill(false);
  let holes = 0;
  for (let start = 0; start < cells.length; start += 1) {
    if (cells[start] || outside[start] || seen[start]) continue;
    holes += 1;
    const stack = [start];
    seen[start] = true;
    while (stack.length > 0) {
      const index = stack.pop() as number;
      const x = index % GRID;
      const y = Math.floor(index / GRID);
      [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ].forEach(([nx, ny]) => {
        if (nx === undefined || ny === undefined) return;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) return;
        const next = ny * GRID + nx;
        if (cells[next] || outside[next] || seen[next]) return;
        seen[next] = true;
        stack.push(next);
      });
    }
  }
  return holes;
}

function describeMask(cells: boolean[], aspect: number): Mask {
  const rows = new Array<number>(GRID).fill(0);
  const cols = new Array<number>(GRID).fill(0);
  let inkCount = 0;
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (!cells[y * GRID + x]) continue;
      inkCount += 1;
      rows[y] = (rows[y] as number) + 1;
      cols[x] = (cols[x] as number) + 1;
    }
  }
  const normalise = (values: number[]) => {
    const max = Math.max(1, ...values);
    return values.map((value) => value / max);
  };
  return {
    cells,
    aspect,
    inkCount,
    rowProfile: normalise(rows),
    colProfile: normalise(cols),
    holes: countHoles(cells),
  };
}

/**
 * Приводит набор закрашенных клеток к единому кадру: рамка чернил растягивается
 * до стороны сетки, масштаб единый по осям, остаток центруется. Через это
 * проходят и шаблон, и рисунок — иначе они сравнивались бы в разных системах
 * координат и даже идеальная обводка давала бы нулевой балл.
 */
function fitToGrid(source: boolean[]): { cells: boolean[]; aspect: number } | null {
  let minX = GRID;
  let minY = GRID;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (!source[y * GRID + x]) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const span = Math.max(width, height);
  const offsetX = minX - (span - width) / 2;
  const offsetY = minY - (span - height) / 2;

  const cells = new Array<boolean>(GRID * GRID).fill(false);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (!source[y * GRID + x]) continue;
      // Клетка источника покрывает прямоугольник в приёмнике — заливаем целиком,
      // иначе при растяжении в линиях появились бы разрывы.
      const x0 = Math.floor(((x - offsetX) / span) * GRID);
      const x1 = Math.ceil(((x + 1 - offsetX) / span) * GRID);
      const y0 = Math.floor(((y - offsetY) / span) * GRID);
      const y1 = Math.ceil(((y + 1 - offsetY) / span) * GRID);
      for (let ty = y0; ty < Math.max(y1, y0 + 1); ty += 1) {
        for (let tx = x0; tx < Math.max(x1, x0 + 1); tx += 1) {
          if (tx < 0 || ty < 0 || tx >= GRID || ty >= GRID) continue;
          cells[ty * GRID + tx] = true;
        }
      }
    }
  }
  return { cells, aspect: width / height };
}

function maskFromRows(rows: string[]): Mask | null {
  const raw = new Array<boolean>(GRID * GRID).fill(false);
  rows.forEach((row, y) => {
    for (let x = 0; x < GRID; x += 1) {
      if (row[x] === '#') raw[y * GRID + x] = true;
    }
  });
  const fitted = fitToGrid(raw);
  if (!fitted) return null;
  return describeMask(fitted.cells, fitted.aspect);
}

const templateMasks = new Map<string, Mask>(
  glyphs.flatMap((g) => {
    const mask = maskFromRows(g.rows);
    return mask ? [[g.id, mask] as [string, Mask]] : [];
  })
);

export function totalInk(strokes: Stroke[]): number {
  return strokes.reduce((sum, stroke) => sum + stroke.length, 0);
}

/** Длина ломаной — помогает отбросить случайные точки-касания. */
export function strokeLength(strokes: Stroke[]): number {
  let length = 0;
  strokes.forEach((stroke) => {
    for (let i = 1; i < stroke.length; i += 1) {
      const a = stroke[i - 1] as Point;
      const b = stroke[i] as Point;
      length += Math.hypot(b.x - a.x, b.y - a.y);
    }
  });
  return length;
}

/**
 * Переносит рисунок в сетку GRID×GRID. Масштаб единый по осям, чтобы узкие
 * буквы (ו, ן) не растягивались в квадрат и оставались отличимыми.
 */
export function rasterise(strokes: Stroke[]): Mask | null {
  const points = strokes.flat();
  if (points.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  points.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  const width = Math.max(maxX - minX, 1e-6);
  const height = Math.max(maxY - minY, 1e-6);
  const span = Math.max(width, height);
  const offsetX = minX - (span - width) / 2;
  const offsetY = minY - (span - height) / 2;

  const cells = new Array<boolean>(GRID * GRID).fill(false);
  const put = (x: number, y: number) => {
    const gx = Math.min(GRID - 1, Math.max(0, Math.floor(((x - offsetX) / span) * GRID)));
    const gy = Math.min(GRID - 1, Math.max(0, Math.floor(((y - offsetY) / span) * GRID)));
    cells[gy * GRID + gx] = true;
  };

  strokes.forEach((stroke) => {
    if (stroke.length === 1) {
      const only = stroke[0] as Point;
      put(only.x, only.y);
      return;
    }
    for (let i = 1; i < stroke.length; i += 1) {
      const a = stroke[i - 1] as Point;
      const b = stroke[i] as Point;
      const steps = Math.max(
        1,
        Math.ceil((Math.hypot(b.x - a.x, b.y - a.y) / span) * GRID * 2)
      );
      for (let s = 0; s <= steps; s += 1) {
        const t = s / steps;
        put(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
      }
    }
  });

  if (!cells.some(Boolean)) return null;
  return describeMask(cells, width / height);
}

/** Расстояние Чебышёва до ближайшей закрашенной клетки, волновым обходом. */
function distanceField(mask: Mask): number[] {
  const dist = new Array<number>(GRID * GRID).fill(Infinity);
  const queue: number[] = [];
  for (let i = 0; i < mask.cells.length; i += 1) {
    if (mask.cells[i]) {
      dist[i] = 0;
      queue.push(i);
    }
  }
  for (let head = 0; head < queue.length; head += 1) {
    const index = queue[head] as number;
    const x = index % GRID;
    const y = Math.floor(index / GRID);
    const base = dist[index] as number;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
        const next = ny * GRID + nx;
        if ((dist[next] as number) > base + 1) {
          dist[next] = base + 1;
          queue.push(next);
        }
      }
    }
  }
  return dist;
}

/** На сколько клеток прощаем промах, прежде чем считать штрих лишним. */
const DILATION = 1;

function profileSimilarity(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += Math.abs((a[i] as number) - (b[i] as number));
  }
  return Math.max(0, 1 - sum / a.length);
}

/**
 * Балл похожести складывается из трёх частей:
 * 1) согласие чернил — доля клеток, которые есть в рисунке, но не у шаблона,
 *    и наоборот. Штрафуются и лишние штрихи, и недописанные: иначе широкая
 *    ש притягивала бы к себе любой рисунок;
 * 2) профили строк и столбцов — где именно проходят перекладины и просветы,
 *    это и отличает ה от פ;
 * 3) число замкнутых пустот — отличает ם от מ и ס от כ.
 */
function similarity(drawing: Mask, drawingField: number[], template: Mask): number {
  const templateField = distanceField(template);

  let extra = 0;
  let missing = 0;
  for (let i = 0; i < drawing.cells.length; i += 1) {
    if (drawing.cells[i] && (templateField[i] as number) > DILATION) extra += 1;
    if (template.cells[i] && (drawingField[i] as number) > DILATION) missing += 1;
  }
  const agreement = 1 - (extra + missing) / (drawing.inkCount + template.inkCount);

  const profile =
    0.5 * profileSimilarity(drawing.rowProfile, template.rowProfile) +
    0.5 * profileSimilarity(drawing.colProfile, template.colProfile);

  const aspectRatio =
    Math.min(drawing.aspect, template.aspect) / Math.max(drawing.aspect, template.aspect);
  const aspectFactor = 0.8 + 0.2 * Math.max(0, Math.min(1, aspectRatio));

  // Замкнутость — топологический факт, а не мелкая деталь: ס от ט и ם от ח
  // отличаются именно ею, поэтому штраф ощутимый. Полностью обнулять балл всё
  // равно нельзя — от руки контур часто не сходится на одну клетку.
  const holeFactor = 0.62 ** Math.abs(drawing.holes - template.holes);

  return Math.max(0, agreement) ** 0.7 * profile ** 0.3 * aspectFactor * holeFactor;
}

export type Candidate = { glyphId: string; char: string; score: number };

export type Verdict = 'match' | 'mismatch' | 'unsure';

export type Recognition = {
  verdict: Verdict;
  /** Насколько рисунок похож на ожидаемую букву, 0–1. */
  expectedScore: number;
  /** Лучший кандидат среди всех букв. */
  best: Candidate | null;
  /** Отрыв ожидаемой буквы от лучшего конкурента, может быть отрицательным. */
  margin: number;
  ranked: Candidate[];
};

export const MIN_STROKE_LENGTH = 0.35; // в долях стороны холста

/** Ниже этого балла начертание считается слишком непохожим, чтобы зачесть. */
const MATCH_SCORE = 0.75;
/**
 * Ожидаемая буква должна быть лучшим кандидатом. Крошечный допуск оставлен для
 * пар, которые отличаются только положением относительно строки (ו и ן): после
 * приведения к рамке они почти совпадают.
 */
const MATCH_TOLERANCE = 0.02;
/** Чтобы объявить ошибку, другая буква должна быть узнана уверенно... */
const RIVAL_SCORE = 0.78;
/** ...и опередить ожидаемую вот настолько. */
const MISMATCH_MARGIN = 0.05;

export function rank(strokes: Stroke[]): Candidate[] {
  const drawing = rasterise(strokes);
  if (!drawing) return [];
  const drawingField = distanceField(drawing);
  return glyphs
    .map((glyph) => {
      const template = templateMasks.get(glyph.id);
      if (!template) return { glyphId: glyph.id, char: glyph.char, score: 0 };
      return {
        glyphId: glyph.id,
        char: glyph.char,
        score: similarity(drawing, drawingField, template),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Сверяет рисунок с ожидаемой буквой.
 *
 * `match` — начертание похоже на ожидаемое и никакая другая буква не похожа
 * заметно больше. `mismatch` — уверенно узнана другая буква. `unsure` —
 * слишком мало чернил или слишком близкие варианты: в этом случае просим
 * написать ещё раз и не записываем ошибку.
 */
export function recognise(strokes: Stroke[], expectedGlyphId: string): Recognition {
  const empty: Recognition = {
    verdict: 'unsure',
    expectedScore: 0,
    best: null,
    margin: 0,
    ranked: [],
  };

  if (!templateMasks.has(expectedGlyphId)) return empty;
  if (strokeLength(strokes) < MIN_STROKE_LENGTH) return empty;

  const ranked = rank(strokes);
  if (ranked.length === 0) return empty;

  const expected = ranked.find((candidate) => candidate.glyphId === expectedGlyphId);
  const expectedScore = expected?.score ?? 0;
  const best = ranked[0] as Candidate;

  const rival = ranked.find((candidate) => candidate.glyphId !== expectedGlyphId) ?? null;
  const margin = expectedScore - (rival?.score ?? 0);

  const result: Recognition = { verdict: 'unsure', expectedScore, best, margin, ranked };

  if (expectedScore >= MATCH_SCORE && margin >= -MATCH_TOLERANCE) {
    return { ...result, verdict: 'match' };
  }
  if (rival && rival.score >= RIVAL_SCORE && margin <= -MISMATCH_MARGIN) {
    return { ...result, verdict: 'mismatch' };
  }
  return result;
}

/**
 * Во что превращается жест для планировщика. `null` означает «не оценивать»:
 * при низкой уверенности просим написать заново и ошибку не записываем.
 */
export function gradeForVerdict(verdict: Verdict): Grade | null {
  if (verdict === 'match') return 'good';
  if (verdict === 'mismatch') return 'again';
  return null;
}
