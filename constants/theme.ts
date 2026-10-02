export type Palette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  success: string;
  danger: string;
  warning: string;
  tabInactive: string;
};

export const lightPalette: Palette = {
  background: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEBE1',
  border: '#DFD8C9',
  text: '#1B1A17',
  textMuted: '#6E6A60',
  accent: '#1F6F8B',
  accentText: '#FFFFFF',
  success: '#2E7D53',
  danger: '#B3261E',
  warning: '#9A6700',
  tabInactive: '#9A948A',
};

export const darkPalette: Palette = {
  background: '#121310',
  surface: '#1C1E1A',
  surfaceAlt: '#262924',
  border: '#343830',
  text: '#F2F1EC',
  textMuted: '#A3A099',
  accent: '#6FC2DC',
  accentText: '#07222B',
  success: '#7BD1A0',
  danger: '#F2998F',
  warning: '#E5B567',
  tabInactive: '#6B6E66',
};

/** Hebrew is never rendered below 32pt, per the learning requirements. */
export const hebrewFontSizes = {
  inline: 32,
  card: 56,
  glyph: 96,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;
