import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

function webMedia(query: string): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

function subscribeMedia(query: string, onChange: (value: boolean) => void): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return () => undefined;
  const mq = window.matchMedia(query);
  const listener = (event: MediaQueryListEvent) => onChange(event.matches);
  mq.addEventListener('change', listener);
  return () => mq.removeEventListener('change', listener);
}

export function useReduceMotion(): boolean {
  const [value, setValue] = useState(() => webMedia('(prefers-reduced-motion: reduce)'));

  useEffect(() => {
    if (Platform.OS === 'web') {
      return subscribeMedia('(prefers-reduced-motion: reduce)', setValue);
    }
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((next) => {
      if (alive) setValue(next);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setValue);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return value;
}

export function useReduceTransparency(): boolean {
  const [value, setValue] = useState(() => webMedia('(prefers-reduced-transparency: reduce)'));

  useEffect(() => {
    if (Platform.OS === 'web') {
      return subscribeMedia('(prefers-reduced-transparency: reduce)', setValue);
    }
    let alive = true;
    if (typeof AccessibilityInfo.isReduceTransparencyEnabled === 'function') {
      void AccessibilityInfo.isReduceTransparencyEnabled().then((next) => {
        if (alive) setValue(next);
      });
    }
    const sub =
      typeof AccessibilityInfo.addEventListener === 'function'
        ? AccessibilityInfo.addEventListener('reduceTransparencyChanged' as 'reduceMotionChanged', setValue)
        : null;
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);

  return value;
}

export function useIncreaseContrast(): boolean {
  const [value, setValue] = useState(() =>
    webMedia('(prefers-contrast: more)') || webMedia('(prefers-contrast: high)')
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      return subscribeMedia('(prefers-contrast: more)', setValue);
    }
    let alive = true;
    const api = AccessibilityInfo as AccessibilityInfo & {
      isHighTextContrastEnabled?: () => Promise<boolean>;
    };
    if (typeof api.isHighTextContrastEnabled === 'function') {
      void api.isHighTextContrastEnabled().then((next) => {
        if (alive) setValue(next);
      });
    }
    return () => {
      alive = false;
    };
  }, []);

  return value;
}
