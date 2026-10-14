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

export function useGlassMode(): GlassMode {
  const reduceTransparency = useReduceTransparency();
  const increaseContrast = useIncreaseContrast();
  return resolveGlassMode({
    platform: Platform.OS,
    liquidAvailable: safeLiquid(),
    apiAvailable: safeApi(),
    reduceTransparency,
    increaseContrast,
  });
}

export const MIN_TOUCH = 44;
