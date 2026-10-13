import { stripNikud } from '@/lib/hebrew-script';

const DAGESH = '\u05BC';
const SHIN = '\u05C1';
const SIN = '\u05C2';
const SHEVA = '\u05B0';
const HATAF_SEGOL = '\u05B1';
const HATAF_PATAH = '\u05B2';
const HIRIQ = '\u05B4';
const TSERE = '\u05B5';
const SEGOL = '\u05B6';
const PATAH = '\u05B7';
const QAMATS = '\u05B8';
const HOLAM = '\u05B9';
const QUBUTS = '\u05BB';

const BGDKFT = new Set(['ב', 'ג', 'ד', 'כ', 'פ', 'ת']);
const SIBILANT = new Set(['ס', 'ש', 'ז', 'צ']);

export type BinyanId = 'paal' | 'nifal' | 'piel' | 'pual' | 'hifil' | 'hufal' | 'hitpael';

export type VerbPattern =
  | 'strong'
  | 'strong-a'
  | 'lamed-he'
  | 'hollow-u'
  | 'hollow-o'
  | 'pe-yod'
  | 'pe-alef'
  | 'pe-nun'
  | 'special';

export type Person = '1sg' | '2ms' | '2fs' | '3ms' | '3fs' | '1pl' | '2mp' | '2fp' | '3pl';
export type PresentSlot = 'ms' | 'fs' | 'mp' | 'fp';
export type ImperativeSlot = 'ms' | 'fs' | 'mp' | 'fp';

export type Conjugation = {
  infinitive: string;
  present: Record<PresentSlot, string>;
  past: Record<Person, string>;
  future: Record<Person, string>;
  imperative: Record<ImperativeSlot, string>;
};

export const PERSONS: Person[] = ['1sg', '2ms', '2fs', '3ms', '3fs', '1pl', '2mp', '2fp', '3pl'];
export const PRESENT_SLOTS: PresentSlot[] = ['ms', 'fs', 'mp', 'fp'];
export const IMPERATIVE_SLOTS: ImperativeSlot[] = ['ms', 'fs', 'mp', 'fp'];

function baseLetter(ch: string): string {
  return stripNikud(ch).replace(/[^\u05D0-\u05EA]/g, '') || ch;
}

function L(ch: string, vowel = '', dagesh = false, sin = false): string {
  const b = baseLetter(ch);
  let out = b;
  if (dagesh && BGDKFT.has(b)) out += DAGESH;
  if (b === 'ש') out += sin ? SIN : SHIN;
  return out + vowel;
}

function r(root: string, i: number): string {
  return [...stripNikud(root)][i] ?? '';
}

function pastStrong(
  a: string,
  b: string,
  c: string,
  sin: Set<number>,
  firstDagesh = true
): Record<Person, string> {
  const s = (i: number) => sin.has(i);
  return {
    '1sg': `${L(a, QAMATS, firstDagesh, s(0))}${L(b, PATAH, false, s(1))}${L(c, SHEVA, false, s(2))}תִּי`,
    '2ms': `${L(a, QAMATS, firstDagesh, s(0))}${L(b, PATAH, false, s(1))}${L(c, SHEVA, false, s(2))}תָּ`,
    '2fs': `${L(a, QAMATS, firstDagesh, s(0))}${L(b, PATAH, false, s(1))}${L(c, SHEVA, false, s(2))}תְּ`,
    '3ms': `${L(a, QAMATS, firstDagesh, s(0))}${L(b, PATAH, false, s(1))}${L(c, '', false, s(2))}`,
    '3fs': `${L(a, QAMATS, firstDagesh, s(0))}${L(b, SHEVA, false, s(1))}${L(c, QAMATS, false, s(2))}ה`,
    '1pl': `${L(a, QAMATS, firstDagesh, s(0))}${L(b, PATAH, false, s(1))}${L(c, SHEVA, false, s(2))}נוּ`,
    '2mp': `${L(a, SHEVA, false, s(0))}${L(b, PATAH, false, s(1))}${L(c, SHEVA, false, s(2))}תֶּם`,
    '2fp': `${L(a, SHEVA, false, s(0))}${L(b, PATAH, false, s(1))}${L(c, SHEVA, false, s(2))}תֶּן`,
    '3pl': `${L(a, QAMATS, firstDagesh, s(0))}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}וּ`,
  };
}

