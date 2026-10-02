import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette } from '@/constants/theme';
import type { Palette } from '@/constants/theme';
import { useStore } from '@/lib/store';

type ThemeValue = {
  palette: Palette;
  scheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeValue>({ palette: lightPalette, scheme: 'light' });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const { progress } = useStore();
  const preference = progress.settings.theme;

  const value = useMemo<ThemeValue>(() => {
    const resolved =
      preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
    return {
      scheme: resolved,
      palette: resolved === 'dark' ? darkPalette : lightPalette,
    };
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

export function usePalette(): Palette {
  return useContext(ThemeContext).palette;
}
