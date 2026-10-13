import { answersMatch, stripNikud } from '@/lib/hebrew-script';
import { formOf, pickFormPrompt, type Verb } from '@/lib/verbs';
import type { BilingualText, SessionCard, Word } from '@/lib/types';

const HE_WORD = /[\u05D0-\u05EA]/;

export function clozeFromExample(word: Word): { prompt: string; answer: string } | null {
  const sentence = word.example?.nikud?.trim() ?? '';
  const tokens = sentence.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return null;
  const lemma = stripNikud(word.nikud || word.hebrew);
  if (!lemma) return null;
  const index = tokens.findIndex((token) => {
    const plain = stripNikud(token).replace(/[.,!?״"':;]/g, '');
    return plain === lemma || plain.includes(lemma) || lemma.includes(plain);
  });
  if (index < 0) return null;
  const answer = tokens[index] ?? '';
  const prompt = tokens.map((token, i) => (i === index ? '____' : token)).join(' ');
  if (!HE_WORD.test(answer)) return null;
  return { prompt, answer };
}

export type GenderItem = {
  id: string;
  promptRu: string;
  promptEn: string;
  options: string[];
  answer: string;
  bilingualOptions: BilingualText[];
};

const GENDER_BANK: GenderItem[] = [
  {
    id: 'ata-rotze',
    promptRu: 'ты (м.р.) хочешь',
    promptEn: 'you (m.) want',
    options: ['אַתָּה רוֹצֶה', 'אַתְּ רוֹצָה'],
    answer: 'אַתָּה רוֹצֶה',
    bilingualOptions: [
      { ru: 'אַתָּה רוֹצֶה', en: 'אַתָּה רוֹצֶה' },
      { ru: 'אַתְּ רוֹצָה', en: 'אַתְּ רוֹצָה' },
    ],
  },
  {
    id: 'at-rotza',
    promptRu: 'ты (ж.р.) хочешь',
    promptEn: 'you (f.) want',
    options: ['אַתְּ רוֹצָה', 'אַתָּה רוֹצֶה'],
    answer: 'אַתְּ רוֹצָה',
    bilingualOptions: [
      { ru: 'אַתְּ רוֹצָה', en: 'אַתְּ רוֹצָה' },
      { ru: 'אַתָּה רוֹצֶה', en: 'אַתָּה רוֹצֶה' },
    ],
  },
  {
    id: 'hu-gadol',
    promptRu: 'он большой',
    promptEn: 'he is big',
    options: ['הוּא גָּדוֹל', 'הִיא גְּדוֹלָה'],
    answer: 'הוּא גָּדוֹל',
    bilingualOptions: [
      { ru: 'הוּא גָּדוֹל', en: 'הוּא גָּדוֹל' },
      { ru: 'הִיא גְּדוֹלָה', en: 'הִיא גְּדוֹלָה' },
    ],
  },
  {
    id: 'hi-gdola',
    promptRu: 'она большая',
    promptEn: 'she is big',
    options: ['הִיא גְּדוֹלָה', 'הוּא גָּדוֹל'],
    answer: 'הִיא גְּדוֹלָה',
    bilingualOptions: [
      { ru: 'הִיא גְּדוֹלָה', en: 'הִיא גְּדוֹלָה' },
      { ru: 'הוּא גָּדוֹל', en: 'הוּא גָּדוֹל' },
    ],
  },
  {
    id: 'hu-tov',
    promptRu: 'он хороший',
    promptEn: 'he is good',
    options: ['הוּא טוֹב', 'הִיא טוֹבָה'],
    answer: 'הוּא טוֹב',
    bilingualOptions: [
      { ru: 'הוּא טוֹב', en: 'הוּא טוֹב' },
      { ru: 'הִיא טוֹבָה', en: 'הִיא טוֹבָה' },
    ],
  },
  {
    id: 'hi-tova',
    promptRu: 'она хорошая',
    promptEn: 'she is good',
    options: ['הִיא טוֹבָה', 'הוּא טוֹב'],
    answer: 'הִיא טוֹבָה',
    bilingualOptions: [
      { ru: 'הִיא טוֹבָה', en: 'הִיא טוֹבָה' },
      { ru: 'הוּא טוֹב', en: 'הוּא טוֹב' },
    ],
  },
  {
    id: 'yeled-katan',
    promptRu: 'маленький мальчик',
    promptEn: 'a small boy',
    options: ['יֶלֶד קָטָן', 'יַלְדָּה קְטַנָּה'],
    answer: 'יֶלֶד קָטָן',
    bilingualOptions: [
      { ru: 'יֶלֶד קָטָן', en: 'יֶלֶד קָטָן' },
      { ru: 'יַלְדָּה קְטַנָּה', en: 'יַלְדָּה קְטַנָּה' },
    ],
  },
  {
    id: 'yalda-ktana',
    promptRu: 'маленькая девочка',
    promptEn: 'a small girl',
    options: ['יַלְדָּה קְטַנָּה', 'יֶלֶד קָטָן'],
    answer: 'יַלְדָּה קְטַנָּה',
    bilingualOptions: [
      { ru: 'יַלְדָּה קְטַנָּה', en: 'יַלְדָּה קְטַנָּה' },
      { ru: 'יֶלֶד קָטָן', en: 'יֶלֶד קָטָן' },
    ],
  },
];

export function genderFromVerb(verb: Verb, seed: number): GenderItem | null {
  const ms = verb.forms.present.ms;
  const fs = verb.forms.present.fs;
  if (!ms || !fs || ms === fs) return null;
  const male = seed % 2 === 0;
  const answer = male ? `הוּא ${ms}` : `הִיא ${fs}`;
  const other = male ? `הִיא ${fs}` : `הוּא ${ms}`;
  return {
    id: `verb-${verb.id}-${male ? 'm' : 'f'}`,
    promptRu: male ? `он (${verb.ru})` : `она (${verb.ru})`,
    promptEn: male ? `he (${verb.en})` : `she (${verb.en})`,
    options: [answer, other],
    answer,
    bilingualOptions: [
      { ru: answer, en: answer },
      { ru: other, en: other },
    ],
  };
}

export function pickGenderItem(seed: number, verb?: Verb | null): GenderItem {
  const fromVerb = verb ? genderFromVerb(verb, seed) : null;
  if (fromVerb) return fromVerb;
  return GENDER_BANK[seed % GENDER_BANK.length] as GenderItem;
}

export function typedAnswerOk(input: string, expected: string): boolean {
  return answersMatch(input, expected);
}

export function formDistractors(verb: Verb, answer: string, seed: number): string[] {
  const pool = [
    verb.forms.infinitive,
    verb.forms.present.ms,
    verb.forms.present.fs,
    verb.forms.present.mp,
    verb.forms.past['3ms'],
    verb.forms.past['1sg'],
    verb.forms.past['3pl'],
    verb.forms.future['3ms'],
    verb.forms.future['1sg'],
    verb.forms.imperative.ms,
  ].filter((item) => item && item !== answer);
  const unique = Array.from(new Set(pool));
  let s = seed || 1;
  for (let i = unique.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    const a = unique[i] as string;
    unique[i] = unique[j] as string;
    unique[j] = a;
  }
  return unique.slice(0, 3);
}

export function isTypedExercise(kind: SessionCard['exercise']): boolean {
  return kind === 'type-word' || kind === 'cloze-example' || kind === 'form-verb';
}

export { pickFormPrompt, formOf };
