/**
 * Дизайн-система: Duolingo-зелёный + тёплый янтарь для серии и XP.
 * Зелёный выбран потому, что это тренажёр с дорожкой уроков, серией дней
 * и «верно/неверно» — такой язык сразу читается как языковая игра,
 * а не как корпоративный кабинет (синий Mondly).
 */

export type ColorScheme = 'light' | 'dark';

export type Palette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  accentShadow: string;
  success: string;
  successSoft: string;
  successText: string;
  danger: string;
  dangerSoft: string;
  dangerText: string;
  warning: string;
  xp: string;
  heart: string;
  tabInactive: string;
  path: string;
  locked: string;
  overlay: string;
  banner: string;
};

export const palettes: Record<ColorScheme, Palette> = {
  light: {
    background: '#EAF8DE',
    surface: '#FFFFFF',
    surfaceAlt: '#F4F9EE',
    border: '#D7E8C6',
    text: '#1B3A14',
    textMuted: '#5B7354',
    accent: '#58CC02',
    accentText: '#FFFFFF',
    accentShadow: '#46A302',
    success: '#58CC02',
    successSoft: '#D7FFB8',
    successText: '#285C02',
    danger: '#FF4B4B',
    dangerSoft: '#FFDFE0',
    dangerText: '#8A1010',
    warning: '#FF9600',
    xp: '#FFC800',
    heart: '#FF4B4B',
    tabInactive: '#AFBF9F',
    path: '#C9E5A8',
    locked: '#C5D3B8',
    overlay: 'rgba(27, 58, 20, 0.45)',
    banner: '#1CB0F6',
  },
  dark: {
    background: '#102016',
    surface: '#1A2B1E',
    surfaceAlt: '#243628',
    border: '#314A36',
    text: '#F3FBE9',
    textMuted: '#A8BFA0',
    accent: '#7AC70C',
    accentText: '#102016',
    accentShadow: '#4E8A08',
    success: '#7AC70C',
    successSoft: '#234018',
    successText: '#D7FFB8',
    danger: '#FF6B6B',
    dangerSoft: '#4A1C1C',
    dangerText: '#FFD6D6',
    warning: '#FFB020',
    xp: '#FFD84D',
    heart: '#FF6B6B',
    tabInactive: '#6E8068',
    path: '#2A4630',
    locked: '#3A4F3E',
    overlay: 'rgba(0, 0, 0, 0.55)',
    banner: '#1899D6',
  },
};

export const lightPalette = palettes.light;
export const darkPalette = palettes.dark;

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
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  fontFamily: {
    regular: 'Nunito_400Regular',
    semibold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extra: 'Nunito_800ExtraBold',
    hebrew: 'NotoSansHebrew_500Medium',
    hebrewBold: 'NotoSansHebrew_700Bold',
  },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '600' as const },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '800' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
} as const;

export const shadows = {
  card: {
    shadowColor: '#1B3A14',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  hud: {
    shadowColor: '#1B3A14',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;

export const buttonHeight = {
  md: 52,
  lg: 56,
} as const;

export const pressDepth = 4;

export const unitBannerColors = [
  '#1CB0F6',
  '#CE82FF',
  '#FF9600',
  '#FF4B4B',
  '#58CC02',
  '#FFC800',
  '#2B70C9',
  '#FF86D0',
] as const;
