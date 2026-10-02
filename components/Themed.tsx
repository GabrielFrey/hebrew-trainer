import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextProps, TextStyle, ViewProps, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing } from '@/constants/theme';
import { usePalette } from '@/lib/theme';

type TextVariant = 'title' | 'heading' | 'body' | 'label' | 'caption';

const variantStyles: Record<TextVariant, TextStyle> = {
  title: { fontSize: 30, fontWeight: '700', lineHeight: 36 },
  heading: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 23 },
  label: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  caption: { fontSize: 13, lineHeight: 18 },
};

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  muted?: boolean;
  tone?: 'default' | 'accent' | 'success' | 'danger';
};

export function AppText({
  variant = 'body',
  muted = false,
  tone = 'default',
  style,
  ...rest
}: AppTextProps) {
  const palette = usePalette();
  const toneColor = {
    default: palette.text,
    accent: palette.accent,
    success: palette.success,
    danger: palette.danger,
  }[tone];

  return (
    <Text
      {...rest}
      style={[variantStyles[variant], { color: muted ? palette.textMuted : toneColor }, style]}
    />
  );
}

export function Screen({
  children,
  style,
  edges = ['top', 'left', 'right'],
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const palette = usePalette();
  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={[styles.screenInner, style]}>{children}</View>
    </SafeAreaView>
  );
}

export type SurfaceProps = ViewProps & {
  tone?: 'surface' | 'alt';
  padded?: boolean;
};

export function Surface({ tone = 'surface', padded = true, style, ...rest }: SurfaceProps) {
  const palette = usePalette();
  return (
    <View
      {...rest}
      style={[
        styles.surface,
        {
          backgroundColor: tone === 'alt' ? palette.surfaceAlt : palette.surface,
          borderColor: palette.border,
          padding: padded ? spacing.lg : 0,
        },
        style,
      ]}
    />
  );
}

export function Divider() {
  const palette = usePalette();
  return <View style={[styles.divider, { backgroundColor: palette.border }]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenInner: { flex: 1 },
  surface: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
});