function presentPaal(a: string, b: string, c: string, sin: Set<number>): Record<PresentSlot, string> {
  const s = (i: number) => sin.has(i);
  const head = `${L(a, '', true, s(0))}וֹ`;
  return {
    ms: `${head}${L(b, TSERE, false, s(1))}${L(c, '', false, s(2))}`,
    fs: `${head}${L(b, SEGOL, false, s(1))}${L(c, SEGOL, false, s(2))}ת`,
    mp: `${head}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}ִים`,
    fp: `${head}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}וֹת`,
  };
}

function futurePaal(
  a: string,
  b: string,
  c: string,
  sin: Set<number>,
  vowel: 'o' | 'a'
): Record<Person, string> {
  const s = (i: number) => sin.has(i);
  const mid = vowel === 'o' ? HOLAM : PATAH;
  const r2dagesh = BGDKFT.has(baseLetter(b));
  const bodyO = `${L(a, SHEVA, false, s(0))}${L(b, mid, r2dagesh, s(1))}${L(c, '', false, s(2))}`;
  const bodyA = `${L(a, SHEVA, false, s(0))}${L(b, PATAH, r2dagesh, s(1))}${L(c, '', false, s(2))}`;
  const body = vowel === 'o' ? bodyO : bodyA;
  const open = `${L(a, SHEVA, false, s(0))}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}`;
  return {
    '1sg': `אֶ${body}`,
    '2ms': `תִּ${body}`,
    '2fs': `תִּ${open}ִי`,
    '3ms': `יִ${body}`,
    '3fs': `תִּ${body}`,
    '1pl': `נִ${body}`,
    '2mp': `תִּ${open}וּ`,
    '2fp': `תִּ${body}${SHEVA}נָה`,
    '3pl': `יִ${open}וּ`,
  };
}

function imperativePaal(
  a: string,
  b: string,
  c: string,
  sin: Set<number>,
  vowel: 'o' | 'a'
): Record<ImperativeSlot, string> {
  const s = (i: number) => sin.has(i);
  const mid = vowel === 'o' ? HOLAM : PATAH;
  const r2dagesh = BGDKFT.has(baseLetter(b));
  return {
    ms: `${L(a, SHEVA, false, s(0))}${L(b, mid, r2dagesh, s(1))}${L(c, '', false, s(2))}`,
    fs: `${L(a, HIRIQ, true, s(0))}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}ִי`,
    mp: `${L(a, HIRIQ, true, s(0))}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}וּ`,
    fp: `${L(a, SHEVA, false, s(0))}${L(b, mid, r2dagesh, s(1))}${L(c, SHEVA, false, s(2))}נָה`,
  };
}

function infinitivePaal(a: string, b: string, c: string, sin: Set<number>, vowel: 'o' | 'a'): string {
  const s = (i: number) => sin.has(i);
  const mid = vowel === 'o' ? HOLAM : PATAH;
  const r2dagesh = BGDKFT.has(baseLetter(b));
  return `לִ${L(a, SHEVA, false, s(0))}${L(b, mid, r2dagesh, s(1))}${L(c, '', false, s(2))}`;
}

function conjugatePaal(root: string, sin: Set<number>, vowel: 'o' | 'a'): Conjugation {
  const a = r(root, 0);
  const b = r(root, 1);
  const c = r(root, 2);
  return {
    infinitive: infinitivePaal(a, b, c, sin, vowel),
    present: presentPaal(a, b, c, sin),
    past: pastStrong(a, b, c, sin, true),
    future: futurePaal(a, b, c, sin, vowel),
    imperative: imperativePaal(a, b, c, sin, vowel),
  };
}

