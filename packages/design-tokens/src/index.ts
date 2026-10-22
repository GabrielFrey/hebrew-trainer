export const brand = {
  name: "Biti Ivrit",
  nameHe: "ביתי עברית",
  mascot: "Biti",
} as const;

/**
 * Palette decided in docs/color-research.md.
 * Semantic aliases (primary/success/error) sit beside legacy token names
 * (indigo/olive/pomegranate) so existing class names keep working.
 */
export const color = {
  light: {
    ink: "#142033",
    inkSoft: "#3A4A5E",
    sand: "#EEF2F7",
    sandDeep: "#E2E8F0",
    paper: "#FFFFFF",
    pomegranate: "#9A3412",
    olive: "#0C5F58",
    indigo: "#184A82",
    gold: "#854D0E",
    line: "#6B7787",
    glass: "rgba(255, 255, 255, 0.86)",
    correct: "#0C5F58",
    incorrect: "#9A3412",
    almost: "#854D0E",
    correctBg: "#D7EDEA",
    incorrectBg: "#FFEDD5",
    almostBg: "#FEF3C7",
    primary: "#184A82",
    secondary: "#5A4A9A",
    accent: "#7C3AED",
    success: "#0C5F58",
    error: "#9A3412",
    warning: "#854D0E",
  },
  dark: {
    ink: "#E8EEF6",
    inkSoft: "#B8C4D4",
    sand: "#101820",
    sandDeep: "#182230",
    paper: "#1A2432",
    pomegranate: "#F0A36A",
    olive: "#5EEAD4",
    indigo: "#8BB6EA",
    gold: "#FCD34D",
    line: "#8AA0B5",
    glass: "rgba(26, 36, 50, 0.86)",
    correct: "#5EEAD4",
    incorrect: "#FDBA74",
    almost: "#FCD34D",
    correctBg: "#134E4A",
    incorrectBg: "#7C2D12",
    almostBg: "#78350F",
    primary: "#8BB6EA",
    secondary: "#C4B5FD",
    accent: "#C4B5FD",
    success: "#5EEAD4",
    error: "#FDBA74",
    warning: "#FCD34D",
  },
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 32,
  pill: 999,
} as const;

export const type = {
  ui: { family: "Source Serif 4, Georgia, serif", body: "16px", heading: "28px" },
  hebrew: { family: '"Noto Sans Hebrew", "Frank Ruhl Libre", sans-serif', minPx: 32 },
  reading: { family: '"Frank Ruhl Libre", "Noto Sans Hebrew", serif', lineHeight: 1.75 },
} as const;

export const motion = {
  fast: "140ms",
  med: "220ms",
  reduce: "0ms",
} as const;

export const xp = {
  exercise: 10,
  perfectBonus: 15,
  hintMultiplier: [1, 0.7, 0.4, 0.2],
  dailyGoal: 50,
} as const;

export const srsStepsDays = [1, 3, 7, 14, 30] as const;
export const heartsMax = 5;
export const heartsRegenMinutes = 30;
