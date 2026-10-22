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

export function t(lang: UiLang, path: string): string {
  const parts = path.split(".");
  let cur: unknown = dictionaries[lang] ?? dictionaries.en;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null || !(p in cur)) {
      cur = dictionaries.en;
      for (const q of parts) {
        if (typeof cur !== "object" || cur === null || !(q in cur)) return path;
        cur = (cur as Record<string, unknown>)[q];
      }
      break;
    }
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : path;
}
