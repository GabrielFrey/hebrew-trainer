/** Shared Hebrew text helpers. Server grading remains authoritative. */

const NIQQUD = /[\u0591-\u05C7]/g;
const BIDI_AND_ZW = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const GERESH_VARIANTS = /[\u05F3\u2018\u2019\u02BC']/g;
const GERSHAYIM_VARIANTS = /[\u05F4\u201C\u201D"]/g;
const MAQAF_VARIANTS = /[\u05BE\u2010\u2011\u2012\u2013\u2014-]/g;

export const SOFIT_TO_REG: Record<string, string> = {
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
};

export const REG_TO_SOFIT: Record<string, string> = {
  כ: "ך",
  מ: "ם",
  נ: "ן",
  פ: "ף",
  צ: "ץ",
};

export type NormalizeMode =
  | "relaxed"
  | "strict_niqqud"
  | "strict_finals"
  | "strict_root";

export function stripBidiAndZeroWidth(text: string): string {
  return text.replace(BIDI_AND_ZW, "");
}

export function stripNiqqud(text: string): string {
  return text.replace(NIQQUD, "");
}

export function hasNiqqud(text: string): boolean {
  return /[\u0591-\u05C7]/.test(text);
}

export function nfc(text: string): string {
  return text.normalize("NFC");
}

export function applyFinals(text: string): string {
  const chars = [...text];
  return chars
    .map((ch, index) => {
      const next = chars[index + 1];
      const atEnd = next === undefined || /\s/.test(next);
      if (atEnd && REG_TO_SOFIT[ch]) return REG_TO_SOFIT[ch];
      if (!atEnd && SOFIT_TO_REG[ch]) return SOFIT_TO_REG[ch];
      return ch;
    })
    .join("");
}

export function normalizeHebrew(
  raw: string,
  mode: NormalizeMode = "relaxed",
  maxLen = 500,
): string {
  let text = nfc(stripBidiAndZeroWidth(raw)).slice(0, maxLen);
  text = text.replace(GERESH_VARIANTS, "׳").replace(GERSHAYIM_VARIANTS, "״");
  text = text.replace(MAQAF_VARIANTS, "־");
  if (mode !== "strict_niqqud") text = stripNiqqud(text);
  if (mode === "strict_root") {
    text = text.replace(/[^\u05D0-\u05EA]/g, "");
    text = applyFinals(text);
    return text;
  }
  if (mode !== "strict_finals") text = applyFinals(text);
  if (mode === "relaxed") {
    text = text.replace(/\s+/g, " ").trim().toLowerCase();
  } else {
    text = text.trim();
  }
  return text;
}

export function answersMatch(
  input: string,
  expected: string,
  mode: NormalizeMode = "relaxed",
): boolean {
  return normalizeHebrew(input, mode) === normalizeHebrew(expected, mode);
}
