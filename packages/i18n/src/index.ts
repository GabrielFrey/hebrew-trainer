import { en } from "./en";
import { ru } from "./ru";
import { he } from "./he";

export type UiLang = "en" | "ru" | "he";
export const dictionaries = { en, ru, he } as const;
export { en, ru, he };

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
