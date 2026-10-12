import raw from '@/data/hebrew.json';
import { getCatalog, getLexiconWord, loadedWords } from '@/lib/lexicon';
import type {
  Deck,
  HebrewData,
  Letter,
  Level,
  LevelId,
  Passage,
  Phrase,
  Vowel,
  Word,
} from '@/lib/types';

const data = raw as unknown as HebrewData;

export const letters: Letter[] = [...data.letters].sort((a, b) => a.order - b.order);
export const vowels: Vowel[] = data.vowels;
export const levels: Level[] = [...data.levels].sort((a, b) => a.order - b.order);
export const phrases: Phrase[] = data.phrases;
export const passages: Passage[] = data.passages;

/** Колоды = темы Mondly (сленг живёт отдельным разделом, не в колодах слов). */
export const decks: Deck[] = getCatalog()
  .themes.filter((theme) => theme.id !== 'slang')
  .map((theme) => ({
    id: theme.id,
    level: getCatalog().units.find((unit) => unit.theme === theme.id)?.level ?? 'elementary',
    title: theme.title,
    titleEn: theme.titleEn,
    subtitle: theme.title,
    subtitleEn: theme.titleEn,
    icon: 'book',
  }));

/** Все подгруженные слова; в тестах jest.setup тянет каждый уровень. */
export function allWords(): Word[] {
  return loadedWords();
}

/** Массив-прокси: длина и методы читают ленивый лексикон, а не пустой снимок. */
export const words: Word[] = new Proxy([] as Word[], {
  get(_target, prop) {
    const list = loadedWords();
    const value = Reflect.get(list, prop, list);
    return typeof value === 'function' ? (value as (...args: never[]) => unknown).bind(list) : value;
  },
  ownKeys() {
    return Reflect.ownKeys(loadedWords());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(loadedWords(), prop);
  },
});

export const lettersWithFinalForm: Letter[] = letters.filter((l) => l.finalChar !== null);

const letterById = new Map(letters.map((l) => [l.id, l]));
const phraseById = new Map(phrases.map((p) => [p.id, p]));
const passageById = new Map(passages.map((p) => [p.id, p]));
const deckById = new Map(decks.map((d) => [d.id, d]));
const levelById = new Map(levels.map((l) => [l.id, l]));

export function getLetter(id: string): Letter | undefined {
  return letterById.get(id);
}

export function getWord(id: string): Word | undefined {
  return getLexiconWord(id);
}

export function getPhrase(id: string): Phrase | undefined {
  return phraseById.get(id);
}

export function getPassage(id: string): Passage | undefined {
  return passageById.get(id);
}

export function getDeck(id: string): Deck | undefined {
  return deckById.get(id);
}

export function getLevel(id: LevelId): Level {
  const level = levelById.get(id);
  if (!level) throw new Error(`Неизвестный уровень: ${id}`);
  return level;
}

export function wordsInDeck(id: string): Word[] {
  return loadedWords().filter((w) => w.deck === id);
}

export function cardId(
  kind: 'letter' | 'word' | 'phrase' | 'passage' | 'slang',
  refId: string
): string {
  return `${kind}:${refId}`;
}

/** Hebrew letters only, so a word can be rendered without its vowel marks. */
export function stripNikud(text: string): string {
  return text.replace(/[\u0591-\u05C7]/g, '');
}

export function countHebrewWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
