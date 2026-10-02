import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Progress } from '@/lib/types';

const STORAGE_KEY = 'hebrew-coach/progress/v1';

export const PROGRESS_VERSION = 1;

export function emptyProgress(): Progress {
  return {
    version: PROGRESS_VERSION,
    settings: {
      onboarded: false,
      level: 'zero',
      goal: 'reading',
      minutesPerDay: 10,
      theme: 'system',
    },
    cards: {},
    sessions: [],
    streak: { current: 0, longest: 0, lastDay: null },
  };
}

function migrate(stored: unknown): Progress {
  const base = emptyProgress();
  if (typeof stored !== 'object' || stored === null) return base;
  const candidate = stored as Partial<Progress>;
  return {
    version: PROGRESS_VERSION,
    settings: { ...base.settings, ...(candidate.settings ?? {}) },
    cards: candidate.cards ?? {},
    sessions: candidate.sessions ?? [],
    streak: { ...base.streak, ...(candidate.streak ?? {}) },
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