function conjugatePiel(root: string, sin: Set<number>): Conjugation {
  const a = r(root, 0);
  const b = r(root, 1);
  const c = r(root, 2);
  const s = (i: number) => sin.has(i);
  const R2 = (v: string) => L(b, v, true, s(1));
  return {
    infinitive: `לְ${L(a, PATAH, false, s(0))}${R2(TSERE)}${L(c, '', false, s(2))}`,
    present: {
      ms: `מְ${L(a, PATAH, false, s(0))}${R2(TSERE)}${L(c, '', false, s(2))}`,
      fs: `מְ${L(a, PATAH, false, s(0))}${R2(SEGOL)}${L(c, SEGOL, false, s(2))}ת`,
      mp: `מְ${L(a, PATAH, false, s(0))}${L(b, SHEVA, true, s(1))}${L(c, '', false, s(2))}ִים`,
      fp: `מְ${L(a, PATAH, false, s(0))}${L(b, SHEVA, true, s(1))}${L(c, '', false, s(2))}וֹת`,
    },
    past: {
      '1sg': `${L(a, HIRIQ, true, s(0))}${R2(PATAH)}${L(c, SHEVA, false, s(2))}תִּי`,
      '2ms': `${L(a, HIRIQ, true, s(0))}${R2(PATAH)}${L(c, SHEVA, false, s(2))}תָּ`,
      '2fs': `${L(a, HIRIQ, true, s(0))}${R2(PATAH)}${L(c, SHEVA, false, s(2))}תְּ`,
      '3ms': `${L(a, HIRIQ, true, s(0))}${R2(TSERE)}${L(c, '', false, s(2))}`,
      '3fs': `${L(a, HIRIQ, true, s(0))}${L(b, SHEVA, true, s(1))}${L(c, QAMATS, false, s(2))}ה`,
      '1pl': `${L(a, HIRIQ, true, s(0))}${R2(PATAH)}${L(c, SHEVA, false, s(2))}נוּ`,
      '2mp': `${L(a, HIRIQ, true, s(0))}${R2(PATAH)}${L(c, SHEVA, false, s(2))}תֶּם`,
      '2fp': `${L(a, HIRIQ, true, s(0))}${R2(PATAH)}${L(c, SHEVA, false, s(2))}תֶּן`,
      '3pl': `${L(a, HIRIQ, true, s(0))}${L(b, SHEVA, true, s(1))}${L(c, '', false, s(2))}וּ`,
    },
    future: {
      '1sg': `אֲ${L(a, PATAH, false, s(0))}${R2(TSERE)}${L(c, '', false, s(2))}`,
      '2ms': `תְּ${L(a, PATAH, false, s(0))}${R2(TSERE)}${L(c, '', false, s(2))}`,
      '2fs': `תְּ${L(a, PATAH, false, s(0))}${L(b, SHEVA, true, s(1))}${L(c, '', false, s(2))}ִי`,
      '3ms': `יְ${L(a, PATAH, false, s(0))}${R2(TSERE)}${L(c, '', false, s(2))}`,
      '3fs': `תְּ${L(a, PATAH, false, s(0))}${R2(TSERE)}${L(c, '', false, s(2))}`,
      '1pl': `נְ${L(a, PATAH, false, s(0))}${R2(TSERE)}${L(c, '', false, s(2))}`,
      '2mp': `תְּ${L(a, PATAH, false, s(0))}${L(b, SHEVA, true, s(1))}${L(c, '', false, s(2))}וּ`,
      '2fp': `תְּ${L(a, PATAH, false, s(0))}${R2(TSERE)}${L(c, SHEVA, false, s(2))}נָה`,
      '3pl': `יְ${L(a, PATAH, false, s(0))}${L(b, SHEVA, true, s(1))}${L(c, '', false, s(2))}וּ`,
    },
    imperative: {
      ms: `${L(a, PATAH, true, s(0))}${R2(TSERE)}${L(c, '', false, s(2))}`,
      fs: `${L(a, PATAH, true, s(0))}${L(b, SHEVA, true, s(1))}${L(c, '', false, s(2))}ִי`,
      mp: `${L(a, PATAH, true, s(0))}${L(b, SHEVA, true, s(1))}${L(c, '', false, s(2))}וּ`,
      fp: `${L(a, PATAH, true, s(0))}${R2(TSERE)}${L(c, SHEVA, false, s(2))}נָה`,
    },
  };
}

