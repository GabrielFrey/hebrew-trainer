import { endOfToday } from '@/lib/dates';
import { cardId, getLetter, getPassage, getPhrase, getWord, letters } from '@/lib/data';
import { glyphsForLetter } from '@/lib/handwriting';
import {
  letterName,
  letterSound,
  phraseDistractors,
  phraseGloss,
  resolveLanguage,
  wordGloss,
} from '@/lib/i18n';
import {
  hasFeature,
  passagesForLevel,
  phrasesForLevel,
  teachesLetters,
  wordsForLevel,
} from '@/lib/levels';
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
export const MAX_NEW_PASSAGES_PER_SESSION = 1;

type CandidateKind = 'letter' | 'word' | 'phrase' | 'passage';

type Candidate = {
  kind: CandidateKind;
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
  const rank = { letter: 0, word: 1, phrase: 2, passage: 3 };
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
  if (candidate.kind === 'passage') return 'passage-question';
  return 'phrase-translate';
}

type BuiltCard = { options: string[]; answer: string; expectedGlyph?: string };

function buildCard(
  candidate: Candidate,
  exercise: ExerciseKind,
  progress: Progress,
  seed: number
): BuiltCard {
  const lang = resolveLanguage(progress.settings.language);

  if (candidate.kind === 'letter') {
    const letter = getLetter(candidate.refId);
    if (!letter) return { options: [], answer: '' };

    if (exercise === 'letter-write') {
      // Конечную форму спрашиваем у тех, кто букву уже видел несколько раз.
      const forms = glyphsForLetter(letter.id);
      const reps = candidate.state?.reps ?? 0;
      const final = forms.find((form) => form.form === 'final');
      const base = forms.find((form) => form.form === 'base');
      const target = final && reps >= 4 && seed % 2 === 0 ? final : base;
      return { options: [], answer: letterName(letter, lang), expectedGlyph: target?.id };
    }

    const label = (item: typeof letter) =>
      `${letterName(item, lang)} — ${letterSound(item, lang).split(',')[0] ?? letterSound(item, lang)}`;
    const answer = label(letter);
    const pool = letters.map((l) => label(l));
    return { options: shuffle([answer, ...pickDistractors(pool, answer, 3, seed)], seed + 7), answer };
  }

  if (candidate.kind === 'word') {
    const word = getWord(candidate.refId);
    if (!word) return { options: [], answer: '' };
    const available = wordsForLevel(progress.settings.level);
    const sameDeck = available.filter((w: Word) => w.deck === word.deck && w.id !== word.id);
    const pool = sameDeck.length >= 3 ? sameDeck : available;

    if (exercise === 'word-ru-he') {
      const answer = word.nikud;
      const options = shuffle(
        [answer, ...pickDistractors(pool.map((w) => w.nikud), answer, 3, seed)],
        seed + 11
      );
      return { options, answer };
    }
    const answer = wordGloss(word, lang);
    const options = shuffle(
      [answer, ...pickDistractors(pool.map((w) => wordGloss(w, lang)), answer, 3, seed)],
      seed + 13
    );
    return { options, answer };
  }

  if (candidate.kind === 'passage') {
    const passage = getPassage(candidate.refId);
    if (!passage) return { options: [], answer: '' };
    return { options: shuffle(passage.options, seed + 19), answer: passage.answer };
  }

  const phrase = getPhrase(candidate.refId);
  if (!phrase) return { options: [], answer: '' };
  const gloss = phraseGloss(phrase, lang);
  return {
    options: shuffle([gloss, ...phraseDistractors(phrase, lang).slice(0, 3)], seed + 17),
    answer: gloss,
  };
}

export type SessionOptions = {
  /** Allow pulling future reviews forward when nothing is due yet. */
  allowAhead?: boolean;
};

/**
 * Builds the 15-card queue: everything already due, then a capped number of
 * unseen cards. New words are limited to MAX_NEW_WORDS_PER_SESSION regardless
 * of how much room is left in the queue.
 *
 * Новый материал берётся только из колод текущего уровня и ниже, а уже
 * начатые карточки продолжают приходить на повторение, даже если уровень
 * сменился и их колода больше не выдаёт новое.
 */
export function buildSession(
  progress: Progress,
  now: number = Date.now(),
  options: SessionOptions = {}
): SessionCard[] {
  const dueLimit = endOfToday(now);
  const level = progress.settings.level;

  const levelWords = wordsForLevel(level);
  const levelPhrases = phrasesForLevel(level);
  const levelPassages = passagesForLevel(level);

  const candidates: Candidate[] = [];
  const pushCandidate = (kind: CandidateKind, refId: string) => {
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
  levelWords.forEach((w) => pushCandidate('word', w.id));
  levelPhrases.forEach((p) => pushCandidate('phrase', p.id));
  levelPassages.forEach((p) => pushCandidate('passage', p.id));

  // Карточки других уровней, которые уже в работе, тоже должны возвращаться.
  const known = new Set(candidates.map((c) => cardId(c.kind, c.refId)));
  Object.values(progress.cards).forEach((card) => {
    if (known.has(card.id)) return;
    candidates.push({
      kind: card.kind,
      refId: card.refId,
      isNew: false,
      dueAt: card.dueAt,
      state: card,
    });
  });

  const seen = candidates.filter((c) => !c.isNew);
  const due = seen.filter((c) => c.dueAt <= dueLimit).sort(sortByCurriculum);
  const notYetDue = seen.filter((c) => c.dueAt > dueLimit).sort((a, b) => a.dueAt - b.dueAt);

  const learnedLetters = seen.filter((c) => c.kind === 'letter').length;
  const unlockPhrases = learnedLetters >= 10 || !teachesLetters(level);

  const freshLetters = teachesLetters(level)
    ? candidates.filter((c) => c.isNew && c.kind === 'letter').slice(0, MAX_NEW_LETTERS_PER_SESSION)
    : [];
  const freshWords = candidates
    .filter((c) => c.isNew && c.kind === 'word')
    .slice(0, MAX_NEW_WORDS_PER_SESSION);
  const freshPhrases = unlockPhrases
    ? candidates.filter((c) => c.isNew && c.kind === 'phrase').slice(0, MAX_NEW_PHRASES_PER_SESSION)
    : [];
  const freshPassages = hasFeature(level, 'passages')
    ? candidates
        .filter((c) => c.isNew && c.kind === 'passage')
        .slice(0, MAX_NEW_PASSAGES_PER_SESSION)
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
  takeUnique(freshPassages);
  if (options.allowAhead) {
    takeUnique(notYetDue);
  }

  const seedBase = Math.floor(now / 1000);
  return queue.map((candidate, index) => {
    const seed = seedBase + index * 31;
    const exercise = exerciseFor(candidate, seed);
    const built = buildCard(candidate, exercise, progress, seed);
    return {
      cardId: cardId(candidate.kind, candidate.refId),
      kind: candidate.kind,
      refId: candidate.refId,
      exercise,
      isNew: candidate.isNew,
      options: built.options,
      answer: built.answer,
      ...(built.expectedGlyph ? { expectedGlyph: built.expectedGlyph } : {}),
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
