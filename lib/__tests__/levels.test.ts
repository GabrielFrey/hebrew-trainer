import { decks, levels, words } from '@/lib/data';
import {
  canToggleNikud,
  deckIdsForLevel,
  decksForLevel,
  hebrewFor,
  passagesForLevel,
  phrasesForLevel,
  showNikud,
  showTranscription,
  teachesLetters,
  wordsForLevel,
} from '@/lib/levels';
import { buildSession, MAX_NEW_WORDS_PER_SESSION } from '@/lib/session';
import { createCard } from '@/lib/srs';
import { emptyProgress } from '@/lib/storage';
import type { LevelId, Progress, Settings } from '@/lib/types';

function at(level: LevelId): Progress {
  const base = emptyProgress();
  return { ...base, settings: { ...base.settings, onboarded: true, level } };
}

const NOW = Date.UTC(2026, 1, 10, 9, 0, 0);

describe('уровни', () => {
  it('идут от элементарного к максимально продвинутому', () => {
    expect(levels.map((level) => level.id)).toEqual([
      'elementary',
      'basic',
      'intermediate',
      'advanced',
      'expert',
    ]);
  });

  it('открывают колоды текущего уровня и всех ниже', () => {
    expect(deckIdsForLevel('elementary')).toEqual(['frequent']);
    expect(deckIdsForLevel('basic')).toEqual([
      'frequent',
      'numbers',
      'family',
      'food',
      'verbs-present',
    ]);
    expect(deckIdsForLevel('expert')).toEqual(decks.map((deck) => deck.id));
  });

  it('накапливает словарь с ростом уровня и никогда не урезает его', () => {
    const sizes = levels.map((level) => wordsForLevel(level.id).length);
    sizes.forEach((size, index) => {
      if (index > 0) expect(size).toBeGreaterThan(sizes[index - 1] as number);
    });
    expect(sizes[sizes.length - 1]).toBe(words.length);
  });

  it('фильтрует новые слова в очереди по уровню', () => {
    const elementaryDecks = new Set(deckIdsForLevel('elementary'));
    const queue = buildSession(at('elementary'), NOW);
    const newWords = queue.filter((card) => card.kind === 'word');
    expect(newWords.length).toBeGreaterThan(0);
    newWords.forEach((card) => {
      const word = words.find((w) => w.id === card.refId);
      expect(word).toBeDefined();
      expect(elementaryDecks.has(word?.deck ?? '')).toBe(true);
    });
  });

  it('не выдаёт слова продвинутых колод на базовом уровне', () => {
    const queue = buildSession(at('basic'), NOW);
    const levelsSeen = queue
      .filter((card) => card.kind === 'word')
      .map((card) => words.find((w) => w.id === card.refId)?.level);
    expect(levelsSeen).not.toContain('advanced');
    expect(levelsSeen).not.toContain('expert');
  });

  it('сохраняет лимит пяти новых слов на любом уровне', () => {
    levels.forEach((level) => {
      const queue = buildSession(at(level.id), NOW);
      const newWords = queue.filter((card) => card.isNew && card.kind === 'word');
      expect(newWords.length).toBeLessThanOrEqual(MAX_NEW_WORDS_PER_SESSION);
    });
  });

  it('не вводит буквы начиная со среднего уровня', () => {
    expect(teachesLetters('elementary')).toBe(true);
    expect(teachesLetters('basic')).toBe(true);
    expect(teachesLetters('intermediate')).toBe(false);
    expect(buildSession(at('advanced'), NOW).filter((c) => c.kind === 'letter')).toHaveLength(0);
  });

  it('оставляет начатые карточки в повторениях после смены уровня', () => {
    const progress = at('expert');
    const elementaryWord = words.find((word) => word.level === 'elementary');
    expect(elementaryWord).toBeDefined();
    progress.cards[`word:${elementaryWord?.id}`] = {
      ...createCard('word', elementaryWord?.id ?? '', NOW - 10 * 86400000),
      reps: 2,
      intervalDays: 6,
      dueAt: NOW - 1000,
    };

    const queue = buildSession(progress, NOW);
    expect(queue.some((card) => card.refId === elementaryWord?.id)).toBe(true);
  });

  it('задаёт политику огласовок и транскрипции по уровню', () => {
    expect(canToggleNikud('elementary')).toBe(false);
    expect(canToggleNikud('basic')).toBe(false);
    expect(canToggleNikud('intermediate')).toBe(true);
    expect(canToggleNikud('advanced')).toBe(true);

    expect(showTranscription('advanced')).toBe(true);
    expect(showTranscription('expert')).toBe(false);

    const elementary: Settings = { ...at('elementary').settings, showNikud: false };
    // На элементарном уровне огласовки остаются, даже если флаг выключен.
    expect(showNikud(elementary)).toBe(true);

    const advanced: Settings = { ...at('advanced').settings, showNikud: false };
    expect(showNikud(advanced)).toBe(false);
  });

  it('подставляет текст с огласовками или без по политике уровня', () => {
    const word = words[0];
    expect(word).toBeDefined();
    if (!word) return;
    expect(hebrewFor(word, at('elementary').settings)).toBe(word.nikud);
    expect(hebrewFor(word, { ...at('advanced').settings, showNikud: false })).toBe(word.hebrew);
  });

  it('держит длину фраз в рамках уровня', () => {
    levels.forEach((level) => {
      const own = phrasesForLevel(level.id).filter((phrase) => phrase.level === level.id);
      const [min, max] = level.phraseWords;
      own.forEach((phrase) => {
        const count = phrase.hebrew.trim().split(/\s+/).length;
        expect(count).toBeGreaterThanOrEqual(min);
        expect(count).toBeLessThanOrEqual(max);
      });
    });
  });

  it('даёт абзацы только на максимально продвинутом уровне', () => {
    expect(passagesForLevel('advanced')).toHaveLength(0);
    expect(passagesForLevel('expert').length).toBeGreaterThan(0);
    passagesForLevel('expert').forEach((passage) => {
      expect(passage.options).toContain(passage.answer);
      // Вопрос и варианты ответа — на иврите.
      expect(passage.question.hebrew).toMatch(/[\u05D0-\u05EA]/);
      passage.options.forEach((option) => expect(option).toMatch(/[\u05D0-\u05EA]/));
    });
  });

  it('открывает колоды только того уровня, который выбран', () => {
    expect(decksForLevel('elementary').map((deck) => deck.id)).toEqual(['frequent']);
    decksForLevel('intermediate').forEach((deck) => {
      expect(['elementary', 'basic', 'intermediate']).toContain(deck.level);
    });
  });
});
