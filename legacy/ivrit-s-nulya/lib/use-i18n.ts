import { useMemo } from 'react';

import { makeT, resolveLanguage, resolveTranslation } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import type { UiLanguage } from '@/lib/types';

export function useI18n(): {
  lang: UiLanguage;
  translation: UiLanguage;
  t: (key: string, vars?: Record<string, string | number>) => string;
} {
  const settings = useStore().progress.settings;
  const lang = resolveLanguage(settings.language);
  const translation = resolveTranslation(settings);
  const t = useMemo(() => makeT(lang), [lang]);
  return { lang, translation, t };
}
