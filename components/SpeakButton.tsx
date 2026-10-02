import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { radius, spacing } from '@/constants/theme';
import { AppText } from '@/components/Themed';
import { speak } from '@/lib/speech';
import { usePalette } from '@/lib/theme';

export function SpeakButton({
  text,
  label = 'Прослушать',
  compact = false,
}: {
  text: string;
  label?: string;
  compact?: boolean;
}) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityLabel={`${label}: ${text}`}
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => speak(text)}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.full,
        {
          backgroundColor: palette.surfaceAlt,
          borderColor: palette.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Feather name="volume-2" size={compact ? 16 : 18} color={palette.accent} />
      {compact ? null : (
        <AppText variant="label" tone="accent">
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  full: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
  compact: { height: 36, justifyContent: 'center', width: 36 },
});
