import { Platform } from "react-native";
import type { UiLang } from "@biti/i18n";

const SUPPORTED: UiLang[] = ["en", "ru", "he", "uk", "es", "fr"];

export const COURSE_FOR_LANG: Record<UiLang, string> = {
  en: "he-en",
  ru: "he-ru",
  he: "he-en",
  uk: "he-uk",
  es: "he-es",
  fr: "he-fr",
};

function tagFromLocale(locale: string): UiLang | null {
  const tag = locale.replace("_", "-").split("-")[0]?.toLowerCase();
  return SUPPORTED.includes(tag as UiLang) ? (tag as UiLang) : null;
}

/** English is the product default. Other UI languages follow the device locale when we know it. */
export function deviceUiLang(): UiLang {
  try {
    const intl = Intl.DateTimeFormat().resolvedOptions().locale;
    const fromIntl = tagFromLocale(intl || "");
    if (fromIntl) return fromIntl;
  } catch {
    /* Intl missing */
  }
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    for (const loc of navigator.languages || [navigator.language]) {
      const hit = tagFromLocale(loc || "");
      if (hit) return hit;
    }
  }
  return "en";
}
