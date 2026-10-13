import { exerciseNeedsAudio, hasRecording } from '@/lib/audio';
import { endOfToday } from '@/lib/dates';
import { cardId, getLetter, getPassage, getPhrase, getWord, letters } from '@/lib/data';
import { glyphsForLetter } from '@/lib/handwriting';
import { stripNikud } from '@/lib/hebrew-script';
import {
  letterName,
  letterSound,
  pickBilingual,
  resolveTranslation,
  shortGloss,
} from '@/lib/i18n';
import {
  hasFeature,
  passagesForLevel,
  phrasesForLevel,
  teachesLetters,
  wordsForLevel,
} from '@/lib/levels';
import { clozeFromExample, formDistractors, pickGenderItem } from '@/lib/recall';
import { allVerbs, lexiconWordForVerb, pickFormPrompt } from '@/lib/verbs';
import type {
  BilingualText,
  CardState,
  ExerciseKind,
  Progress,
  SessionCard,
  UiLanguage,
  Word,
} from '@/lib/types';

function verbForWord(word: Word | undefined) {
  if (!word) return undefined;
  return allVerbs().find((item) => {
    const linked = lexiconWordForVerb(item);
    if (linked?.id === word.id) return true;
    const inf = stripNikud(item.forms.infinitive);
    return stripNikud(word.hebrew) === inf || stripNikud(word.nikud) === inf;
  });
}

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
    const word = getWord(candidate.refId);
    if (reps < 1) {
      return exerciseNeedsAudio('listen-choice') && hasRecording(word?.audio) && seed % 5 === 0
        ? 'listen-choice'
        : 'word-he-ru';
    }
    const kinds: ExerciseKind[] = ['word-he-ru', 'word-ru-he', 'type-word'];
    if (exerciseNeedsAudio('listen-choice') && hasRecording(word?.audio)) kinds.push('listen-choice');
    if (word && clozeFromExample(word)) kinds.push('cloze-example');
    if (verbForWord(word)) kinds.push('form-verb');
    kinds.push('gender-agree');
    return kinds[seed % kinds.length] ?? 'word-he-ru';
  }
  if (candidate.kind === 'passage') return 'passage-question';
  return 'phrase-translate';
}

type BuiltCard = {
  options: string[];
  answer: string;
  expectedGlyph?: string;
  bilingualOptions?: BilingualText[];
  bilingualAnswer?: BilingualText;
};

function resolveBuilt(
  bilingualOptions: BilingualText[],
  bilingualAnswer: BilingualText,
  lang: UiLanguage,
  extra: Partial<BuiltCard> = {}
): BuiltCard {
  return {
    options: bilingualOptions.map((item) => pickBilingual(item, lang)),
    answer: pickBilingual(bilingualAnswer, lang),
    bilingualOptions,
    bilingualAnswer,
    ...extra,
  };
}

function uniqueWords(word: Word, pool: Word[], count: number, seed: number): Word[] {
  const unique: Word[] = [];
  const ru = new Set([word.ru]);
  const en = new Set([word.en]);
  const ranked = [
    ...shuffle(
      pool.filter((entry) => entry.id !== word.id && entry.theme === word.theme && entry.pos === word.pos),
      seed
    ),
    ...shuffle(
      pool.filter((entry) => entry.id !== word.id && entry.theme === word.theme),
      seed + 1
    ),
    ...shuffle(
      pool.filter((entry) => entry.id !== word.id && entry.pos === word.pos),
      seed + 2
    ),
    ...shuffle(
      pool.filter((entry) => entry.id !== word.id),
      seed + 3
    ),
  ];
  for (const item of ranked) {
    if (ru.has(item.ru) || en.has(item.en)) continue;
    ru.add(item.ru);
    en.add(item.en);
    unique.push(item);
    if (unique.length >= count) break;
  }
  return unique;
}

