"use client";

import { createContext, useContext, useMemo } from "react";
import { t as lookup, type UiLang } from "../../../../packages/i18n/src";

const Ctx = createContext<{ lang: UiLang; t: (path: string) => string }>({
  lang: "ru",
  t: (p) => p,
});

export function I18nProvider({ lang, children }: { lang: UiLang; children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, t: (path: string) => lookup(lang, path) }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  return useContext(Ctx);
}

export function loc(record: Record<string, string> | undefined, lang: UiLang): string {
  if (!record) return "";
  return record[lang] || record.en || record.ru || record.he || "";
}
