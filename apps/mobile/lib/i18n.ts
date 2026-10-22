import { t as lookup, tp as lookupPlural, type UiLang } from "@biti/i18n";

export type { UiLang };

export function t(lang: UiLang, path: string, vars?: Record<string, string | number>): string {
  return lookup(lang, path, vars);
}

export function tp(lang: UiLang, path: string, count: number): string {
  return lookupPlural(lang, path, count);
}

export function loc(record: Record<string, string> | undefined, lang: UiLang): string {
  if (!record) return "";
  return record[lang] || record.en || record.ru || record.he || "";
}
