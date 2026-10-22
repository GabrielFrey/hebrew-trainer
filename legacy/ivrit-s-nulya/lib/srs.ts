import type { CardKind, CardState, Grade } from '@/lib/types';

export const MIN_EASE = 1.3;
export const INITIAL_EASE = 2.5;

const QUALITY: Record<Grade, number> = {
  again: 2,
  hard: 3,
  good: 4,
  easy: 5,
};

export const DAY_MS = 24 * 60 * 60 * 1000;

export function createCard(
  kind: CardKind,
  refId: string,
  now: number = Date.now()
): CardState {
  return {
    id: `${kind}:${refId}`,
    kind,
    refId,
    reps: 0,
    lapses: 0,
    ease: INITIAL_EASE,
    intervalDays: 0,
    dueAt: now,
    introducedAt: now,
    lastReviewedAt: null,
    correct: 0,
    total: 0,
  };
}

/**
 * SM-2 with a hard reset on failure: a wrong answer clears the interval so the
 * card comes back the same session instead of being scheduled for a later day.
 */
export function schedule(card: CardState, grade: Grade, now: number = Date.now()): CardState {
  const quality = QUALITY[grade];
  const passed = grade !== 'again';

  const ease = passed
    ? Math.max(
        MIN_EASE,
        card.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      )
    : Math.max(MIN_EASE, card.ease - 0.2);

  if (!passed) {
    return {
      ...card,
      ease,
      reps: 0,
      lapses: card.lapses + 1,
      intervalDays: 0,
      dueAt: now,
      lastReviewedAt: now,
      total: card.total + 1,
    };
  }

  const reps = card.reps + 1;
  let intervalDays: number;
  if (reps === 1) {
    intervalDays = grade === 'easy' ? 2 : 1;
  } else if (reps === 2) {
    intervalDays = grade === 'hard' ? 3 : 6;
  } else {
    const factor = grade === 'hard' ? Math.max(MIN_EASE, ease - 0.15) : ease;
    intervalDays = Math.max(1, Math.round(card.intervalDays * factor));
  }

  return {
    ...card,
    ease,
    reps,
    intervalDays,
    dueAt: now + intervalDays * DAY_MS,
    lastReviewedAt: now,
    correct: card.correct + 1,
    total: card.total + 1,
  };
}

export function isDue(card: CardState, now: number = Date.now()): boolean {
  return card.dueAt <= now;
}

/** A card is considered learned once it survives to an interval of a week. */
export function isLearned(card: CardState): boolean {
  return card.reps >= 2 && card.intervalDays >= 6;
}

export function accuracy(cards: CardState[]): number | null {
  const total = cards.reduce((sum, c) => sum + c.total, 0);
  if (total === 0) return null;
  const correct = cards.reduce((sum, c) => sum + c.correct, 0);
  return correct / total;
}
