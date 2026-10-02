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
      // Ожидаемая буква — либо лучший кандидат, либо отстаёт на доли балла.
      expect(result.margin).toBeGreaterThan(-0.02);
    });
  });

  /**
   * Известное ограничение. ו и ן, как и י и ך, это одна и та же фигура,
   * отличающаяся только положением относительно строки: ן и ך спускаются ниже
   * базовой линии. Приведение рисунка к его собственной рамке делает буквы
   * устойчивыми к тому, где и каким размером пишет человек, но именно эту
   * разницу стирает. Тест фиксирует поведение, чтобы оно не менялось молча.
   */
  it('не различает фигуры, отличающиеся только уровнем строки', () => {
    const twins: [string, string][] = [
      ['ו', 'ן'],
      ['י', 'ך'],
    ];
    twins.forEach(([a, b]) => {
      const first = glyphForChar(a) as GlyphTemplate;
      const second = glyphForChar(b) as GlyphTemplate;
      const scores = rank(drawGlyph(first));
      const forFirst = scores.find((c) => c.glyphId === first.id)?.score ?? 0;
      const forSecond = scores.find((c) => c.glyphId === second.id)?.score ?? 0;
      expect(Math.abs(forFirst - forSecond)).toBeLessThan(0.05);
      // Ошибкой это не объявляется: пользователь не получит ложного «неверно».
      expect(recognise(drawGlyph(first), second.id).verdict).not.toBe('mismatch');
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

  it('отличает каждую конечную форму от её базовой буквы', () => {
    const pairs: [string, string][] = [
      ['ך', 'כ'],
      ['ם', 'מ'],
      ['ן', 'נ'],
      ['ף', 'פ'],
      ['ץ', 'צ'],
    ];
    pairs.forEach(([finalChar, baseChar]) => {
      const final = glyphForChar(finalChar) as GlyphTemplate;
      const base = glyphForChar(baseChar) as GlyphTemplate;
      // Своё начертание зачитывается...
      expect(recognise(drawGlyph(final), final.id).verdict).toBe('match');
      expect(recognise(drawGlyph(base), base.id).verdict).toBe('match');
      // ...а базовая форма вместо конечной — нет.
      expect(recognise(drawGlyph(base), final.id).verdict).not.toBe('match');
      expect(recognise(drawGlyph(final), base.id).verdict).not.toBe('match');
    });
  });

  it('узнаёт замкнутые буквы, не путая их с открытыми', () => {
    // ס замкнута, ט открыта сверху; ם замкнута, ח открыта снизу.
    const closedVsOpen: [string, string][] = [
      ['ס', 'ט'],
      ['ם', 'ח'],
    ];
    closedVsOpen.forEach(([closed, open]) => {
      const a = glyphForChar(closed) as GlyphTemplate;
      const b = glyphForChar(open) as GlyphTemplate;
      expect(recognise(drawGlyph(a), a.id).verdict).toBe('match');
      expect(recognise(drawGlyph(b), a.id).verdict).not.toBe('match');
    });
  });

  it('терпит дрожание руки примерно в одну клетку', () => {
    const matched = glyphs.filter(
      (glyph) => recognise(drawGlyph(glyph, 1, 7), glyph.id).verdict === 'match'
    );
    expect(matched).toHaveLength(glyphs.length);
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
