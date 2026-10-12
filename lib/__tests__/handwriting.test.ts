import {
  BASELINE_ROW,
  GRID,
  glyphForChar,
  glyphs,
  rank,
  recognise,
  strokeLength,
  strokesFromGlyph,
} from '@/lib/handwriting';
import type { GlyphTemplate, Stroke } from '@/lib/handwriting';

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
    expect(BASELINE_ROW).toBeGreaterThan(8);
    expect(BASELINE_ROW).toBeLessThan(GRID);
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

  it('у ן и ך спуск ниже базовой линии, у ו и י — нет', () => {
    const vav = glyphForChar('ו') as GlyphTemplate;
    const nunFinal = glyphForChar('ן') as GlyphTemplate;
    const yod = glyphForChar('י') as GlyphTemplate;
    const kafFinal = glyphForChar('ך') as GlyphTemplate;

    expect(vav.relativeDescent).toBeLessThan(0.08);
    expect(yod.relativeDescent).toBeLessThan(0.08);
    expect(nunFinal.relativeDescent).toBeGreaterThan(0.15);
    expect(kafFinal.relativeDescent).toBeGreaterThan(0.15);
  });
});

describe('распознавание рукописного ввода', () => {
  it('узнаёт каждую букву по её собственному начертанию', () => {
    glyphs.forEach((glyph) => {
      const result = recognise(strokesFromGlyph(glyph), glyph.id);
      expect(result.verdict).toBe('match');
      expect(result.margin).toBeGreaterThan(-0.02);
    });
  });

  it('различает ו/ן и י/ך по положению относительно базовой линии', () => {
    const twins: [string, string][] = [
      ['ו', 'ן'],
      ['י', 'ך'],
    ];
    twins.forEach(([shortChar, longChar]) => {
      const short = glyphForChar(shortChar) as GlyphTemplate;
      const long = glyphForChar(longChar) as GlyphTemplate;

      expect(recognise(strokesFromGlyph(short), short.id).verdict).toBe('match');
      expect(recognise(strokesFromGlyph(long), long.id).verdict).toBe('match');
      expect(recognise(strokesFromGlyph(short), long.id).verdict).not.toBe('match');
      expect(recognise(strokesFromGlyph(long), short.id).verdict).not.toBe('match');

      const scores = rank(strokesFromGlyph(short));
      const forShort = scores.find((c) => c.glyphId === short.id)?.score ?? 0;
      const forLong = scores.find((c) => c.glyphId === long.id)?.score ?? 0;
      expect(forShort).toBeGreaterThan(forLong + 0.05);
    });
  });

  it('при неоднозначном спуске ниже линии отвечает «не уверен»', () => {
    // Палочка чуть заходит за пунктир: ни ו, ни ן.
    const stroke: Stroke[] = [[{ x: 0.5, y: 0.22 }, { x: 0.5, y: 0.54 }]];
    expect(recognise(stroke, 'vav').verdict).toBe('unsure');
    expect(recognise(stroke, 'nun-final').verdict).toBe('unsure');
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
      const result = recognise(strokesFromGlyph(drawn), expectedId);
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
      expect(recognise(strokesFromGlyph(final), final.id).verdict).toBe('match');
      expect(recognise(strokesFromGlyph(base), base.id).verdict).toBe('match');
      expect(recognise(strokesFromGlyph(base), final.id).verdict).not.toBe('match');
      expect(recognise(strokesFromGlyph(final), base.id).verdict).not.toBe('match');
    });
  });

  it('узнаёт замкнутые буквы, не путая их с открытыми', () => {
    const closedVsOpen: [string, string][] = [
      ['ס', 'ט'],
      ['ם', 'ח'],
    ];
    closedVsOpen.forEach(([closed, open]) => {
      const a = glyphForChar(closed) as GlyphTemplate;
      const b = glyphForChar(open) as GlyphTemplate;
      expect(recognise(strokesFromGlyph(a), a.id).verdict).toBe('match');
      expect(recognise(strokesFromGlyph(b), a.id).verdict).not.toBe('match');
    });
  });

  it('терпит дрожание руки примерно в одну клетку', () => {
    const matched = glyphs.filter(
      (glyph) => recognise(strokesFromGlyph(glyph, 1, 7), glyph.id).verdict === 'match'
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
