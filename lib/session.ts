import { endOfToday } from '@/lib/dates';
import {
  cardId,
  getLetter,
  getPhrase,
  getWord,
  letters,
  phrases,
  words,
} from '@/lib/data';
import type {
  CardState,
  ExerciseKind,
  Progress,
  SessionCard,
  Word,
} from '@/lib/types';

export const SESSION_SIZE = 15;
export const MAX_NEW_WORDS_PER_SESSION = 5;
export const MAX_NEW_LETTERS_PER_SESSION = 4;
export const MAX_NEW_PHRASES_PER_SESSION = 2;

type Candidate = {
  kind: 'letter' | 'word' | 'phrase';
  refId: string;
  isNew: boolean;
  dueAt: number;
  state: CardState | null;
};

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

function pickDistractors(pool: string[], answer: string, count: number, seed: number): string[] {
  const unique = Array.from(new Set(pool.filter((item) => item !== answer)));
  return shuffle(unique, seed).slice(0, count);
}

/** Letters come before words before phrases, so reading is always built on known glyphs. */
function sortByCurriculum(a: Candidate, b: Candidate): number {
  if (a.dueAt !== b.dueAt) return a.dueAt - b.dueAt;
  const rank = { letter: 0, word: 1, phrase: 2 };
  return rank[a.kind] - rank[b.kind];
}

function exerciseFor(candidate: Candidate, seed: number): ExerciseKind {
  const reps = candidate.state?.reps ?? 0;
  if (candidate.kind === 'letter') {
    return reps >= 2 && seed % 2 === 0 ? 'letter-write' : 'letter-recognise';
  }
  if (candidate.kind === 'word') {
    return reps >= 1 && seed % 3 === 0 ? 'word-ru-he' : 'word-he-ru';
  }
  return 'phrase-translate';
}

function buildOptions(candidate: Candidate, exercise: ExerciseKind, seed: number): {
  options: string[];
  answer: string;
} {
  if (candidate.kind === 'letter') {
    const letter = getLetter(candidate.refId);
    if (!letter) return { options: [], answer: '' };
    const answer = `${letter.nameRu} — ${letter.sound.split(',')[0] ?? letter.sound}`;
    const pool = letters.map((l) => `${l.nameRu} — ${l.sound.split(',')[0] ?? l.sound}`);
    const options = shuffle([answer, ...pickDistractors(pool, answer, 3, seed)], seed + 7);
    return { options, answer };
  }

  if (candidate.kind === 'word') {
    const word = getWord(candidate.refId);
    if (!word) return { options: [], answer: '' };
    if (exercise === 'word-ru-he') {
      const sameDeck = words.filter((w: Word) => w.deck === word.deck && w.id !== word.id);
      const pool = (sameDeck.length >= 3 ? sameDeck : words).map((w) => w.nikud);
      const options = shuffle([word.nikud, ...pickDistractors(pool, word.nikud, 3, seed)], seed + 11);
      return { options, answer: word.nikud };
    }
    const sameDeck = words.filter((w: Word) => w.deck === word.deck && w.id !== word.id);
    const pool = (sameDeck.length >= 3 ? sameDeck : words).map((w) => w.ru);
    const options = shuffle([word.ru, ...pickDistractors(pool, word.ru, 3, seed)], seed + 13);
    return { options, answer: word.ru };
  }

  const phrase = getPhrase(candidate.refId);
  if (!phrase) return { options: [], answer: '' };
  const options = shuffle([phrase.ru, ...phrase.distractors.slice(0, 3)], seed + 17);
  return { options, answer: phrase.ru };
}

export type SessionOptions = {
  /** Allow pulling future reviews forward when nothing is due yet. */
  allowAhead?: boolean;
};

/**
 * Builds the 15-card queue: everything already due, then a capped number of
 * unseen cards. New words are limited to MAX_NEW_WORDS_PER_SESSION regardless
 * of how much room is left in the queue.
 */
export function buildSession(
  progress: Progress,
  now: number = Date.now(),
  options: SessionOptions = {}
): SessionCard[] {
  const dueLimit = endOfToday(now);
  const introduceLetters = progress.settings.level === 'zero';

  const candidates: Candidate[] = [];
  const pushCandidate = (kind: Candidate['kind'], refId: string) => {
    const state = progress.cards[cardId(kind, refId)] ?? null;
    candidates.push({
      kind,
      refId,
      isNew: state === null,
      dueAt: state?.dueAt ?? Number.POSITIVE_INFINITY,
      state,
    });
  };

  letters.forEach((l) => pushCandidate('letter', l.id));
  words.forEach((w) => pushCandidate('word', w.id));
  phrases.forEach((p) => pushCandidate('phrase', p.id));

  const seen = candidates.filter((c) => !c.isNew);
  const due = seen.filter((c) => c.dueAt <= dueLimit).sort(sortByCurriculum);
  const notYetDue = seen.filter((c) => c.dueAt > dueLimit).sort((a, b) => a.dueAt - b.dueAt);

  const learnedLetters = seen.filter((c) => c.kind === 'letter').length;
  const unlockPhrases = learnedLetters >= 10 || progress.settings.level === 'letters';

  const freshLetters = introduceLetters
    ? candidates.filter((c) => c.isNew && c.kind === 'letter').slice(0, MAX_NEW_LETTERS_PER_SESSION)
    : [];
  const freshWords = candidates
    .filter((c) => c.isNew && c.kind === 'word')
    .slice(0, MAX_NEW_WORDS_PER_SESSION);
  const freshPhrases = unlockPhrases
    ? candidates.filter((c) => c.isNew && c.kind === 'phrase').slice(0, MAX_NEW_PHRASES_PER_SESSION)
    : [];

  const queue: Candidate[] = [];
  const takeUnique = (list: Candidate[]) => {
    list.forEach((c) => {
      if (queue.length >= SESSION_SIZE) return;
      if (queue.some((q) => q.kind === c.kind && q.refId === c.refId)) return;
      queue.push(c);
    });
  };

  takeUnique(due);
  takeUnique(freshLetters);
  takeUnique(freshWords);
  takeUnique(freshPhrases);
  if (options.allowAhead) {
    takeUnique(notYetDue);
  }

  const seedBase = Math.floor(now / 1000);
  return queue.map((candidate, index) => {
    const seed = seedBase + index * 31;
    const exercise = exerciseFor(candidate, seed);
    const { options, answer } = buildOptions(candidate, exercise, seed);
    return {
      cardId: cardId(candidate.kind, candidate.refId),
      kind: candidate.kind,
      refId: candidate.refId,
      exercise,
      isNew: candidate.isNew,
      options,
      answer,
    };
  });
}

export type DueSummary = {
  dueCount: number;
  newCount: number;
  queueSize: number;
  aheadAvailable: number;
};

export function summariseToday(progress: Progress, now: number = Date.now()): DueSummary {
  const queue = buildSession(progress, now);
  const withAhead = buildSession(progress, now, { allowAhead: true });
  return {
    dueCount: queue.filter((c) => !c.isNew).length,
    newCount: queue.filter((c) => c.isNew).length,
    queueSize: queue.length,
    aheadAvailable: withAhead.length - queue.length,
  };
}
