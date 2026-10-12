import {
  getCatalog,
  getDialogue,
  getLexiconWord,
  lessonId,
  loadedWords,
  parseLessonId,
  wordsForTheme,
} from '@/lib/lexicon';
import { resolveLanguage, wordGloss } from '@/lib/i18n';
import { MAX_NEW_WORDS_PER_SESSION } from '@/lib/session';
import type { ExerciseKind, LevelId, Progress, SessionCard, Unit, Word } from '@/lib/types';

const WORDS_PER_LESSON = MAX_NEW_WORDS_PER_SESSION;

function shuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

export function getUnit(unitId: string): Unit | undefined {
  return getCatalog().units.find((unit) => unit.id === unitId);
}

export function wordsInLesson(unit: Unit, index: number): Word[] {
  const pool = wordsForTheme(unit.theme, unit.level).filter((word) => word.level === unit.level);
  const start = index * WORDS_PER_LESSON;
  return pool.slice(start, start + WORDS_PER_LESSON);
}

function distractors(word: Word, pool: Word[], count: number, seed: number, lang: 'ru' | 'en'): string[] {
  const answer = wordGloss(word, lang);
  const unique = Array.from(
    new Set(pool.filter((item) => item.id !== word.id).map((item) => wordGloss(item, lang)))
  ).filter((item) => item !== answer);
  return shuffle(unique, seed).slice(0, count);
}

function pictureDistractors(word: Word, pool: Word[], seed: number): Word[] {
  const unique = pool.filter((item) => item.id !== word.id && item.emoji && item.emoji !== word.emoji);
  return shuffle(unique, seed).slice(0, 3);
}

function chipsFor(word: Word, pool: Word[], seed: number): { chips: string[]; answer: string } {
  const tokens = word.example.nikud.split(/\s+/).filter(Boolean);
  const extra = shuffle(
    pool.filter((item) => item.id !== word.id).map((item) => item.nikud),
    seed
  ).slice(0, 2);
  return {
    answer: tokens.join(' '),
    chips: shuffle([...tokens, ...extra], seed + 3),
  };
}

/**
 * Короткий урок в стиле Mondly: показ слова, выбор перевода, картинка,
 * аудирование, сборка фразы, иногда диалог. Новых слов не больше пяти.
 */
export function buildLesson(progress: Progress, lessonKey: string, now = Date.now()): SessionCard[] {
  const parsed = parseLessonId(lessonKey);
  if (!parsed) return [];
  const unit = getUnit(parsed.unitId);
  if (!unit) return [];
  const lang = resolveLanguage(progress.settings.language);
  const items = wordsInLesson(unit, parsed.index);
  if (items.length === 0) return [];
  const pool = loadedWords().filter((word) => word.level === unit.level);
  const seedBase = Math.floor(now / 1000) + parsed.index * 17;
  const cards: SessionCard[] = [];

  items.forEach((word, index) => {
    const seed = seedBase + index * 31;
    const isNew = !progress.cards[`word:${word.id}`];
    const gloss = wordGloss(word, lang);
    const options = shuffle([gloss, ...distractors(word, pool, 3, seed, lang)], seed + 5);
    const pics = [word, ...pictureDistractors(word, pool, seed + 9)];
    const built = chipsFor(word, pool, seed + 11);

    cards.push({
      cardId: `word:${word.id}:teach`,
      kind: 'word',
      refId: word.id,
      exercise: 'teach-word',
      isNew,
      options: [],
      answer: gloss,
      emoji: word.emoji,
    });
    cards.push({
      cardId: `word:${word.id}`,
      kind: 'word',
      refId: word.id,
      exercise: 'word-he-ru',
      isNew,
      options,
      answer: gloss,
    });
    if (word.emoji) {
      cards.push({
        cardId: `word:${word.id}:pic`,
        kind: 'word',
        refId: word.id,
        exercise: 'choice-picture',
        isNew,
        options: shuffle(
          pics.map((item) => `${item.emoji}|${wordGloss(item, lang)}`),
          seed + 13
        ),
        answer: `${word.emoji}|${gloss}`,
        emoji: word.emoji,
      });
    }
    cards.push({
      cardId: `word:${word.id}:listen`,
      kind: 'word',
      refId: word.id,
      exercise: 'listen-choice',
      isNew,
      options,
      answer: gloss,
    });
    if (built.chips.length >= 2) {
      cards.push({
        cardId: `word:${word.id}:build`,
        kind: 'word',
        refId: word.id,
        exercise: 'build-phrase',
        isNew,
        options: [],
        answer: built.answer,
        chips: built.chips,
        promptHe: word.example.nikud,
      });
    }
  });

  const dialogue = getDialogue(`${unit.id}-d0`);
  if (dialogue) {
    const correct = dialogue.replies.find((reply) => reply.correct);
    cards.push({
      cardId: `word:${items[0]?.id}:dlg`,
      kind: 'word',
      refId: items[0]?.id ?? dialogue.id,
      exercise: 'dialogue-reply',
      isNew: false,
      options: dialogue.replies.map((reply) => (lang === 'en' ? reply.en : reply.ru)),
      answer: (lang === 'en' ? correct?.en : correct?.ru) ?? '',
      dialogueId: dialogue.id,
    });
  }

  return cards;
}

export function nextLessonId(progress: Progress, level: LevelId): string | null {
  const units = getCatalog().units.filter((unit) => {
    const order = ['elementary', 'basic', 'intermediate', 'advanced', 'expert'] as LevelId[];
    return order.indexOf(unit.level) <= order.indexOf(level);
  });
  const done = new Set(progress.completedLessons);
  for (const unit of units) {
    for (let index = 0; index < unit.lessonCount; index += 1) {
      const id = lessonId(unit.id, index);
      if (!done.has(id)) return id;
    }
  }
  return null;
}

export function lessonProgress(progress: Progress, unit: Unit): number {
  let done = 0;
  for (let index = 0; index < unit.lessonCount; index += 1) {
    if (progress.completedLessons.includes(lessonId(unit.id, index))) done += 1;
  }
  return done;
}

export function isLessonUnlocked(progress: Progress, unit: Unit, index: number): boolean {
  if (index === 0) {
    const units = getCatalog().units.filter((item) => item.level === unit.level);
    const first = units[0];
    if (first && first.id === unit.id) return true;
    const prev = units.find((item) => item.order === unit.order - 1);
    if (!prev) return true;
    return lessonProgress(progress, prev) >= prev.lessonCount;
  }
  return progress.completedLessons.includes(lessonId(unit.id, index - 1));
}

export function dailyLessonGoal(minutes: 5 | 10 | 20): number {
  if (minutes === 5) return 1;
  if (minutes === 10) return 2;
  return 3;
}

export function lessonsToday(progress: Progress, day: string): number {
  return progress.sessions.filter((session) => session.day === day).length;
}

export function exerciseNeedsAudio(kind: ExerciseKind): boolean {
  return kind === 'listen-choice';
}

export { WORDS_PER_LESSON, getLexiconWord };
