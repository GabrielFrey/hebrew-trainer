import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { AppText } from '@/components/Themed';
import { usePalette } from '@/lib/theme';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'lg' | 'md';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
}: ButtonProps) {
  const palette = usePalette();

  const background = {
    primary: palette.accent,
    secondary: palette.surfaceAlt,
    ghost: 'transparent',
    danger: palette.danger,
  }[variant];

  const color = {
    primary: palette.accentText,
    secondary: palette.text,
    ghost: palette.accent,
    danger: '#FFFFFF',
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        {
          backgroundColor: background,
          borderColor: variant === 'ghost' ? palette.border : 'transparent',
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      <AppText variant={size === 'lg' ? 'heading' : 'label'} style={{ color }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export type ChoiceState = 'idle' | 'correct' | 'wrong' | 'revealed';

export function ChoiceRow({
  children,
  state,
  onPress,
  disabled,
  testID,
}: {
  children: React.ReactNode;
  state: ChoiceState;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  const palette = usePalette();

  const borderColor = {
    idle: palette.border,
    correct: palette.success,
    wrong: palette.danger,
    revealed: palette.success,
  }[state];

  const backgroundColor = {
    idle: palette.surface,
    correct: `${palette.success}22`,
    wrong: `${palette.danger}22`,
    revealed: `${palette.success}14`,
  }[state];

  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          borderColor,
          backgroundColor,
          borderWidth: state === 'idle' ? StyleSheet.hairlineWidth : 2,
          opacity: pressed && !disabled ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.choiceInner}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg + 2 },
  choice: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  choiceInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
