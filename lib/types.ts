export type LetterExample = {
  he: string;
  translit: string;
  translitRu: string;
  ru: string;
};

export type Letter = {
  id: string;
  order: number;
  char: string;
  finalChar: string | null;
  name: string;
  nameRu: string;
  nameTranslit: string;
  sound: string;
  example: LetterExample;
  finalExample?: LetterExample;
};

export type Vowel = {
  id: string;
  mark: string;
  name: string;
  nameRu: string;
  sound: string;
};

export type DeckId = 'frequent' | 'numbers' | 'family' | 'food' | 'verbs';

export type Deck = {
  id: DeckId;
  title: string;
  subtitle: string;
  plannedSize: number;
  icon: string;
};

export type Word = {
  id: string;
  deck: DeckId;
  nikud: string;
  plain: string;
  translit: string;
  translitRu: string;
  ru: string;
  pos: string;
};

export type Phrase = {
  id: string;
  level: number;
  nikud: string;
  plain: string;
  translit: string;
  ru: string;
  distractors: string[];
};

export type HebrewData = {
  meta: { speechLanguage: string; note: string };
  letters: Letter[];
  vowels: Vowel[];
  decks: Deck[];
  words: Word[];
  phrases: Phrase[];
};

export type CardKind = 'letter' | 'word' | 'phrase';

/** Grades map onto SM-2 quality scores; `again` is the only failing grade. */
export type Grade = 'again' | 'hard' | 'good' | 'easy';

export type CardState = {
  id: string;
  kind: CardKind;
  refId: string;
  reps: number;
  lapses: number;
  ease: number;
  intervalDays: number;
  dueAt: number;
  introducedAt: number;
  lastReviewedAt: number | null;
  correct: number;
  total: number;
};

export type Level = 'zero' | 'letters';
export type Goal = 'reading' | 'speaking';
export type ThemePreference = 'system' | 'light' | 'dark';

export type Settings = {
  onboarded: boolean;
  level: Level;
  goal: Goal;
  minutesPerDay: 5 | 10 | 15;
  theme: ThemePreference;
};

export type SessionLog = {
  day: string;
  reviewed: number;
  correct: number;
  finishedAt: number;
};

export type Streak = {
  current: number;
  longest: number;
  lastDay: string | null;
};

export type Progress = {
  version: number;
  settings: Settings;
  cards: Record<string, CardState>;
  sessions: SessionLog[];
  streak: Streak;
};

export type ExerciseKind =
  | 'letter-recognise'
  | 'letter-write'
  | 'word-he-ru'
  | 'word-ru-he'
  | 'phrase-translate';

export type SessionCard = {
  cardId: string;
  kind: CardKind;
  refId: string;
  exercise: ExerciseKind;
  isNew: boolean;
  /** Russian answer options for multiple-choice exercises. */
  options: string[];
  answer: string;
};
