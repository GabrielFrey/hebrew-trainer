import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextProps, TextStyle, ViewProps, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, shadows, spacing, tabBarInset, typography } from '@/constants/tokens';
import { usePalette } from '@/lib/theme';

type TextVariant = 'title' | 'heading' | 'body' | 'label' | 'caption';

const variantStyles: Record<TextVariant, TextStyle> = {
  title: { ...typography.title, fontFamily: typography.fontFamily.extra },
  heading: { ...typography.heading, fontFamily: typography.fontFamily.bold },
  body: { ...typography.body, fontFamily: typography.fontFamily.semibold },
  label: { ...typography.label, fontFamily: typography.fontFamily.extra },
  caption: { ...typography.caption, fontFamily: typography.fontFamily.semibold },
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
      allowFontScaling
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[variantStyles[variant], { color: muted ? palette.textMuted : toneColor }, style]}
    />
  );
}

export function Screen({
  children,
  style,
  edges = ['top', 'left', 'right'],
  tabBar = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  tabBar?: boolean;
}) {
  const palette = usePalette();
  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={[styles.screenInner, tabBar && { paddingBottom: tabBarInset }, style]}>{children}</View>
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
        shadows.card,
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
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
});
