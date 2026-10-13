import { exerciseNeedsAudio, hasRecording } from '@/lib/audio';
import {
  getCatalog,
  getDialogue,
  getLexiconWord,
  lessonId,
  loadedWords,
  parseLessonId,
  wordsForTheme,
} from '@/lib/lexicon';
import { pickBilingual, resolveTranslation, shortGloss } from '@/lib/i18n';
import { clozeFromExample, formDistractors, pickGenderItem } from '@/lib/recall';
import { MAX_NEW_WORDS_PER_SESSION } from '@/lib/session';
import { allVerbs, lexiconWordForVerb, pickFormPrompt } from '@/lib/verbs';
import { stripNikud } from '@/lib/hebrew-script';
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
  return { ru: shortGloss(word.ru), en: shortGloss(word.en) };
}

function resolveList(items: BilingualText[], lang: UiLanguage): string[] {
  return items.map((item) => pickBilingual(item, lang));
}

export function getUnit(unitId: string): Unit | undefined {
  const id = unitId.split('~')[0]?.split('+')[0] ?? unitId;
  return getCatalog().units.find((unit) => unit.id === unitId || unit.id === id);
}

export function wordsInLesson(unit: Unit, index: number): Word[] {
  const pool = wordsForTheme(unit.theme, unit.level).filter((word) => word.level === unit.level);
  const start = index * WORDS_PER_LESSON;
  return pool.slice(start, start + WORDS_PER_LESSON);
}

