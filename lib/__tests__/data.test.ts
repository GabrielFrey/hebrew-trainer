import {
  decks,
  letters,
  lettersWithFinalForm,
  phrases,
  stripNikud,
  vowels,
  words,
} from '@/lib/data';

const NIKUD = /[\u0591-\u05C7]/;
const HEBREW_ONLY = /^[\u0590-\u05FF\s.,!?'-]+$/;

/**
 * Полное написание (ктив мале) добавляет ו и י там, где в огласованном тексте
 * стоят холам хасер или хирик хасер. Поэтому без огласовок текст может быть
 * длиннее — но все исходные буквы обязаны сохраниться в том же порядке.
 */
function isKtivMaleOf(pointed: string, plain: string): boolean {
  const source = stripNikud(pointed).replace(/\s/g, '');
  const target = plain.replace(/\s/g, '');
  let cursor = 0;
  for (const char of target) {
    if (char === source[cursor]) cursor += 1;
    else if (char !== 'ו' && char !== 'י') return false;
  }
  return cursor === source.length;
}

describe('data/hebrew.json', () => {
  it('содержит полный алфавит и пять конечных форм', () => {
    expect(letters).toHaveLength(22);
    expect(letters.map((l) => l.order)).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
    expect(lettersWithFinalForm.map((l) => l.finalChar)).toEqual(['ך', 'ם', 'ן', 'ף', 'ץ']);
    expect(vowels).toHaveLength(9);
  });

  it('у каждой буквы есть название с огласовками, звук и пример', () => {
    letters.forEach((letter) => {
      expect(NIKUD.test(letter.name)).toBe(true);
      expect(letter.nameRu).not.toHaveLength(0);
      expect(letter.sound).not.toHaveLength(0);
      expect(NIKUD.test(letter.example.he)).toBe(true);
      expect(letter.example.ru).not.toHaveLength(0);
      if (letter.finalChar) expect(letter.finalExample).toBeDefined();
    });
  });

  it('у каждого слова есть никуд, транскрипция и перевод', () => {
    words.forEach((word) => {
      expect(NIKUD.test(word.nikud)).toBe(true);
      expect(HEBREW_ONLY.test(word.nikud)).toBe(true);
      expect(NIKUD.test(word.plain)).toBe(false);
      expect(isKtivMaleOf(word.nikud, word.plain)).toBe(true);
      expect(word.translit).not.toHaveLength(0);
      expect(word.translitRu).not.toHaveLength(0);
      expect(word.ru).not.toHaveLength(0);
    });
  });

  it('не содержит повторяющихся идентификаторов', () => {
    const ids = [...letters, ...words, ...phrases].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('раскладывает слова по существующим колодам', () => {
    const deckIds = new Set(decks.map((deck) => deck.id));
    words.forEach((word) => expect(deckIds.has(word.deck)).toBe(true));
    decks.forEach((deck) => {
      const size = words.filter((word) => word.deck === deck.id).length;
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThanOrEqual(deck.plannedSize);
    });
  });

  it('у каждой фразы есть вариант без огласовок и три отличных дистрактора', () => {
    phrases.forEach((phrase) => {
      expect(NIKUD.test(phrase.nikud)).toBe(true);
      expect(NIKUD.test(phrase.plain)).toBe(false);
      expect(isKtivMaleOf(phrase.nikud, phrase.plain)).toBe(true);
      expect(phrase.distractors.length).toBeGreaterThanOrEqual(3);
      expect(new Set([phrase.ru, ...phrase.distractors]).size).toBe(phrase.distractors.length + 1);
    });
  });
});
