/** Никуд и кантилляция: с ними и без них одно и то же слово. */
const NIKUD_RE = /[\u0591-\u05C7]/g;

const SOFIT_TO_REG: Record<string, string> = {
  ך: 'כ',
  ם: 'מ',
  ן: 'נ',
  ף: 'פ',
  ץ: 'צ',
};

const REG_TO_SOFIT: Record<string, string> = {
  כ: 'ך',
  מ: 'ם',
  נ: 'ן',
  פ: 'ף',
  צ: 'ץ',
};

export function stripNikud(text: string): string {
  return text.replace(NIKUD_RE, '');
}

export function hasNikud(text: string): boolean {
  return NIKUD_RE.test(text);
}

/** Конечные ךםןףץ ↔ обычные כמנפצ, без огласовок, без пробелов по краям. */
export function normalizeHebrew(text: string): string {
  const letters = stripNikud(text)
    .replace(/[^\u05D0-\u05EA\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  const chars = [...letters];
  return chars
    .map((ch, index) => {
      const next = chars[index + 1];
      const atEnd = next === undefined || next === ' ';
      if (atEnd && REG_TO_SOFIT[ch]) return REG_TO_SOFIT[ch];
      if (!atEnd && SOFIT_TO_REG[ch]) return SOFIT_TO_REG[ch];
      return ch;
    })
    .join('');
}

/** Ответ без никуда; конечные буквы принимаются в обеих формах. */
export function answersMatch(input: string, expected: string): boolean {
  const a = normalizeHebrew(input);
  const b = normalizeHebrew(expected);
  if (!a || !b) return false;
  if (a === b) return true;
  const collapsed = (s: string) => s.replace(/\s+/g, '');
  return collapsed(a) === collapsed(b);
}

export function rootLetters(root: string): string[] {
  return [...stripNikud(root).replace(/[^\u05D0-\u05EA]/g, '')];
}

/** Корень встречается в слове (буквы по порядку, можно с пропусками). */
export function hebrewContainsRoot(hebrew: string, root: string): boolean {
  const word = [...stripNikud(hebrew).replace(/[^\u05D0-\u05EA]/g, '')];
  const letters = rootLetters(root);
  if (letters.length < 2) return false;
  let i = 0;
  for (const ch of word) {
    if (ch === letters[i]) i += 1;
    if (i === letters.length) return true;
  }
  return false;
}