function buildCard(
  candidate: Candidate,
  exercise: ExerciseKind,
  progress: Progress,
  seed: number
): BuiltCard {
  const lang = resolveTranslation(progress.settings);

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
      const bilingualAnswer = { ru: letterName(letter, 'ru'), en: letterName(letter, 'en') };
      return {
        options: [],
        answer: pickBilingual(bilingualAnswer, lang),
        bilingualAnswer,
        expectedGlyph: target?.id,
      };
    }

    const labelOf = (item: NonNullable<typeof letter>, ui: UiLanguage) =>
      `${letterName(item, ui)} — ${letterSound(item, ui).split(',')[0] ?? letterSound(item, ui)}`;
    const others = letters.filter((item) => item.id !== letter.id);
    const picked = [letter, ...shuffle(others, seed).slice(0, 3)];
    const bilingualOptions = shuffle(
      picked.map((item) => ({ ru: labelOf(item, 'ru'), en: labelOf(item, 'en') })),
      seed + 7
    );
    return resolveBuilt(bilingualOptions, { ru: labelOf(letter, 'ru'), en: labelOf(letter, 'en') }, lang);
  }

  if (candidate.kind === 'word') {
    const word = getWord(candidate.refId);
    if (!word) return { options: [], answer: '' };
    const available = wordsForLevel(progress.settings.level);
    const sameDeck = available.filter((item: Word) => item.deck === word.deck && item.id !== word.id);
    const pool = sameDeck.length >= 3 ? sameDeck : available;

    if (exercise === 'word-ru-he') {
      const answer = word.nikud;
      const options = shuffle(
        [answer, ...pickDistractors(pool.map((item) => item.nikud), answer, 3, seed)],
        seed + 11
      );
      return { options, answer };
    }
    if (exercise === 'type-word') {
      return { options: [], answer: word.nikud, bilingualAnswer: { ru: word.ru, en: word.en } };
    }
    if (exercise === 'cloze-example') {
      const cloze = clozeFromExample(word);
      return {
        options: [],
        answer: cloze?.answer ?? word.nikud,
        bilingualAnswer: { ru: word.ru, en: word.en },
      };
    }
    if (exercise === 'form-verb') {
      const verb = verbForWord(word);
      const prompt = verb ? pickFormPrompt(verb, seed) : null;
      if (verb && prompt) {
        const options = shuffle([prompt.answer, ...formDistractors(verb, prompt.answer, seed + 3)], seed + 5);
        return { options, answer: prompt.answer, bilingualAnswer: { ru: verb.ru, en: verb.en } };
      }
      return { options: [], answer: word.nikud };
    }
    if (exercise === 'gender-agree') {
      const gender = pickGenderItem(seed, verbForWord(word));
      return {
        options: gender.options,
        answer: gender.answer,
        bilingualAnswer: { ru: gender.answer, en: gender.answer },
      };
    }
    if (exercise === 'listen-choice') {
      const choices = shuffle([word, ...uniqueWords(word, pool, 3, seed)], seed + 13);
      const bilingualOptions = choices.map((item) => ({ ru: shortGloss(item.ru), en: shortGloss(item.en) }));
      return resolveBuilt(bilingualOptions, { ru: shortGloss(word.ru), en: shortGloss(word.en) }, lang);
    }
    const choices = shuffle([word, ...uniqueWords(word, pool, 3, seed)], seed + 13);
    const bilingualOptions = choices.map((item) => ({ ru: shortGloss(item.ru), en: shortGloss(item.en) }));
    return resolveBuilt(bilingualOptions, { ru: shortGloss(word.ru), en: shortGloss(word.en) }, lang);
  }

  if (candidate.kind === 'passage') {
    const passage = getPassage(candidate.refId);
    if (!passage) return { options: [], answer: '' };
    return { options: shuffle(passage.options, seed + 19), answer: passage.answer };
  }

  const phrase = getPhrase(candidate.refId);
  if (!phrase) return { options: [], answer: '' };
  const bilingualAnswer = { ru: phrase.ru, en: phrase.en };
  const bilingualOptions = shuffle(
    [
      bilingualAnswer,
      ...phrase.distractors.slice(0, 3).map((ru, index) => ({
        ru,
        en: phrase.distractorsEn[index] ?? ru,
      })),
    ],
    seed + 17
  );
  return resolveBuilt(bilingualOptions, bilingualAnswer, lang);
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
    if (card.kind === 'slang') return;
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
      ...(built.bilingualOptions ? { bilingualOptions: built.bilingualOptions } : {}),
      ...(built.bilingualAnswer ? { bilingualAnswer: built.bilingualAnswer } : {}),
      ...(built.expectedGlyph ? { expectedGlyph: built.expectedGlyph } : {}),
    };
  }).map((card, index) => {
    if (card.exercise !== 'cloze-example' && card.exercise !== 'form-verb' && card.exercise !== 'gender-agree') {
      return card;
    }
    const word = getWord(card.refId);
    const seed = seedBase + index * 31;
    if (card.exercise === 'cloze-example' && word) {
      const cloze = clozeFromExample(word);
      return { ...card, promptHe: cloze?.prompt };
    }
    if (card.exercise === 'form-verb' && word) {
      const verb = verbForWord(word);
      const prompt = verb ? pickFormPrompt(verb, seed) : null;
      return {
        ...card,
        verbId: verb?.id,
        formTense: prompt?.tense,
        formSlot: prompt?.slot,
      };
    }
    if (card.exercise === 'gender-agree' && word) {
      const gender = pickGenderItem(seed, verbForWord(word));
      return { ...card, promptHe: `${gender.promptRu}|||${gender.promptEn}` };
    }
    return card;
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
