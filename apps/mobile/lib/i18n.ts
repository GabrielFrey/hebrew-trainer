import { t as lookup, type UiLang } from "@biti/i18n";

export type { UiLang };

export function t(lang: UiLang, path: string): string {
  return lookup(lang, path);
}

export function loc(record: Record<string, string> | undefined, lang: UiLang): string {
  if (!record) return "";
  return record[lang] || record.en || record.ru || record.he || "";
}
