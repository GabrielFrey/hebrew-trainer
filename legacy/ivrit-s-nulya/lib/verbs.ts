import { hebrewContainsRoot, stripNikud } from '@/lib/hebrew-script';
import { loadedWords } from '@/lib/lexicon';
import type { LevelId, Word } from '@/lib/types';
import { VERB_CATALOG, type VerbEntry } from '@/lib/verbs-catalog';
import {
  IMPERATIVE_SLOTS,
  PERSONS,
  PRESENT_SLOTS,
  buildConjugation,
  formOf,
  type BinyanId,
  type Conjugation,
  type ImperativeSlot,
  type Person,
  type PresentSlot,
} from '@/lib/verbs-engine';

export type { BinyanId, Conjugation, ImperativeSlot, Person, PresentSlot, VerbEntry };
export { IMPERATIVE_SLOTS, PERSONS, PRESENT_SLOTS, formOf };

export const BINYANIM: {
  id: BinyanId;
  he: string;
  nameRu: string;
  nameEn: string;
  ru: string;
  en: string;
}[] = [
  {
    id: 'paal',
    he: 'פָּעַל (קַל)',
    nameRu: 'Пааль (каль)',
    nameEn: "Pa'al (qal)",
    ru: 'Базовый биньян: обычное действие без оттенка. «писал», «ел», «шёл».',
    en: 'The simple stem: a plain action. “wrote”, “ate”, “went”.',
  },
  {
    id: 'nifal',
    he: 'נִפְעַל',
    nameRu: 'Нифаль',
    nameEn: "Nif'al",
    ru: 'Страдательный или возвратный к паалю. נִכְתַּב — «был написан», נִכְנַס — «вошёл».',
    en: 'Passive or inchoative of pa’al. נִכְתַּב — “was written”, נִכְנַס — “entered”.',
  },
  {
    id: 'piel',
    he: 'פִּעֵל',
    nameRu: 'Пиэль',
    nameEn: "Pi'el",
    ru: 'Интенсив или повтор. דִּבֵּר — «говорил», שִׁלֵּם — «заплатил».',
    en: 'Intensive or iterative. דִּבֵּר — “spoke”, שִׁלֵּם — “paid”.',
  },
  {
    id: 'pual',
    he: 'פֻּעַל',
    nameRu: 'Пуаль',
    nameEn: "Pu'al",
    ru: 'Страдательный к пиэлю. דֻּבַּר — «было сказано». Повелительного почти нет.',
    en: 'Passive of pi’el. דֻּבַּר — “was spoken”. Almost no imperative.',
  },
  {
    id: 'hifil',
    he: 'הִפְעִיל',
    nameRu: 'Һифиль',
    nameEn: "Hif'il",
    ru: 'Каузатив: заставить или дать случиться. הִכְתִּיב — «диктовал», הֵבִין — «понял».',
    en: 'Causative: make something happen. הִכְתִּיב — “dictated”, הֵבִין — “understood”.',
  },
  {
    id: 'hufal',
    he: 'הֻפְעַל',
    nameRu: 'Һуфаль',
    nameEn: "Huf'al",
    ru: 'Страдательный к һифилю. הֻכְתַּב — «было продиктовано».',
    en: 'Passive of hif’il. הֻכְתַּב — “was dictated”.',
  },
  {
    id: 'hitpael',
    he: 'הִתְפַּעֵל',
    nameRu: 'Һитпаэль',
    nameEn: "Hitpa'el",
    ru: 'Возвратный или взаимный. הִשְׁתַּמֵּשׁ — «пользовался», הִתְכַּתֵּב — «переписывался».',
    en: 'Reflexive or reciprocal. הִשְׁתַּמֵּשׁ — “used”, הִתְכַּתֵּב — “corresponded”.',
  },
];

export type Verb = VerbEntry & {
  forms: Conjugation;
};

