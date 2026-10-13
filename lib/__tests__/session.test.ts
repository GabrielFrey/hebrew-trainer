import { letters, phrases, words } from '@/lib/data';
import {
  MAX_NEW_LETTERS_PER_SESSION,
  MAX_NEW_WORDS_PER_SESSION,
  SESSION_SIZE,
  buildSession,
  summariseToday,
} from '@/lib/session';
import { createCard, schedule } from '@/lib/srs';
import { emptyProgress } from '@/lib/storage';
import type { Progress } from '@/lib/types';

const NOW = Date.UTC(2026, 0, 15, 9, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

function onboarded(): Progress {
  const base = emptyProgress();
  return { ...base, settings: { ...base.settings, onboarded: true } };
}

describe('сборка очереди', () => {
  it('не выдаёт больше 15 карточек', () => {
    expect(buildSession(onboarded(), NOW).length).toBeLessThanOrEqual(SESSION_SIZE);
  });

  it('первая сессия короче лимита: новый материал ограничен', () => {
    const queue = buildSession(onboarded(), NOW);
    expect(queue.every((card) => card.isNew)).toBe(true);
    expect(queue).toHaveLength(
      MAX_NEW_LETTERS_PER_SESSION + MAX_NEW_WORDS_PER_SESSION
    );
  });

  it('добирает очередь до 15 карточек, когда накопились повторения', () => {
    const progress = onboarded();
    words.forEach((word, index) => {
      progress.cards[`word:${word.id}`] = {
        ...createCard('word', word.id, NOW - 30 * DAY),
        reps: 2,
        intervalDays: 6,
        dueAt: NOW - (index + 1) * 1000,
      };
    });
    expect(buildSession(progress, NOW)).toHaveLength(SESSION_SIZE);
  });

  it('не вводит больше пяти новых слов за сессию', () => {
    const queue = buildSession(onboarded(), NOW);
    const newWords = queue.filter((card) => card.isNew && card.kind === 'word');
    expect(newWords.length).toBeLessThanOrEqual(MAX_NEW_WORDS_PER_SESSION);
  });

  it('начинает с букв, когда уровень «с нуля»', () => {
    const queue = buildSession(onboarded(), NOW);
    expect(queue[0]?.kind).toBe('letter');
    expect(queue.some((card) => card.kind === 'letter')).toBe(true);
  });

  it('не вводит новые буквы, если пользователь уже знает алфавит', () => {
    const progress = onboarded();
    progress.settings.level = 'intermediate';
    const queue = buildSession(progress, NOW);
    expect(queue.filter((card) => card.kind === 'letter')).toHaveLength(0);
  });

  it('ставит в очередь только просроченные повторения', () => {
    const progress = onboarded();
    const dueWord = words[0];
    const futureWord = words[1];
    if (!dueWord || !futureWord) throw new Error('нужны минимум два слова в data/hebrew.json');

    progress.cards[`word:${dueWord.id}`] = {
      ...createCard('word', dueWord.id, NOW - 10 * DAY),
      reps: 2,
      intervalDays: 6,
      dueAt: NOW - DAY,
    };
    progress.cards[`word:${futureWord.id}`] = {
      ...createCard('word', futureWord.id, NOW - 10 * DAY),
      reps: 2,
      intervalDays: 6,
      dueAt: NOW + 5 * DAY,
    };

    const queue = buildSession(progress, NOW);
    expect(queue.some((card) => card.refId === dueWord.id)).toBe(true);
    expect(queue.some((card) => card.refId === futureWord.id)).toBe(false);
  });

  it('возвращает пустую очередь, когда всё повторено, и предлагает досрочный проход', () => {
    const progress = onboarded();
    const seed = (kind: 'letter' | 'word' | 'phrase', id: string) => {
      progress.cards[`${kind}:${id}`] = {
        ...createCard(kind, id, NOW - 30 * DAY),
        reps: 3,
        intervalDays: 30,
        dueAt: NOW + 30 * DAY,
      };
    };
    letters.forEach((item) => seed('letter', item.id));
    words.forEach((item) => seed('word', item.id));
    phrases.forEach((item) => seed('phrase', item.id));

    const summary = summariseToday(progress, NOW);
    expect(summary.queueSize).toBe(0);
    expect(buildSession(progress, NOW, { allowAhead: true }).length).toBeGreaterThan(0);
    expect(summary.aheadAvailable).toBeGreaterThan(0);
  });

  it('даёт каждой карточке вариант ответа, содержащий правильный', () => {
    buildSession(onboarded(), NOW).forEach((card) => {
      if (card.exercise === 'letter-write' || card.exercise === 'type-word' || card.exercise === 'cloze-example') {
        return;
      }
      expect(card.options).toContain(card.answer);
      expect(card.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(card.options).size).toBe(card.options.length);
    });
  });

  it('возвращает ошибочную карточку в работу тем же днём', () => {
    const progress = onboarded();
    const word = words[0];
    if (!word) throw new Error('нужно хотя бы одно слово в data/hebrew.json');

    const learned = schedule(schedule(createCard('word', word.id, NOW), 'good', NOW), 'good', NOW);
    progress.cards[`word:${word.id}`] = schedule(learned, 'again', NOW);

    const queue = buildSession(progress, NOW);
    expect(queue.some((card) => card.refId === word.id && !card.isNew)).toBe(true);
  });
});
