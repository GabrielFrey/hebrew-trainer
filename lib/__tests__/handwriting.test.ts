import {
  GRID,
  glyphForChar,
  glyphs,
  rank,
  recognise,
  strokeLength,
} from '@/lib/handwriting';
import type { GlyphTemplate, Stroke } from '@/lib/handwriting';

/**
 * «Рисует» букву по её шаблону: точки в центрах закрашенных клеток, при
 * необходимости со сдвигом, имитирующим дрожание руки.
 */
function drawGlyph(glyph: GlyphTemplate, jitter = 0, seed = 1): Stroke[] {
  let state = seed;
  const random = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648 - 0.5;
  };
  // Каждая горизонтальная полоска шаблона — отдельный штрих. Если отдать все
  // точки одной ломаной, rasterise соединит их диагоналями и получится клякса.
  const strokes: Stroke[] = [];
  glyph.rows.forEach((row, y) => {
    let run: { x: number; y: number }[] = [];
    [...row].forEach((cell, x) => {
      if (cell === '#') {
        run.push({ x: x + 0.5 + random() * jitter, y: y + 0.5 + random() * jitter });
      } else if (run.length > 0) {
        strokes.push(run);
        run = [];
      }
    });
    if (run.length > 0) strokes.push(run);
  });
  return strokes;
}

describe('шаблоны букв', () => {
  it('покрывают 22 буквы и 5 конечных форм', () => {
    expect(glyphs).toHaveLength(27);
    expect(glyphs.filter((g) => g.form === 'final').map((g) => g.char)).toEqual([
      'ך',
      'ם',
      'ן',
      'ף',
      'ץ',
    ]);
    expect(GRID).toBeGreaterThanOrEqual(12);
  });

  it('каждая конечная форма отличима по шаблону от базовой', () => {
    glyphs
      .filter((g) => g.form === 'final')
      .forEach((final) => {
        const base = glyphs.find((g) => g.letterId === final.letterId && g.form === 'base');
        expect(base).toBeDefined();
        expect(final.rows.join('')).not.toBe(base?.rows.join(''));
      });
  });
});

describe('распознавание рукописного ввода', () => {
  it('узнаёт каждую букву по её собственному начертанию', () => {
    glyphs.forEach((glyph) => {
      const result = recognise(drawGlyph(glyph), glyph.id);
      expect(result.verdict).toBe('match');
      expect(rank(drawGlyph(glyph))[0]?.glyphId).toBe(glyph.id);
    });
  });

  it('не засчитывает чужую букву как верную', () => {
    const samples: [string, string][] = [
      ['alef', 'bet'],
      ['bet', 'alef'],
      ['dalet', 'samekh'],
      ['mem', 'alef'],
      ['shin', 'lamed'],
    ];
    samples.forEach(([expectedId, drawnId]) => {
      const drawn = glyphs.find((g) => g.id === drawnId) as GlyphTemplate;
      const result = recognise(drawGlyph(drawn), expectedId);
      expect(result.verdict).not.toBe('match');
    });
  });

  it('отличает конечную форму от базовой', () => {
    const memFinal = glyphForChar('ם') as GlyphTemplate;
    const memBase = glyphForChar('מ') as GlyphTemplate;
    expect(recognise(drawGlyph(memFinal), memFinal.id).verdict).toBe('match');
    expect(recognise(drawGlyph(memBase), memFinal.id).verdict).not.toBe('match');
  });

  it('терпит дрожание руки примерно в одну клетку', () => {
    const matched = glyphs.filter(
      (glyph) => recognise(drawGlyph(glyph, 1, 7), glyph.id).verdict === 'match'
    );
    expect(matched.length / glyphs.length).toBeGreaterThanOrEqual(0.9);
  });

  it('просит написать заново, когда чернил слишком мало', () => {
    expect(recognise([[{ x: 5, y: 5 }]], 'alef').verdict).toBe('unsure');
    expect(recognise([], 'alef').verdict).toBe('unsure');
    expect(
      recognise([[{ x: 0, y: 0 }, { x: 0.05, y: 0.05 }]], 'alef').verdict
    ).toBe('unsure');
  });

  it('считает длину ломаной', () => {
    expect(strokeLength([[{ x: 0, y: 0 }, { x: 3, y: 4 }]])).toBeCloseTo(5);
    expect(strokeLength([])).toBe(0);
  });
});
