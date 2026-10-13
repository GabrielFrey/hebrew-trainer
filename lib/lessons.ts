import {
  getCatalog,
  getDialogue,
  getLexiconWord,
  lessonId,
  loadedWords,
  parseLessonId,
  wordsForTheme,
} from '@/lib/lexicon';
import { pickBilingual, resolveTranslation } from '@/lib/i18n';
import { MAX_NEW_WORDS_PER_SESSION } from '@/lib/session';
import type {
  BilingualText,
  ExerciseKind,
  LevelId,
  Progress,
  SessionCard,
  UiLanguage,
  Unit,
  Word,
} from '@/lib/types';

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

function seedFromKey(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 1;
}

function glossOf(word: Word): BilingualText {
  return { ru: word.ru, en: word.en };
}

function resolveList(items: BilingualText[], lang: UiLanguage): string[] {
  return items.map((item) => pickBilingual(item, lang));
}

export function getUnit(unitId: string): Unit | undefined {
  return getCatalog().units.find((unit) => unit.id === unitId);
}

export function wordsInLesson(unit: Unit, index: number): Word[] {
  const pool = wordsForTheme(unit.theme, unit.level).filter((word) => word.level === unit.level);
  const start = index * WORDS_PER_LESSON;
  return pool.slice(start, start + WORDS_PER_LESSON);
}

function distractorWords(word: Word, pool: Word[], count: number, seed: number): Word[] {
  const unique: Word[] = [];
  const ru = new Set([word.ru]);
  const en = new Set([word.en]);
  for (const item of shuffle(
    pool.filter((entry) => entry.id !== word.id),
    seed
  )) {
    if (ru.has(item.ru) || en.has(item.en)) continue;
    ru.add(item.ru);
    en.add(item.en);
    unique.push(item);
    if (unique.length >= count) break;
  }
  return unique;
}

function pictureDistractors(word: Word, pool: Word[], seed: number): Word[] {
  const unique = pool.filter((item) => item.id !== word.id && item.emoji && item.emoji !== word.emoji);
  return shuffle(unique, seed).slice(0, 3);
}

function chipsFor(word: Word, pool: Word[], seed: number): { chips: string[]; answer: string } {
  const tokens = (word.example?.nikud ?? '').split(/\s+/).filter(Boolean);
  const extra = shuffle(
    pool.filter((item) => item.id !== word.id).map((item) => item.nikud),
    seed
  ).slice(0, 2);
  return {
    answer: tokens.join(' '),
    chips: shuffle([...tokens, ...extra], seed + 3),
  };
}

function withResolved(
  bilingualOptions: BilingualText[],
  bilingualAnswer: BilingualText,
  lang: UiLanguage
): { options: string[]; answer: string; bilingualOptions: BilingualText[]; bilingualAnswer: BilingualText } {
  return {
    options: resolveList(bilingualOptions, lang),
    answer: pickBilingual(bilingualAnswer, lang),
    bilingualOptions,
    bilingualAnswer,
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
  const lang = resolveTranslation(progress.settings);
  const items = wordsInLesson(unit, parsed.index);
  if (items.length === 0) return [];
  const pool = loadedWords().filter((word) => word.level === unit.level);
  const seedBase = seedFromKey(lessonKey) + parsed.index * 17 + Math.floor(now / 86_400_000);
  const cards: SessionCard[] = [];

  items.forEach((word, index) => {
    const seed = seedBase + index * 31;
    const isNew = !progress.cards[`word:${word.id}`];
    const gloss = glossOf(word);
    const optionTexts = shuffle([gloss, ...distractorWords(word, pool, 3, seed).map(glossOf)], seed + 5);
    const pics = [word, ...pictureDistractors(word, pool, seed + 9)];
    const picTexts = shuffle(
      pics.map((item) => ({ ru: `${item.emoji}|${item.ru}`, en: `${item.emoji}|${item.en}` })),
      seed + 13
    );
    const built = chipsFor(word, pool, seed + 11);
    const choice = withResolved(optionTexts, gloss, lang);
    const phraseTokens = built.answer.split(/\s+/).filter(Boolean);

    cards.push({
      cardId: `word:${word.id}:teach`,
      kind: 'word',
      refId: word.id,
      exercise: 'teach-word',
      isNew,
      options: [],
      answer: choice.answer,
      bilingualAnswer: gloss,
      emoji: word.emoji,
    });
    cards.push({
      cardId: `word:${word.id}`,
      kind: 'word',
      refId: word.id,
      exercise: 'word-he-ru',
      isNew,
      ...choice,
    });
    if (word.emoji) {
      cards.push({
        cardId: `word:${word.id}:pic`,
        kind: 'word',
        refId: word.id,
        exercise: 'choice-picture',
        isNew,
        ...withResolved(picTexts, { ru: `${word.emoji}|${word.ru}`, en: `${word.emoji}|${word.en}` }, lang),
        emoji: word.emoji,
      });
    }
    cards.push({
      cardId: `word:${word.id}:listen`,
      kind: 'word',
      refId: word.id,
      exercise: 'listen-choice',
      isNew,
      ...choice,
    });
    if (phraseTokens.length >= 2 && built.chips.length >= 2) {
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
    const replies = dialogue.replies.map((reply) => ({ ru: reply.ru, en: reply.en }));
    const answerText = { ru: correct?.ru ?? '', en: correct?.en ?? '' };
    cards.push({
      cardId: `word:${items[0]?.id}:dlg`,
      kind: 'word',
      refId: items[0]?.id ?? dialogue.id,
      exercise: 'dialogue-reply',
      isNew: false,
      ...withResolved(replies, answerText, lang),
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
