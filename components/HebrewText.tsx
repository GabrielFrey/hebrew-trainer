import { StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

import { hebrewFontSizes, typography } from '@/constants/tokens';
import { usePalette } from '@/lib/theme';

export type HebrewTextProps = {
  children: string;
  size?: keyof typeof hebrewFontSizes | number;
  muted?: boolean;
  align?: 'right' | 'center';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

/**
 * Иврит всегда RTL и не меньше 32 pt. Интерфейс при этом остаётся LTR.
 */
export function HebrewText({
  children,
  size = 'inline',
  muted = false,
  align = 'right',
  style,
  numberOfLines,
}: HebrewTextProps) {
  const palette = usePalette();
  const fontSize = typeof size === 'number' ? Math.max(28, size) : hebrewFontSizes[size];

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={1.35}
      numberOfLines={numberOfLines}
      style={[
        styles.base,
        {
          fontSize,
          lineHeight: Math.round(fontSize * 1.45),
          color: muted ? palette.textMuted : palette.text,
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    writingDirection: 'rtl',
    fontFamily: typography.fontFamily.hebrew,
    fontWeight: '500',
  },
});