function samePos(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function distractorWords(
  word: Word,
  pool: Word[],
  count: number,
  seed: number,
  used: Set<string>
): Word[] {
  const unique: Word[] = [];
  const ru = new Set([shortGloss(word.ru)]);
  const en = new Set([shortGloss(word.en)]);
  const ranked = [
    ...shuffle(
      pool.filter((item) => item.id !== word.id && item.theme === word.theme && samePos(item.pos, word.pos)),
      seed
    ),
    ...shuffle(
      pool.filter((item) => item.id !== word.id && item.theme === word.theme),
      seed + 1
    ),
    ...shuffle(
      pool.filter((item) => item.id !== word.id && samePos(item.pos, word.pos)),
      seed + 2
    ),
    ...shuffle(
      pool.filter((item) => item.id !== word.id),
      seed + 3
    ),
  ];
  for (const item of ranked) {
    if (used.has(item.id)) continue;
    const ruG = shortGloss(item.ru);
    const enG = shortGloss(item.en);
    if (ru.has(ruG) || en.has(enG)) continue;
    ru.add(ruG);
    en.add(enG);
    used.add(item.id);
    unique.push(item);
    if (unique.length >= count) break;
  }
  return unique;
}

function canAskPicture(word: Word): boolean {
  if (!word.emoji || word.emoji === '⭐') return false;
  const pos = word.pos.trim().toLowerCase();
  return pos === 'noun' || pos === 'существительное';
}

function pictureDistractors(word: Word, pool: Word[], seed: number, used: Set<string>): Word[] {
  const unique = pool.filter(
    (item) =>
      item.id !== word.id &&
      canAskPicture(item) &&
      item.emoji !== word.emoji &&
      !used.has(`pic:${item.emoji}`)
  );
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

function interleave<T>(groups: T[][]): T[] {
  const out: T[] = [];
  let i = 0;
  let more = true;
  while (more) {
    more = false;
    for (const group of groups) {
      const item = group[i];
      if (item !== undefined) {
        out.push(item);
        more = true;
      }
    }
    i += 1;
  }
  return out;
}

export { exerciseNeedsAudio };

/**
 * Короткий урок: 3–5 разных слов, показ, затем упражнения вперемешку.
 * Аудирование только если файл есть. Новых слов не больше пяти.
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
  const usedIds = new Set<string>();
  const teach: SessionCard[] = [];
  const practice: SessionCard[][] = items.map(() => []);

  items.forEach((word, index) => {
    const seed = seedBase + index * 31;
    const isNew = !progress.cards[`word:${word.id}`];
    const gloss = glossOf(word);
    const group = practice[index] ?? [];

    teach.push({
      cardId: `word:${word.id}:teach`,
      kind: 'word',
      refId: word.id,
      exercise: 'teach-word',
      isNew,
      options: [],
      answer: pickBilingual(gloss, lang),
      bilingualAnswer: gloss,
      emoji: word.emoji,
    });

    const optionTexts = shuffle(
      [gloss, ...distractorWords(word, pool, 3, seed, usedIds).map(glossOf)],
      seed + 5
    );
    const choice = withResolved(optionTexts, gloss, lang);
    group.push({
      cardId: `word:${word.id}`,
      kind: 'word',
      refId: word.id,
      exercise: 'word-he-ru',
      isNew,
      ...choice,
    });

    if (canAskPicture(word)) {
      const pics = [word, ...pictureDistractors(word, pool, seed + 9, usedIds)];
      pics.forEach((item) => usedIds.add(`pic:${item.emoji}`));
      const picTexts = shuffle(
        pics.map((item) => ({ ru: shortGloss(item.ru), en: shortGloss(item.en) })),
        seed + 13
      );
      group.push({
        cardId: `word:${word.id}:pic`,
        kind: 'word',
        refId: word.id,
        exercise: 'choice-picture',
        isNew,
        ...withResolved(picTexts, gloss, lang),
        emoji: word.emoji,
      });
    }

    if (exerciseNeedsAudio('listen-choice') && hasRecording(word.audio)) {
      const listenOpts = shuffle(
        [gloss, ...distractorWords(word, pool, 3, seed + 17, usedIds).map(glossOf)],
        seed + 19
      );
      group.push({
        cardId: `word:${word.id}:listen`,
        kind: 'word',
        refId: word.id,
        exercise: 'listen-choice',
        isNew,
        ...withResolved(listenOpts, gloss, lang),
      });
    }

    group.push({
      cardId: `word:${word.id}:type`,
      kind: 'word',
      refId: word.id,
      exercise: 'type-word',
      isNew,
      options: [],
      answer: word.nikud,
      bilingualAnswer: gloss,
    });

    const cloze = clozeFromExample(word);
    if (cloze) {
      group.push({
        cardId: `word:${word.id}:cloze`,
        kind: 'word',
        refId: word.id,
        exercise: 'cloze-example',
        isNew,
        options: [],
        answer: cloze.answer,
        promptHe: cloze.prompt,
        bilingualAnswer: gloss,
      });
    }

    const verb = allVerbs().find((item) => {
      const linked = lexiconWordForVerb(item);
      if (linked?.id === word.id) return true;
      const inf = stripNikud(item.forms.infinitive);
      return stripNikud(word.hebrew) === inf || stripNikud(word.nikud) === inf;
    });
    if (verb) {
      const prompt = pickFormPrompt(verb, seed + 23);
      if (prompt) {
        const distractors = formDistractors(verb, prompt.answer, seed + 29);
        group.push({
          cardId: `word:${word.id}:form`,
          kind: 'word',
          refId: word.id,
          exercise: 'form-verb',
          isNew,
          options: shuffle([prompt.answer, ...distractors], seed + 31),
          answer: prompt.answer,
          verbId: verb.id,
          formTense: prompt.tense,
          formSlot: prompt.slot,
          bilingualAnswer: { ru: verb.ru, en: verb.en },
        });
      }
    }

    const built = chipsFor(word, pool, seed + 11);
    const phraseTokens = built.answer.split(/\s+/).filter(Boolean);
    if (phraseTokens.length >= 2 && built.chips.length >= 2 && word.example?.ru) {
      group.push({
        cardId: `word:${word.id}:build`,
        kind: 'word',
        refId: word.id,
        exercise: 'build-phrase',
        isNew,
        options: [],
        answer: built.answer,
        chips: built.chips,
        promptHe: word.example.nikud,
        bilingualAnswer: { ru: word.example.ru, en: word.example.en },
      });
    }
  });

  const cards = [...teach, ...interleave(practice)];

  const genderSeed = seedBase + 41;
  const genderVerb = allVerbs().find((item) => items.some((word) => lexiconWordForVerb(item)?.id === word.id));
  const gender = pickGenderItem(genderSeed, genderVerb);
  cards.push({
    cardId: `word:${items[0]?.id}:gender`,
    kind: 'word',
    refId: items[0]?.id ?? 'gender',
    exercise: 'gender-agree',
    isNew: false,
    options: gender.options,
    answer: gender.answer,
    bilingualOptions: gender.bilingualOptions,
    bilingualAnswer: { ru: gender.answer, en: gender.answer },
    promptHe: `${gender.promptRu}|||${gender.promptEn}`,
  });

  const dialogue = getDialogue(`${unit.id}-d0`) ?? getDialogue(`${parsed.unitId}-d0`);
  if (dialogue) {
    const correct = dialogue.replies.find((reply) => reply.correct);
    const replies = dialogue.replies.map((reply) => ({ ru: shortGloss(reply.ru), en: shortGloss(reply.en) }));
    const answerText = { ru: shortGloss(correct?.ru ?? ''), en: shortGloss(correct?.en ?? '') };
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

/** Дневная цель в минутах, как выбрано в онбординге. */
export function dailyLessonGoal(minutes: 5 | 10 | 20): number {
  return minutes;
}

export function minutesToday(progress: Progress, day: string): number {
  return progress.sessions
    .filter((session) => session.day === day)
    .reduce((sum, session) => sum + (session.seconds ? Math.max(1, Math.round(session.seconds / 60)) : 5), 0);
}

export function lessonsToday(progress: Progress, day: string): number {
  return progress.sessions.filter((session) => session.day === day).length;
}

export { WORDS_PER_LESSON, getLexiconWord };
