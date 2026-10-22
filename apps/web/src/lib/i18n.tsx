"use client";

import { createContext, useContext, useMemo } from "react";
import { t as lookup, tp as lookupPlural, type UiLang } from "../../../../packages/i18n/src";

type Translate = (path: string, vars?: Record<string, string | number>) => string;

const Ctx = createContext<{
  lang: UiLang;
  t: Translate;
  tp: (path: string, count: number) => string;
}>({
  lang: "ru",
  t: (p) => p,
  tp: (p) => p,
});

export function I18nProvider({ lang, children }: { lang: UiLang; children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      lang,
      t: (path: string, vars?: Record<string, string | number>) => lookup(lang, path, vars),
      tp: (path: string, count: number) => lookupPlural(lang, path, count),
    }),
    [lang],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  return useContext(Ctx);
}

export function loc(record: Record<string, string> | undefined, lang: UiLang): string {
  if (!record) return "";
  return record[lang] || record.en || record.ru || record.he || "";
}
