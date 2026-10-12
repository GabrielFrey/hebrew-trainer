import { glyphForChar, glyphs, gradeForVerdict, recognise, strokesFromGlyph } from '@/lib/handwriting';
import type { GlyphTemplate } from '@/lib/handwriting';
import { buildSession } from '@/lib/session';
import { createCard, isDue, schedule } from '@/lib/srs';
import { emptyProgress } from '@/lib/storage';
import type { Progress } from '@/lib/types';

const NOW = Date.UTC(2026, 1, 10, 9, 0, 0);

/** Путь «нарисовал → распознали → отдали планировщику», как в экране сессии. */
function writeAnswer(expectedGlyphId: string, drawn: GlyphTemplate, card = createCard('letter', 'alef', NOW)) {
  const result = recognise(strokesFromGlyph(drawn), expectedGlyphId);
  const grade = gradeForVerdict(result.verdict);
  return { result, grade, next: grade ? schedule(card, grade, NOW) : card };
}

describe('рукописный ответ попадает в SM-2', () => {
  it('верное начертание засчитывается как правильный ответ', () => {
    const alef = glyphForChar('א') as GlyphTemplate;
    const { result, grade, next } = writeAnswer(alef.id, alef);

    expect(result.verdict).toBe('match');
    expect(grade).toBe('good');
    expect(next.reps).toBe(1);
    expect(next.correct).toBe(1);
    expect(next.total).toBe(1);
    expect(next.intervalDays).toBeGreaterThan(0);
    expect(isDue(next, NOW)).toBe(false);
  });

  it('чужая буква сбрасывает интервал и возвращает карточку на сегодня', () => {
    const alef = glyphForChar('א') as GlyphTemplate;
    const bet = glyphForChar('ב') as GlyphTemplate;
    const mature = schedule(schedule(createCard('letter', 'alef', NOW), 'good', NOW), 'good', NOW);
    expect(mature.intervalDays).toBe(6);

    const { result, grade, next } = writeAnswer(alef.id, bet, mature);
    expect(result.verdict).toBe('mismatch');
    expect(grade).toBe('again');
    expect(next.intervalDays).toBe(0);
    expect(next.lapses).toBe(1);
    expect(isDue(next, NOW)).toBe(true);
  });

  it('при низкой уверенности карточка не оценивается вообще', () => {
    const card = createCard('letter', 'alef', NOW);
    const result = recognise([[{ x: 0.5, y: 0.5 }]], 'alef');
    expect(result.verdict).toBe('unsure');

    const grade = gradeForVerdict(result.verdict);
    expect(grade).toBeNull();
    // Ни ответа, ни ошибки: счётчики остаются нулевыми.
    expect(card.total).toBe(0);
    expect(card.lapses).toBe(0);
  });

  it('конечная форма оценивается отдельно от базовой', () => {
    const memFinal = glyphForChar('ם') as GlyphTemplate;
    const memBase = glyphForChar('מ') as GlyphTemplate;

    expect(writeAnswer(memFinal.id, memFinal).grade).toBe('good');
    expect(writeAnswer(memFinal.id, memBase).grade).not.toBe('good');
  });

  it('упражнение «напиши букву» приходит с ожидаемым глифом', () => {
    const progress: Progress = (() => {
      const base = emptyProgress();
      const next = { ...base, settings: { ...base.settings, onboarded: true } };
      // Буквы с историей повторений начинают спрашиваться на письмо.
      ['alef', 'bet', 'gimel', 'dalet', 'he', 'vav'].forEach((id) => {
        next.cards[`letter:${id}`] = {
          ...createCard('letter', id, NOW - 20 * 86400000),
          reps: 4,
          intervalDays: 6,
          dueAt: NOW - 1000,
        };
      });
      return next;
    })();

    const queue = buildSession(progress, NOW);
    const writeCards = queue.filter((card) => card.exercise === 'letter-write');
    expect(writeCards.length).toBeGreaterThan(0);
    writeCards.forEach((card) => {
      expect(card.expectedGlyph).toBeDefined();
      expect(glyphs.some((glyph) => glyph.id === card.expectedGlyph)).toBe(true);
    });
  });
});
