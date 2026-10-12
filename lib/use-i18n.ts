import { useMemo } from 'react';

import { makeT, resolveLanguage } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import type { UiLanguage } from '@/lib/types';

export function useI18n(): {
  lang: UiLanguage;
  t: (key: string, vars?: Record<string, string | number>) => string;
} {
  const preference = useStore().progress.settings.language;
  const lang = resolveLanguage(preference);
  const t = useMemo(() => makeT(lang), [lang]);
  return { lang, t };
}
