import { en } from "./en";
import { ru } from "./ru";
import { he } from "./he";
import { uk } from "./uk";
import { es } from "./es";
import { fr } from "./fr";

export type UiLang = "en" | "ru" | "he" | "uk" | "es" | "fr";
export const dictionaries = { en, ru, he, uk, es, fr } as const;
export { en, ru, he, uk, es, fr };

export const l10nStatus: Record<UiLang, "approved" | "in_review"> = {
  en: "approved",
  ru: "approved",
  he: "approved",
  uk: "in_review",
  es: "in_review",
  fr: "in_review",
};

export type PluralCategory = "one" | "few" | "many" | "other";
export const PLURAL_FORMS: PluralCategory[] = ["one", "few", "many", "other"];

const PLACEHOLDER = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

export function interpolate(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(PLACEHOLDER, (whole, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : whole,
  );
}

export function placeholders(template: string): string[] {
  return Array.from(template.matchAll(PLACEHOLDER), (m) => m[1]).sort();
}

/** CLDR-style plural category. ru/uk use one/few/many; fr treats 0 as one. */
export function pluralCategory(lang: UiLang, n: number): PluralCategory {
  const i = Math.abs(Math.trunc(n));
  if (lang === "ru" || lang === "uk") {
    const mod10 = i % 10;
    const mod100 = i % 100;
    if (mod10 === 1 && mod100 !== 11) return "one";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "few";
    return "many";
  }
  if (lang === "fr" && (i === 0 || i === 1)) return "one";
  if (i === 1) return "one";
  return "other";
}

function lookupRaw(lang: UiLang, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = dictionaries[lang] ?? dictionaries.en;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null || !(p in cur)) {
      cur = dictionaries.en;
      for (const q of parts) {
        if (typeof cur !== "object" || cur === null || !(q in cur)) return undefined;
        cur = (cur as Record<string, unknown>)[q];
      }
      return cur;
    }
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function t(lang: UiLang, path: string, vars?: Record<string, string | number>): string {
  const cur = lookupRaw(lang, path);
  if (typeof cur === "string") return interpolate(cur, vars);
  return path;
}

export function tp(lang: UiLang, path: string, count: number, extra?: Record<string, string | number>): string {
  const cur = lookupRaw(lang, path);
  const vars = { count, ...extra };
  if (typeof cur === "string") return interpolate(cur, vars);
  if (typeof cur === "object" && cur !== null) {
    const forms = cur as Record<string, unknown>;
    const cat = pluralCategory(lang, count);
    const pick = [cat, "other", "many", "few", "one"];
    for (const key of pick) {
      const val = forms[key];
      if (typeof val === "string") return interpolate(val, vars);
    }
  }
  return path;
}

export function flattenStrings(
  node: unknown,
  prefix = "",
  out: Record<string, string> = {},
): Record<string, string> {
  if (typeof node === "string") {
    if (prefix) out[prefix] = node;
    return out;
  }
  if (typeof node !== "object" || node === null) return out;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    flattenStrings(value, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
}

export function isPluralGroup(node: unknown): boolean {
  return typeof node === "object" && node !== null && "other" in (node as object);
}
