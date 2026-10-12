export type LetterExample = {
  he: string;
  translit: string;
  translitRu: string;
  ru: string;
  en: string;
};

export type Letter = {
  id: string;
  order: number;
  char: string;
  finalChar: string | null;
  name: string;
  nameRu: string;
  nameEn: string;
  nameTranslit: string;
  sound: string;
  soundEn: string;
  audio: string | null;
  example: LetterExample;
  finalExample?: LetterExample;
};

export type Vowel = {
  id: string;
  mark: string;
  name: string;
  nameRu: string;
  nameEn: string;
  sound: string;
  soundEn: string;
};

export type LevelId = 'elementary' | 'basic' | 'intermediate' | 'advanced' | 'expert';

/** Как уровень обходится с огласовками: всегда, по переключателю или никогда. */
export type NikudPolicy = 'always' | 'toggle' | 'off';

export type LevelFeature = 'root' | 'synonyms' | 'passages' | 'hebrew-answers';

export type Level = {
  id: LevelId;
  order: number;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  detail: string;
  detailEn: string;
  decks: string[];
  nikud: NikudPolicy;
  transcription: boolean;
  teachesLetters: boolean;
  phraseWords: [number, number];
  features: LevelFeature[];
};

export type Deck = {
  id: string;
  level: LevelId;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  icon: string;
};

export type Word = {
  id: string;
  deck: string;
  level: LevelId;
  hebrew: string;
  nikud: string;
  transcription: string;
  ru: string;
  en: string;
  pos: string;
  audio: string | null;
  root?: string;
  synonyms?: string[];
  literal?: string;
};

export type Phrase = {
  id: string;
  level: LevelId;
  hebrew: string;
  nikud: string;
  transcription: string;
  ru: string;
  en: string;
  audio: string | null;
  distractors: string[];
  distractorsEn: string[];
};

export type PassageQuestion = {
  hebrew: string;
  nikud: string;
  ru: string;
  en: string;
};

export type Passage = {
  id: string;
  level: LevelId;
  title: string;
  titleEn: string;
  hebrew: string;
  nikud: string;
  ru: string;
  en: string;
  audio: string | null;
  question: PassageQuestion;
  answer: string;
  options: string[];
};

export type HebrewData = {
  meta: { note: string; audioFormat: string; audioDir: string; transcription: string };
  levels: Level[];
  letters: Letter[];
  vowels: Vowel[];
  decks: Deck[];
  words: Word[];
  phrases: Phrase[];
  passages: Passage[];
};

export type CardKind = 'letter' | 'word' | 'phrase' | 'passage';

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

export type Goal = 'reading' | 'speaking';
export type ThemePreference = 'system' | 'light' | 'dark';
export type UiLanguage = 'ru' | 'en';
export type LanguagePreference = 'system' | UiLanguage;
export type MinutesPerDay = 5 | 10 | 20;

export type Settings = {
  onboarded: boolean;
  level: LevelId;
  goal: Goal;
  minutesPerDay: MinutesPerDay;
  theme: ThemePreference;
  /** Интерфейс: система, русский или английский. */
  language: LanguagePreference;
  /** Показывать огласовки, когда уровень допускает переключение. */
  showNikud: boolean;
  remindersEnabled: boolean;
  /** Час локального напоминания, 0–23. */
  reminderHour: number;
  reminderAsked: boolean;
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
  | 'phrase-translate'
  | 'passage-question';

export type SessionCard = {
  cardId: string;
  kind: CardKind;
  refId: string;
  exercise: ExerciseKind;
  isNew: boolean;
  options: string[];
  answer: string;
  /** Для «напиши букву»: что именно должен начертить ученик. */
  expectedGlyph?: string;
};
