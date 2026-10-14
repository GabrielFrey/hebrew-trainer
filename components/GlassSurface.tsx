import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';

import { colorWithAlpha, useGlassMode } from '@/lib/glass';
import { useTheme } from '@/lib/theme';

export function GlassSurface({
  children,
  style,
  contentStyle,
  tintColor,
  interactive = false,
  testID,
  pointerEvents,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  tintColor?: string;
  interactive?: boolean;
  testID?: string;
  pointerEvents?: ViewProps['pointerEvents'];
}) {
  const mode = useGlassMode();
  const { palette, scheme } = useTheme();
  const overlay = tintColor
    ? colorWithAlpha(tintColor, 0.42)
    : scheme === 'dark'
      ? 'rgba(26, 43, 30, 0.55)'
      : 'rgba(255, 255, 255, 0.52)';

  if (mode === 'liquid') {
    return (
      <GlassView
        testID={testID ?? 'glass-liquid'}
        glassEffectStyle="regular"
        tintColor={tintColor}
        isInteractive={interactive}
        colorScheme={scheme}
        style={style}
        pointerEvents={pointerEvents ?? 'box-none'}
      >
        <View style={contentStyle} pointerEvents="box-none">
          {children}
        </View>
      </GlassView>
    );
  }

  if (mode === 'blur') {
    return (
      <BlurView
        testID={testID ?? 'glass-blur'}
        intensity={56}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        style={[style, styles.clip]}
        pointerEvents={pointerEvents ?? 'box-none'}
      >
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: overlay }]}
        />
        <View style={contentStyle} pointerEvents="box-none">
          {children}
        </View>
      </BlurView>
    );
  }

  return (
    <View
      testID={testID ?? 'glass-solid'}
      style={[style, styles.clip, { backgroundColor: tintColor ?? palette.surface }]}
      pointerEvents={pointerEvents}
    >
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
