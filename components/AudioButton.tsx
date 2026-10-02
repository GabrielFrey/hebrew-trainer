import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { radius, spacing } from '@/constants/theme';
import { AppText } from '@/components/Themed';
import { hasRecording, playRecording } from '@/lib/audio';
import { usePalette } from '@/lib/theme';

/**
 * Озвучка только голосом носителя. Когда файла нет, кнопка неактивна и прямо
 * сообщает «нет записи» — синтез речи не подставляется.
 */
export function AudioButton({
  audio,
  label = 'Прослушать',
  compact = false,
}: {
  audio: string | null | undefined;
  label?: string;
  compact?: boolean;
}) {
  const palette = usePalette();
  const available = hasRecording(audio);

  if (!available) {
    return (
      <View
        accessibilityLabel="Записи носителя пока нет"
        style={[
          styles.base,
          compact ? styles.compact : styles.full,
          { backgroundColor: 'transparent', borderColor: palette.border },
        ]}
      >
        <Feather name="mic-off" size={compact ? 15 : 17} color={palette.textMuted} />
        {compact ? null : (
          <AppText variant="caption" muted>
            нет записи
          </AppText>
        )}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => playRecording(audio)}
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
