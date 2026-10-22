import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { GlassSurface } from '@/components/GlassSurface';
import { AppText } from '@/components/Themed';
import { buttonHeight, pressDepth, radius, spacing } from '@/constants/tokens';
import { useGlassMode } from '@/lib/glass';
import { useReduceMotion } from '@/lib/motion';
import { usePalette } from '@/lib/theme';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'lg' | 'md';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Glass chrome for Check/Continue. Content buttons stay solid. */
  glass?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  accessibilityLabel,
  glass = false,
}: ButtonProps) {
  const palette = usePalette();
  const reduceMotion = useReduceMotion();
  const glassMode = useGlassMode();
  const pressed = useSharedValue(0);
  const useGlass = glass && glassMode !== 'solid' && variant !== 'ghost';

  const face = {
    primary: palette.accent,
    secondary: palette.surface,
    ghost: 'transparent',
    danger: palette.danger,
    success: palette.success,
  }[variant];

  const shadow = {
    primary: palette.accentShadow,
    secondary: palette.border,
    ghost: 'transparent',
    danger: '#C62828',
    success: palette.accentShadow,
  }[variant];

  const color = {
    primary: palette.accentText,
    secondary: palette.text,
    ghost: palette.accent,
    danger: '#FFFFFF',
    success: palette.accentText,
  }[variant];

  const shift = useAnimatedStyle(() => ({
    transform: [{ translateY: reduceMotion ? 0 : pressed.value * pressDepth }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = reduceMotion ? 0 : withSpring(1, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        pressed.value = reduceMotion ? withTiming(0, { duration: 1 }) : withSpring(0, { damping: 16, stiffness: 280 });
      }}
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      {useGlass ? (
        <Animated.View style={[styles.shadow, shift, size === 'lg' ? styles.lg : styles.md]}>
          <GlassSurface
            tintColor={face}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.glassFace} pointerEvents="none">
            <AppText variant="label" style={{ color, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {label}
            </AppText>
          </View>
        </Animated.View>
      ) : (
        <View
          style={[
            styles.shadow,
            {
              backgroundColor: variant === 'ghost' ? 'transparent' : shadow,
              paddingBottom: variant === 'ghost' ? 0 : pressDepth,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.face,
              size === 'lg' ? styles.lg : styles.md,
              {
                backgroundColor: face,
                borderColor: variant === 'ghost' ? palette.border : 'transparent',
                borderWidth: variant === 'ghost' || variant === 'secondary' ? 2 : 0,
              },
              shift,
            ]}
          >
            <AppText variant="label" style={{ color, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {label}
            </AppText>
          </Animated.View>
        </View>
      )}
    </Pressable>
  );
}

export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong' | 'revealed';

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
  const reduceMotion = useReduceMotion();
  const pressed = useSharedValue(0);

  const borderColor = {
    idle: palette.border,
    selected: palette.banner,
    correct: palette.success,
    wrong: palette.danger,
    revealed: palette.success,
  }[state];

  const backgroundColor = {
    idle: palette.surface,
    selected: `${palette.banner}22`,
    correct: palette.successSoft,
    wrong: palette.dangerSoft,
    revealed: palette.successSoft,
  }[state];

  const shift = useAnimatedStyle(() => ({
    transform: [{ translateY: reduceMotion ? 0 : pressed.value * 3 }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: state === 'selected' || state === 'correct' }}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = reduceMotion ? 0 : withSpring(1, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        pressed.value = reduceMotion ? withTiming(0, { duration: 1 }) : withSpring(0, { damping: 16, stiffness: 280 });
      }}
    >
      <View style={[styles.choiceShadow, { backgroundColor: borderColor }]}>
        <Animated.View style={[styles.choice, { backgroundColor, borderColor }, shift]}>
          <View style={styles.choiceInner}>{children}</View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.md,
  },
  face: {
    alignItems: 'center',
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  md: { minHeight: buttonHeight.md, paddingHorizontal: spacing.lg },
  lg: { minHeight: buttonHeight.lg, paddingHorizontal: spacing.xl },
  glassFace: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  choiceShadow: {
    borderRadius: radius.md,
    paddingBottom: 3,
  },
  choice: {
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 4,
  },
  choiceInner: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
});