function conjugatePual(root: string, sin: Set<number>): Conjugation {
  const a = r(root, 0);
  const b = r(root, 1);
  const c = r(root, 2);
  const s = (i: number) => sin.has(i);
  const stem = `${L(a, QUBUTS, true, s(0))}${L(b, PATAH, true, s(1))}${L(c, '', false, s(2))}`;
  const stemQamats = `${L(a, QUBUTS, true, s(0))}${L(b, QAMATS, true, s(1))}${L(c, '', false, s(2))}`;
  return {
    infinitive: '',
    present: {
      ms: `מְ${stemQamats}`,
      fs: `מְ${L(a, QUBUTS, true, s(0))}${L(b, SEGOL, true, s(1))}${L(c, SEGOL, false, s(2))}ת`,
      mp: `מְ${stemQamats}ִים`,
      fp: `מְ${stemQamats}וֹת`,
    },
    past: {
      '1sg': `${L(a, QUBUTS, true, s(0))}${L(b, PATAH, true, s(1))}${L(c, SHEVA, false, s(2))}תִּי`,
      '2ms': `${L(a, QUBUTS, true, s(0))}${L(b, PATAH, true, s(1))}${L(c, SHEVA, false, s(2))}תָּ`,
      '2fs': `${L(a, QUBUTS, true, s(0))}${L(b, PATAH, true, s(1))}${L(c, SHEVA, false, s(2))}תְּ`,
      '3ms': stem,
      '3fs': `${L(a, QUBUTS, true, s(0))}${L(b, SHEVA, true, s(1))}${L(c, QAMATS, false, s(2))}ה`,
      '1pl': `${L(a, QUBUTS, true, s(0))}${L(b, PATAH, true, s(1))}${L(c, SHEVA, false, s(2))}נוּ`,
      '2mp': `${L(a, QUBUTS, true, s(0))}${L(b, PATAH, true, s(1))}${L(c, SHEVA, false, s(2))}תֶּם`,
      '2fp': `${L(a, QUBUTS, true, s(0))}${L(b, PATAH, true, s(1))}${L(c, SHEVA, false, s(2))}תֶּן`,
      '3pl': `${L(a, QUBUTS, true, s(0))}${L(b, SHEVA, true, s(1))}${L(c, '', false, s(2))}וּ`,
    },
    future: {
      '1sg': `אֲ${stem}`,
      '2ms': `תְּ${stem}`,
      '2fs': `תְּ${L(a, QUBUTS, true, s(0))}${L(b, SHEVA, true, s(1))}${L(c, '', false, s(2))}ִי`,
      '3ms': `יְ${stem}`,
      '3fs': `תְּ${stem}`,
      '1pl': `נְ${stem}`,
      '2mp': `תְּ${L(a, QUBUTS, true, s(0))}${L(b, SHEVA, true, s(1))}${L(c, '', false, s(2))}וּ`,
      '2fp': `תְּ${stem}${SHEVA}נָה`,
      '3pl': `יְ${L(a, QUBUTS, true, s(0))}${L(b, SHEVA, true, s(1))}${L(c, '', false, s(2))}וּ`,
    },
    imperative: { ms: '', fs: '', mp: '', fp: '' },
  };
}

function conjugateHifil(root: string, sin: Set<number>): Conjugation {
  const a = r(root, 0);
  const b = r(root, 1);
  const c = r(root, 2);
  const s = (i: number) => sin.has(i);
  const closed = `${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, '', false, s(2))}`;
  const yodStem = `${L(a, SHEVA, false, s(0))}${L(b, '', BGDKFT.has(baseLetter(b)), s(1))}ִי${L(c, '', false, s(2))}`;
  return {
    infinitive: `לְהַ${L(a, SHEVA, false, s(0))}${L(b, '', BGDKFT.has(baseLetter(b)), s(1))}ִי${L(c, '', false, s(2))}`,
    present: {
      ms: `מַ${yodStem}`,
      fs: `מַ${yodStem}ָה`,
      mp: `מַ${yodStem}ִים`,
      fp: `מַ${yodStem}וֹת`,
    },
    past: {
      '1sg': `הִ${closed}תִּי`.replace(`${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}`, `${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}`),
      '2ms': `הִ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תָּ`,
      '2fs': `הִ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תְּ`,
      '3ms': `הִ${yodStem}`,
      '3fs': `הִ${yodStem}ָה`,
      '1pl': `הִ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}נוּ`,
      '2mp': `הִ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תֶּם`,
      '2fp': `הִ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תֶּן`,
      '3pl': `הִ${yodStem}וּ`,
    },
    future: {
      '1sg': `אַ${yodStem}`,
      '2ms': `תַּ${yodStem}`,
      '2fs': `תַּ${yodStem}ִי`,
      '3ms': `יַ${yodStem}`,
      '3fs': `תַּ${yodStem}`,
      '1pl': `נַ${yodStem}`,
      '2mp': `תַּ${yodStem}וּ`,
      '2fp': `תַּ${L(a, SHEVA, false, s(0))}${L(b, TSERE, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}נָה`,
      '3pl': `יַ${yodStem}וּ`,
    },
    imperative: {
      ms: `הַ${L(a, SHEVA, false, s(0))}${L(b, TSERE, BGDKFT.has(baseLetter(b)), s(1))}${L(c, '', false, s(2))}`,
      fs: `הַ${yodStem}ִי`,
      mp: `הַ${yodStem}וּ`,
      fp: `הַ${L(a, SHEVA, false, s(0))}${L(b, TSERE, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}נָה`,
    },
  };
}

