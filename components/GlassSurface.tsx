import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';

import { useGlassMode } from '@/lib/glass';
import { useTheme } from '@/lib/theme';

export function GlassSurface({
  children,
  style,
  contentStyle,
  tintColor,
  interactive = false,
  testID,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  tintColor?: string;
  interactive?: boolean;
  testID?: string;
}) {
  const mode = useGlassMode();
  const { palette, scheme } = useTheme();
  const overlay =
    tintColor ?? (scheme === 'dark' ? 'rgba(26, 43, 30, 0.78)' : 'rgba(255, 255, 255, 0.78)');

  if (mode === 'liquid') {
    return (
      <GlassView
        testID={testID ?? 'glass-liquid'}
        glassEffectStyle="regular"
        tintColor={tintColor}
        isInteractive={interactive}
        colorScheme={scheme}
        style={style}
      >
        <View style={contentStyle}>{children}</View>
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
      >
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: overlay }]}
        />
        <View style={contentStyle}>{children}</View>
      </BlurView>
    );
  }

  return (
    <View
      testID={testID ?? 'glass-solid'}
      style={[style, styles.clip, { backgroundColor: tintColor ?? palette.surface }]}
    >
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
