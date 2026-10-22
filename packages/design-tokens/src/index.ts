export const brand = {
  name: "Biti Ivrit",
  nameHe: "ביתי עברית",
  mascot: "Biti",
} as const;

export const color = {
  light: {
    ink: "#1C1917",
    inkSoft: "#44403C",
    sand: "#F6F1E8",
    sandDeep: "#E8DFD0",
    paper: "#FFFCF7",
    pomegranate: "#C23B3B",
    olive: "#3F6B4A",
    indigo: "#2C3D6B",
    gold: "#C4921A",
    line: "#D6CBB8",
    glass: "rgba(255, 252, 247, 0.62)",
    correct: "#2F6B3A",
    incorrect: "#A33B3B",
    almost: "#9A6B12",
  },
  dark: {
    ink: "#F6F1E8",
    inkSoft: "#D6CBB8",
    sand: "#1A1714",
    sandDeep: "#26211C",
    paper: "#221E1A",
    pomegranate: "#E07070",
    olive: "#7DA886",
    indigo: "#9AABD4",
    gold: "#E0B84A",
    line: "#3A332B",
    glass: "rgba(34, 30, 26, 0.62)",
    correct: "#8FCB9A",
    incorrect: "#E07070",
    almost: "#E0B84A",
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
  reading: { family: '"Frank Ruhl Libre", "Noto Sans Hebrew", serif', lineHeight: 1.65 },
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
