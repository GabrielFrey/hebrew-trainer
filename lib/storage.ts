import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Progress, Settings } from '@/lib/types';

const STORAGE_KEY = 'hebrew-coach/progress/v1';

export const PROGRESS_VERSION = 3;

export function emptyProgress(): Progress {
  return {
    version: PROGRESS_VERSION,
    settings: {
      onboarded: false,
      level: 'elementary',
      goal: 'reading',
      minutesPerDay: 10,
      theme: 'system',
      language: 'system',
      showNikud: true,
      remindersEnabled: false,
      reminderHour: 20,
      reminderAsked: false,
      soundEnabled: true,
    },
    cards: {},
    sessions: [],
    streak: { current: 0, longest: 0, lastDay: null },
    completedLessons: [],
  };
}

/** Уровни из первой версии приложения. Прогресс при этом не сбрасывается. */
const LEGACY_LEVELS: Record<string, Settings['level']> = {
  zero: 'elementary',
  letters: 'basic',
};

const LEGACY_MINUTES: Record<number, Settings['minutesPerDay']> = { 15: 20 };

function migrate(stored: unknown): Progress {
  const base = emptyProgress();
  if (typeof stored !== 'object' || stored === null) return base;
  const candidate = stored as Partial<Progress>;
  const stored_settings = (candidate.settings ?? {}) as Partial<Settings> & {
    level?: string;
    minutesPerDay?: number;
  };

  const level =
    stored_settings.level && stored_settings.level in LEGACY_LEVELS
      ? LEGACY_LEVELS[stored_settings.level]
      : (stored_settings.level as Settings['level'] | undefined);

  const minutes =
    stored_settings.minutesPerDay && stored_settings.minutesPerDay in LEGACY_MINUTES
      ? LEGACY_MINUTES[stored_settings.minutesPerDay]
      : (stored_settings.minutesPerDay as Settings['minutesPerDay'] | undefined);

  return {
    version: PROGRESS_VERSION,
    settings: {
      ...base.settings,
      ...stored_settings,
      level: level ?? base.settings.level,
      minutesPerDay: minutes ?? base.settings.minutesPerDay,
    },
    // Карточки переносятся как есть: смена схемы уровней ничего не сбрасывает.
    cards: candidate.cards ?? {},
    sessions: candidate.sessions ?? [],
    streak: { ...base.streak, ...(candidate.streak ?? {}) },
    completedLessons: Array.isArray(candidate.completedLessons)
      ? candidate.completedLessons
      : [],
  };
}

export async function loadProgress(): Promise<Progress> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (!value) return emptyProgress();
    return migrate(JSON.parse(value));
  } catch {
    return emptyProgress();
  }
}

export async function saveProgress(progress: Progress): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Local-only storage: a failed write should never break the session.
  }
}

export async function clearProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
