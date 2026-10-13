import { dayKey } from '@/lib/dates';
import type { CardState, NikudMode, Settings } from '@/lib/types';

export type NikudContext = {
  card?: CardState | null;
  id?: string;
  revealed?: boolean;
  now?: number;
};

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Насколько слово «выучено» по SM-2: 0 — новое, 1 — длинный интервал.
 * Чем выше, тем чаще адаптивный режим прячет никуд.
 */
export function nikudStrength(card: CardState | null | undefined): number {
  if (!card || card.reps <= 0) return 0;
  const fromReps = Math.min(1, card.reps / 6);
  const fromInterval = Math.min(1, card.intervalDays / 30);
  const fromEase = Math.min(1, Math.max(0, (card.ease - 1.3) / 1.7));
  return Math.min(1, fromReps * 0.45 + fromInterval * 0.45 + fromEase * 0.1);
}

export function resolveNikudMode(settings: Pick<Settings, 'nikudMode' | 'showNikud'>): NikudMode {
  if (settings.nikudMode === 'always' || settings.nikudMode === 'adaptive' || settings.nikudMode === 'never') {
    return settings.nikudMode;
  }
  return settings.showNikud === false ? 'never' : 'always';
}

/**
 * Показывать ли огласовки сейчас. В адаптивном режиме решение стабильно
 * в пределах календарного дня, чтобы слово не мерцало при перерисовке.
 */
export function shouldShowNikud(settings: Settings, context: NikudContext = {}): boolean {
  if (context.revealed) return true;
  const mode = resolveNikudMode(settings);
  if (mode === 'always') return true;
  if (mode === 'never') return false;

  const strength = nikudStrength(context.card);
  if (strength <= 0) return true;

  const key = `${context.id ?? context.card?.id ?? 'x'}|${dayKey(context.now ?? Date.now())}`;
  const roll = hashSeed(key) % 1000;
  // P(без никуда) = strength. Новое слово — всегда с огласовками.
  return roll >= Math.round(strength * 1000);
}

export function hebrewByNikud(
  item: { hebrew: string; nikud: string },
  settings: Settings,
  context: NikudContext = {}
): string {
  return shouldShowNikud(settings, context) ? item.nikud : item.hebrew;
}