function conjugateHufal(root: string, sin: Set<number>): Conjugation {
  const a = r(root, 0);
  const b = r(root, 1);
  const c = r(root, 2);
  const s = (i: number) => sin.has(i);
  const stem = `${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, '', false, s(2))}`;
  const qamats = `${L(a, SHEVA, false, s(0))}${L(b, QAMATS, BGDKFT.has(baseLetter(b)), s(1))}${L(c, '', false, s(2))}`;
  return {
    infinitive: '',
    present: {
      ms: `מֻ${qamats}`,
      fs: `מֻ${L(a, SHEVA, false, s(0))}${L(b, SEGOL, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SEGOL, false, s(2))}ת`,
      mp: `מֻ${qamats}ִים`,
      fp: `מֻ${qamats}וֹת`,
    },
    past: {
      '1sg': `הֻ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תִּי`,
      '2ms': `הֻ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תָּ`,
      '2fs': `הֻ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תְּ`,
      '3ms': `הֻ${stem}`,
      '3fs': `הֻ${L(a, SHEVA, false, s(0))}${L(b, SHEVA, false, s(1))}${L(c, QAMATS, false, s(2))}ה`,
      '1pl': `הֻ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}נוּ`,
      '2mp': `הֻ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תֶּם`,
      '2fp': `הֻ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תֶּן`,
      '3pl': `הֻ${L(a, SHEVA, false, s(0))}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}וּ`,
    },
    future: {
      '1sg': `אֻ${stem}`,
      '2ms': `תֻּ${stem}`,
      '2fs': `תֻּ${L(a, SHEVA, false, s(0))}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}ִי`,
      '3ms': `יֻ${stem}`,
      '3fs': `תֻּ${stem}`,
      '1pl': `נֻ${stem}`,
      '2mp': `תֻּ${L(a, SHEVA, false, s(0))}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}וּ`,
      '2fp': `תֻּ${stem}${SHEVA}נָה`,
      '3pl': `יֻ${L(a, SHEVA, false, s(0))}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}וּ`,
    },
    imperative: { ms: '', fs: '', mp: '', fp: '' },
  };
}

function conjugateNifal(root: string, sin: Set<number>): Conjugation {
  const a = r(root, 0);
  const b = r(root, 1);
  const c = r(root, 2);
  const s = (i: number) => sin.has(i);
  const past3 = `נִ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, '', false, s(2))}`;
  const present = `נִ${L(a, SHEVA, false, s(0))}${L(b, QAMATS, BGDKFT.has(baseLetter(b)), s(1))}${L(c, '', false, s(2))}`;
  const fut = `${L(a, '', true, s(0))}${QAMATS}${L(b, TSERE, false, s(1))}${L(c, '', false, s(2))}`;
  return {
    infinitive: `לְהִ${L(a, '', true, s(0))}${QAMATS}${L(b, TSERE, false, s(1))}${L(c, '', false, s(2))}`,
    present: {
      ms: present,
      fs: `נִ${L(a, SHEVA, false, s(0))}${L(b, SEGOL, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SEGOL, false, s(2))}ת`,
      mp: `${present}ִים`,
      fp: `${present}וֹת`,
    },
    past: {
      '1sg': `נִ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תִּי`,
      '2ms': `נִ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תָּ`,
      '2fs': `נִ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תְּ`,
      '3ms': past3,
      '3fs': `נִ${L(a, SHEVA, false, s(0))}${L(b, SHEVA, false, s(1))}${L(c, QAMATS, false, s(2))}ה`,
      '1pl': `נִ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}נוּ`,
      '2mp': `נִ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תֶּם`,
      '2fp': `נִ${L(a, SHEVA, false, s(0))}${L(b, PATAH, BGDKFT.has(baseLetter(b)), s(1))}${L(c, SHEVA, false, s(2))}תֶּן`,
      '3pl': `נִ${L(a, SHEVA, false, s(0))}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}וּ`,
    },
    future: {
      '1sg': `אֶ${fut}`,
      '2ms': `תִּ${fut}`,
      '2fs': `תִּ${L(a, '', true, s(0))}${QAMATS}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}ִי`,
      '3ms': `יִ${fut}`,
      '3fs': `תִּ${fut}`,
      '1pl': `נִ${fut}`,
      '2mp': `תִּ${L(a, '', true, s(0))}${QAMATS}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}וּ`,
      '2fp': `תִּ${fut}${SHEVA}נָה`,
      '3pl': `יִ${L(a, '', true, s(0))}${QAMATS}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}וּ`,
    },
    imperative: {
      ms: `הִ${fut}`,
      fs: `הִ${L(a, '', true, s(0))}${QAMATS}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}ִי`,
      mp: `הִ${L(a, '', true, s(0))}${QAMATS}${L(b, SHEVA, false, s(1))}${L(c, '', false, s(2))}וּ`,
      fp: `הִ${fut}${SHEVA}נָה`,
    },
  };
}

