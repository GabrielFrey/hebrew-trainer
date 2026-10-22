import { useColorScheme } from "react-native";
import { color, radius, space } from "@biti/design-tokens";

export type Palette = (typeof color)["light"] | (typeof color)["dark"];

export function usePalette(): Palette {
  const scheme = useColorScheme();
  return scheme === "dark" ? color.dark : color.light;
}

export const layout = {
  space,
  radius,
  hebrewSize: 32,
} as const;
