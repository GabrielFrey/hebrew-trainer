import { decks, getLevel, levels, passages, phrases } from '@/lib/data';
import { loadedSlang, loadedWords } from '@/lib/lexicon';
import type {
  Deck,
  Level,
  LevelFeature,
  LevelId,
  Passage,
  Phrase,
  Settings,
  Word,
} from '@/lib/types';

/**
 * Новый материал берётся с текущего уровня и всех, что ниже. Повышение
 * уровня ничего не сбрасывает: выученные карточки остаются в планировщике,
 * просто открываются новые колоды.
 */
export function levelsUpTo(id: LevelId): Level[] {
  const current = getLevel(id);
  return levels.filter((level) => level.order <= current.order);
}

export function deckIdsForLevel(id: LevelId): string[] {
  return levelsUpTo(id).flatMap((level) => level.decks);
}

export function decksForLevel(id: LevelId): Deck[] {
  const allowed = new Set(deckIdsForLevel(id));
  return decks.filter((deck) => allowed.has(deck.id));
}

export function wordsForLevel(id: LevelId): Word[] {
  const allowed = new Set(levelsUpTo(id).map((level) => level.id));
  return loadedWords().filter((word) => allowed.has(word.level));
}

export function slangForLevel(id: LevelId): ReturnType<typeof loadedSlang> {
  const allowed = new Set(levelsUpTo(id).map((level) => level.id));
  return loadedSlang().filter((item) => allowed.has(item.level));
}

export function phrasesForLevel(id: LevelId): Phrase[] {
  const allowed = new Set(levelsUpTo(id).map((level) => level.id));
  return phrases.filter((phrase) => allowed.has(phrase.level));
}

export function passagesForLevel(id: LevelId): Passage[] {
  if (!hasFeature(id, 'passages')) return [];
  const allowed = new Set(levelsUpTo(id).map((level) => level.id));
  return passages.filter((passage) => allowed.has(passage.level));
}

export function hasFeature(id: LevelId, feature: LevelFeature): boolean {
  return getLevel(id).features.includes(feature);
}

/** Показывать ли огласовки: уровень задаёт политику, переключатель — выбор. */
export function showNikud(settings: Settings): boolean {
  const policy = getLevel(settings.level).nikud;
  if (policy === 'always') return true;
  if (policy === 'off') return settings.showNikud;
  return settings.showNikud;
}

export function canToggleNikud(id: LevelId): boolean {
  return getLevel(id).nikud !== 'always';
}

export function showTranscription(id: LevelId): boolean {
  return getLevel(id).transcription;
}

export function teachesLetters(id: LevelId): boolean {
  return getLevel(id).teachesLetters;
}

/** Текст на иврите для показа с учётом политики огласовок уровня. */
export function hebrewFor(
  item: { hebrew: string; nikud: string },
  settings: Settings
): string {
  return showNikud(settings) ? item.nikud : item.hebrew;
}

export function defaultShowNikud(id: LevelId): boolean {
  const policy = getLevel(id).nikud;
  if (policy === 'always') return true;
  // На среднем уровне огласовки включены по умолчанию, на продвинутом — нет.
  return policy === 'toggle';
}