function hitpaelPrefix(root: string): { prefix: string; restStart: number } {
  const first = r(root, 0);
  if (first === 'ש' || first === 'ס') return { prefix: `הִ${first}ְתַּ`, restStart: 1 };
  if (first === 'ז') return { prefix: 'הִזְדַּ', restStart: 1 };
  if (first === 'צ') return { prefix: 'הִצְטַ', restStart: 1 };
  return { prefix: 'הִתְ', restStart: 0 };
}

function conjugateHitpael(root: string, sin: Set<number>): Conjugation {
  const a = r(root, 0);
  const b = r(root, 1);
  const c = r(root, 2);
  const s = (i: number) => sin.has(i);
  const first = baseLetter(a);
  const meta = SIBILANT.has(first);
  const r1 = meta ? r(root, 1) : a;
  const r2 = meta ? r(root, 2) : b;
  const r3 = meta ? '' : c;
  const i1 = meta ? 1 : 0;
  const i2 = meta ? 2 : 1;
  const i3 = meta ? -1 : 2;

  let prePast = 'הִתְ';
  let prePres = 'מִתְ';
  let preFut = 'תְ';
  if (first === 'ש' || first === 'ס') {
    prePast = `הִ${L(a, SHEVA, false, s(0))}תַּ`;
    prePres = `מִ${L(a, SHEVA, false, s(0))}תַּ`;
    preFut = `${L(a, SHEVA, false, s(0))}תַּ`;
  } else if (first === 'ז') {
    prePast = 'הִזְדַּ';
    prePres = 'מִזְדַּ';
    preFut = 'זְדַּ';
  } else if (first === 'צ') {
    prePast = 'הִצְטַ';
    prePres = 'מִצְטַ';
    preFut = 'צְטַ';
  }

  const mid = meta
    ? `${L(r1, PATAH, true, s(i1))}${L(r2, TSERE, false, s(i2))}`
    : `${L(r1, PATAH, BGDKFT.has(baseLetter(r1)) || true, s(i1))}${L(r2, TSERE, true, s(i2))}${L(r3, '', false, s(i3))}`;
  const midOpen = meta
    ? `${L(r1, PATAH, true, s(i1))}${L(r2, '', false, s(i2))}`
    : `${L(r1, PATAH, true, s(i1))}${L(r2, SHEVA, true, s(i2))}${L(r3, '', false, s(i3))}`;
  const midPatah = meta
    ? `${L(r1, PATAH, true, s(i1))}${L(r2, PATAH, false, s(i2))}`
    : `${L(r1, PATAH, true, s(i1))}${L(r2, PATAH, true, s(i2))}${L(r3, '', false, s(i3))}`;

  const word = (pre: string, body: string, tail = '') => `${pre}${body}${tail}`;

  return {
    infinitive: `לְ${word(prePast, mid)}`,
    present: {
      ms: word(prePres, mid),
      fs: word(prePres, meta ? `${L(r1, PATAH, true, s(i1))}${L(r2, SEGOL, false, s(i2))}ת` : `${L(r1, PATAH, true, s(i1))}${L(r2, SEGOL, true, s(i2))}${L(r3, SEGOL, false, s(i3))}ת`),
      mp: word(prePres, midOpen, 'ִים'),
      fp: word(prePres, midOpen, 'וֹת'),
    },
    past: {
      '1sg': word(prePast, `${midPatah}${meta ? '' : ''}`, 'תִּי'),
      '2ms': word(prePast, midPatah, 'תָּ'),
      '2fs': word(prePast, midPatah, 'תְּ'),
      '3ms': word(prePast, mid),
      '3fs': word(prePast, midOpen, 'ָה'),
      '1pl': word(prePast, midPatah, 'נוּ'),
      '2mp': word(prePast, midPatah, 'תֶּם'),
      '2fp': word(prePast, midPatah, 'תֶּן'),
      '3pl': word(prePast, midOpen, 'וּ'),
    },
    future: {
      '1sg': `אֶ${word(preFut, mid)}`,
      '2ms': `תִּ${word(preFut, mid)}`,
      '2fs': `תִּ${word(preFut, midOpen, 'ִי')}`,
      '3ms': `יִ${word(preFut, mid)}`,
      '3fs': `תִּ${word(preFut, mid)}`,
      '1pl': `נִ${word(preFut, mid)}`,
      '2mp': `תִּ${word(preFut, midOpen, 'וּ')}`,
      '2fp': `תִּ${word(preFut, mid, 'נָה')}`,
      '3pl': `יִ${word(preFut, midOpen, 'וּ')}`,
    },
    imperative: {
      ms: word(prePast, mid),
      fs: word(prePast, midOpen, 'ִי'),
      mp: word(prePast, midOpen, 'וּ'),
      fp: word(prePast, mid, 'נָה'),
    },
  };
}

