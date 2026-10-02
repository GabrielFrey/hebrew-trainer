import raw from '@/data/hebrew.json';
import type {
  Deck,
  DeckId,
  HebrewData,
  Letter,
  Phrase,
  Vowel,
  Word,
} from '@/lib/types';

const data = raw as HebrewData;

export const SPEECH_LANGUAGE = data.meta.speechLanguage;

export const letters: Letter[] = [...data.letters].sort((a, b) => a.order - b.order);
export const vowels: Vowel[] = data.vowels;
export const decks: Deck[] = data.decks;
export const words: Word[] = data.words;
export const phrases: Phrase[] = [...data.phrases].sort((a, b) => a.level - b.level);

export const lettersWithFinalForm: Letter[] = letters.filter((l) => l.finalChar !== null);

const letterById = new Map(letters.map((l) => [l.id, l]));
const wordById = new Map(words.map((w) => [w.id, w]));
const phraseById = new Map(phrases.map((p) => [p.id, p]));
const deckById = new Map(decks.map((d) => [d.id, d]));

export function getLetter(id: string): Letter | undefined {
  return letterById.get(id);
}

export function getWord(id: string): Word | undefined {
  return wordById.get(id);
}

export function getPhrase(id: string): Phrase | undefined {
  return phraseById.get(id);
}

export function getDeck(id: string): Deck | undefined {
  return deckById.get(id as DeckId);
}

export function wordsInDeck(id: DeckId): Word[] {
  return words.filter((w) => w.deck === id);
}

export function deckCount(id: DeckId): number {
  return wordsInDeck(id).length;
}

export function cardId(kind: 'letter' | 'word' | 'phrase', refId: string): string {
  return `${kind}:${refId}`;
}

/** Hebrew letters only, so a word can be rendered without its vowel marks. */
export function stripNikud(text: string): string {
  return text.replace(/[\u0591-\u05C7]/g, '');
}
