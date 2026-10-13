import { stripNikud } from '@/lib/data';

const CYRILLIC = /[\u0400-\u04FF]/;

export function hasCyrillic(text: string | undefined): boolean {
  return CYRILLIC.test(text ?? '');
}

export function normalizeLemma(text: string | undefined): string {
  return stripNikud(text ?? '')
    .replace(/[.,!?;:"""«»()[\]]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/** Пример, который просто повторяет само слово (с точкой или без). */
export function exampleRepeatsLemma(lemma: string, exampleHe: string | undefined): boolean {
  const head = normalizeLemma(lemma);
  const example = normalizeLemma(exampleHe);
  if (!head || !example) return false;
  return head === example;
}

export function isBlankExample(example: { nikud?: string; hebrew?: string } | undefined): boolean {
  return !normalizeLemma(example?.nikud) && !normalizeLemma(example?.hebrew);
}