function emptyForms(): Conjugation {
  const blankPerson = {
    '1sg': '',
    '2ms': '',
    '2fs': '',
    '3ms': '',
    '3fs': '',
    '1pl': '',
    '2mp': '',
    '2fp': '',
    '3pl': '',
  };
  return {
    infinitive: '',
    present: { ms: '', fs: '', mp: '', fp: '' },
    past: { ...blankPerson },
    future: { ...blankPerson },
    imperative: { ms: '', fs: '', mp: '', fp: '' },
  };
}

function merge(base: Conjugation, extra?: Partial<Conjugation>): Conjugation {
  if (!extra) return base;
  return {
    infinitive: extra.infinitive ?? base.infinitive,
    present: { ...base.present, ...(extra.present ?? {}) },
    past: { ...base.past, ...(extra.past ?? {}) },
    future: { ...base.future, ...(extra.future ?? {}) },
    imperative: { ...base.imperative, ...(extra.imperative ?? {}) },
  };
}

export type VerbBuild = {
  root: string;
  binyan: BinyanId;
  pattern: VerbPattern;
  sin?: number[];
  forms?: Partial<Conjugation>;
};

export function buildConjugation(spec: VerbBuild): Conjugation {
  const sin = new Set(spec.sin ?? []);
  if (spec.pattern === 'special') {
    return merge(emptyForms(), spec.forms);
  }
  let generated: Conjugation;
  switch (spec.binyan) {
    case 'piel':
      generated = conjugatePiel(spec.root, sin);
      break;
    case 'pual':
      generated = conjugatePual(spec.root, sin);
      break;
    case 'hifil':
      generated = conjugateHifil(spec.root, sin);
      break;
    case 'hufal':
      generated = conjugateHufal(spec.root, sin);
      break;
    case 'nifal':
      generated = conjugateNifal(spec.root, sin);
      break;
    case 'hitpael':
      generated = conjugateHitpael(spec.root, sin);
      break;
    default:
      generated = conjugatePaal(spec.root, sin, spec.pattern === 'strong-a' ? 'a' : 'o');
  }
  return merge(generated, spec.forms);
}

export function formOf(
  conj: Conjugation,
  tense: 'infinitive' | 'present' | 'past' | 'future' | 'imperative',
  slot: string
): string {
  if (tense === 'infinitive') return conj.infinitive;
  if (tense === 'present') return conj.present[slot as PresentSlot] ?? '';
  if (tense === 'imperative') return conj.imperative[slot as ImperativeSlot] ?? '';
  if (tense === 'past') return conj.past[slot as Person] ?? '';
  return conj.future[slot as Person] ?? '';
}
