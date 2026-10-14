import { Feather } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'expo-symbols';

export function AppSymbol({
  sf,
  fallback,
  size,
  color,
}: {
  sf: SFSymbol;
  fallback: keyof typeof Feather.glyphMap;
  size: number;
  color: string;
}) {
  return (
    <SymbolView
      name={sf}
      size={size}
      tintColor={color}
      weight="semibold"
      fallback={<Feather name={fallback} size={size} color={color} />}
    />
  );
}
