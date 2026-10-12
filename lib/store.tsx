import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { dayKey, daysBetween } from '@/lib/dates';
import { ensureLevel } from '@/lib/lexicon';
import { createCard, schedule } from '@/lib/srs';
import { clearProgress, emptyProgress, loadProgress, saveProgress } from '@/lib/storage';
import type { CardKind, Grade, Progress, Settings } from '@/lib/types';

type StoreValue = {
  progress: Progress;
  ready: boolean;
  gradeCard: (kind: CardKind, refId: string, grade: Grade) => void;
  finishSession: (reviewed: number, correct: number) => void;
  completeLesson: (lessonKey: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  reset: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadProgress().then((loaded) => {
      if (!active) return;
      ensureLevel(loaded.settings.level);
      setProgress(loaded);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback((next: Progress) => {
    setProgress(next);
    void saveProgress(next);
  }, []);

  const gradeCard = useCallback(
    (kind: CardKind, refId: string, grade: Grade) => {
      setProgress((current) => {
        const id = `${kind}:${refId}`;
        const existing = current.cards[id] ?? createCard(kind, refId);
        const next: Progress = {
          ...current,
          cards: { ...current.cards, [id]: schedule(existing, grade) },
        };
        void saveProgress(next);
        return next;
      });
    },
    []
  );

  const finishSession = useCallback((reviewed: number, correct: number) => {
    setProgress((current) => {
      const today = dayKey();
      const last = current.streak.lastDay;
      let currentStreak = current.streak.current;
      if (last === today) {
        currentStreak = Math.max(1, currentStreak);
      } else if (last !== null && daysBetween(last, today) === 1) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }

      const next: Progress = {
        ...current,
        sessions: [
          ...current.sessions.slice(-59),
          { day: today, reviewed, correct, finishedAt: Date.now() },
        ],
        streak: {
          current: currentStreak,
          longest: Math.max(current.streak.longest, currentStreak),
          lastDay: today,
        },
      };
      void saveProgress(next);
      return next;
    });
  }, []);

  const completeLesson = useCallback((lessonKey: string) => {
    setProgress((current) => {
      if (current.completedLessons.includes(lessonKey)) return current;
      const next: Progress = {
        ...current,
        completedLessons: [...current.completedLessons, lessonKey],
      };
      void saveProgress(next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setProgress((current) => {
      if (patch.level) ensureLevel(patch.level);
      const next: Progress = {
        ...current,
        settings: { ...current.settings, ...patch },
      };
      void saveProgress(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    void clearProgress();
    commit(emptyProgress());
  }, [commit]);

  const value = useMemo<StoreValue>(
    () => ({ progress, ready, gradeCard, finishSession, completeLesson, updateSettings, reset }),
    [progress, ready, gradeCard, finishSession, completeLesson, updateSettings, reset]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) {
    throw new Error('useStore должен вызываться внутри StoreProvider');
  }
  return value;
}