const SKIP_IDS = new Set([
  'hosif',
  'hitorer',
  'hitkonen',
  'hitkhabe',
  'hislaleakh',
  'hemin',
  'heavir',
  'hifria',
  'hishir',
]);

function usable(forms: Conjugation, binyan: BinyanId): boolean {
  if (!forms.present.ms || !forms.past['3ms'] || !forms.future['3ms']) return false;
  if (binyan === 'pual' || binyan === 'hufal') return true;
  return forms.infinitive.length > 0;
}

function buildAll(): Verb[] {
  const seen = new Set<string>();
  const out: Verb[] = [];
  for (const spec of VERB_CATALOG) {
    if (SKIP_IDS.has(spec.id) || seen.has(spec.id)) continue;
    const forms = buildConjugation(spec);
    if (!usable(forms, spec.binyan)) continue;
    seen.add(spec.id);
    out.push({ ...spec, forms });
  }
  return out;
}

const ALL: Verb[] = buildAll();

export function allVerbs(): Verb[] {
  return ALL;
}

export function verbsForLevel(level: LevelId): Verb[] {
  const order: LevelId[] = ['elementary', 'basic', 'intermediate', 'advanced', 'expert'];
  const max = order.indexOf(level);
  return ALL.filter((verb) => order.indexOf(verb.level) <= max);
}

export function getVerb(id: string): Verb | undefined {
  return ALL.find((verb) => verb.id === id);
}

export function verbsByBinyan(id: BinyanId): Verb[] {
  return ALL.filter((verb) => verb.binyan === id);
}

export function getBinyan(id: BinyanId) {
  return BINYANIM.find((item) => item.id === id);
}

export function relatedLexiconWords(verb: Verb, limit = 8): Word[] {
  const inf = stripNikud(verb.forms.infinitive);
  const hits: Word[] = [];
  for (const word of loadedWords()) {
    if (!hebrewContainsRoot(word.hebrew, verb.root) && !hebrewContainsRoot(word.nikud, verb.root)) {
      continue;
    }
    if (stripNikud(word.hebrew) === inf || stripNikud(word.nikud) === inf) continue;
    hits.push(word);
    if (hits.length >= limit) break;
  }
  return hits;
}

export function lexiconWordForVerb(verb: Verb): Word | undefined {
  const targets = new Set(
    [verb.forms.infinitive, verb.forms.present.ms, verb.forms.past['3ms']]
      .map((item) => stripNikud(item))
      .filter(Boolean)
  );
  return loadedWords().find((word) => {
    const he = stripNikud(word.hebrew);
    const ni = stripNikud(word.nikud);
    return targets.has(he) || targets.has(ni);
  });
}

export type FormPrompt = {
  tense: 'infinitive' | 'present' | 'past' | 'future' | 'imperative';
  slot: string;
  answer: string;
};

const PROMPT_SLOTS: { tense: FormPrompt['tense']; slot: string }[] = [
  { tense: 'infinitive', slot: 'inf' },
  { tense: 'present', slot: 'ms' },
  { tense: 'present', slot: 'fs' },
  { tense: 'present', slot: 'mp' },
  { tense: 'past', slot: '1sg' },
  { tense: 'past', slot: '3ms' },
  { tense: 'past', slot: '3fs' },
  { tense: 'past', slot: '3pl' },
  { tense: 'future', slot: '1sg' },
  { tense: 'future', slot: '3ms' },
  { tense: 'future', slot: '2ms' },
  { tense: 'imperative', slot: 'ms' },
];

export function pickFormPrompt(verb: Verb, seed: number): FormPrompt | null {
  const options = PROMPT_SLOTS.map((item) => ({
    ...item,
    answer: item.tense === 'infinitive' ? verb.forms.infinitive : formOf(verb.forms, item.tense, item.slot),
  })).filter((item) => item.answer.length > 0);
  if (options.length === 0) return null;
  return options[seed % options.length] ?? null;
}

export function verbCount(): number {
  return ALL.length;
}
