import { Platform } from 'react-native';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

import { useIncreaseContrast, useReduceTransparency } from '@/lib/a11y';

export type GlassMode = 'liquid' | 'blur' | 'solid';

function safeLiquid(): boolean {
  try {
    return typeof isLiquidGlassAvailable === 'function' && isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

function safeApi(): boolean {
  try {
    if (typeof isGlassEffectAPIAvailable !== 'function') return true;
    return isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
}

export function resolveGlassMode({
  platform,
  liquidAvailable,
  apiAvailable,
  reduceTransparency,
  increaseContrast,
}: {
  platform: typeof Platform.OS;
  liquidAvailable: boolean;
  apiAvailable: boolean;
  reduceTransparency: boolean;
  increaseContrast: boolean;
}): GlassMode {
  if (reduceTransparency || increaseContrast) return 'solid';
  if (platform === 'ios' && liquidAvailable && apiAvailable) return 'liquid';
  return 'blur';
}

function overrideFromQuery(): GlassMode | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const value = new URLSearchParams(window.location.search).get('glass');
    if (value === 'solid' || value === 'blur' || value === 'liquid') return value;
  } catch {
    return null;
  }
  return null;
}

export function useGlassMode(): GlassMode {
  const reduceTransparency = useReduceTransparency();
  const increaseContrast = useIncreaseContrast();
  return (
    overrideFromQuery() ??
    resolveGlassMode({
      platform: Platform.OS,
      liquidAvailable: safeLiquid(),
      apiAvailable: safeApi(),
      reduceTransparency,
      increaseContrast,
    })
  );
}

export const MIN_TOUCH = 44;

/** Hex (#rgb / #rrggbb) → rgba for blur overlays. Liquid Glass tints stay opaque. */
export function colorWithAlpha(color: string, alpha: number): string {
  const raw = color.trim();
  if (raw.startsWith('rgba') || raw.startsWith('rgb(')) return raw;
  let hex = raw.startsWith('#') ? raw.slice(1) : raw;
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (hex.length !== 6) return raw;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
