import { Platform, StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

import { hebrewFontSizes } from '@/constants/theme';
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
 * Hebrew is always laid out right-to-left and never smaller than 32pt.
 * `writingDirection` keeps punctuation on the correct side on iOS; the explicit
 * RLM-free approach relies on the platform bidi algorithm elsewhere.
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
  const fontSize = typeof size === 'number' ? Math.max(32, size) : hebrewFontSizes[size];

  return (
    <Text
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
    fontWeight: '500',
    ...Platform.select({
      ios: { fontFamily: 'Arial Hebrew' },
      default: {},
    }),
  },
});
