import { dayKey, daysBetween } from '@/lib/dates';
import type { Progress, Streak } from '@/lib/types';

export function freezeCount(streak: Streak): number {
  return typeof streak.freezes === 'number' ? streak.freezes : 1;
}

export function streakStatus(
  progress: Progress,
  today = dayKey()
): { current: number; kind: 'active' | 'fresh' | 'frozen' | 'broken' } {
  const { streak } = progress;
  if (!streak.lastDay) return { current: 0, kind: 'fresh' };
  if (streak.lastDay === today) return { current: Math.max(1, streak.current), kind: 'active' };
  const gap = daysBetween(streak.lastDay, today);
  if (gap === 1) return { current: streak.current, kind: 'active' };
  if (gap === 2 && freezeCount(streak) > 0) {
    return { current: streak.current, kind: 'frozen' };
  }
  if (streak.current <= 0) return { current: 0, kind: 'fresh' };
  return { current: 0, kind: 'broken' };
}

export function applyStreak(progress: Progress, today: string): Streak {
  const last = progress.streak.lastDay;
  let current = progress.streak.current;
  let freezes = freezeCount(progress.streak);
  if (last === today) {
    current = Math.max(1, current);
  } else if (last !== null && daysBetween(last, today) === 1) {
    current += 1;
  } else if (last !== null && daysBetween(last, today) === 2 && freezes > 0) {
    current += 1;
    freezes -= 1;
  } else {
    current = 1;
  }
  return {
    current,
    longest: Math.max(progress.streak.longest, current),
    lastDay: today,
    freezes,
  };
}
