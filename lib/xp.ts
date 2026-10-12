import type { Progress } from '@/lib/types';

/** Очки только считаются из уже сохранённого прогресса, ничего не пишем. */
export function totalXp(progress: Progress): number {
  const fromLessons = progress.completedLessons.length * 15;
  const fromReviews = progress.sessions.reduce((sum, session) => sum + session.correct * 5, 0);
  return fromLessons + fromReviews;
}

export function lessonXp(correct: number, total: number): number {
  const safeTotal = Math.max(1, total);
  const accuracy = correct / safeTotal;
  return 10 + correct * 5 + (accuracy >= 0.8 ? 10 : 0);
}
