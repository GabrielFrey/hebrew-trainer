import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { radius, spacing } from '@/constants/tokens';
import { AppText } from '@/components/Themed';
import { hasRecording, playRecording, SLOW_PLAYBACK_RATE } from '@/lib/audio';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

/**
 * Сначала запись носителя, иначе заранее сгенерированный нейроголос.
 * Когда файла нет, кнопки нет — синтеза на устройстве нет.
 */
export function AudioButton({
  audio,
  label,
  compact = false,
  slow = true,
}: {
  audio: string | null | undefined;
  label?: string;
  compact?: boolean;
  slow?: boolean;
}) {
  const palette = usePalette();
  const { t } = useI18n();
  const listenLabel = label ?? t('common.listen');
  const available = hasRecording(audio);

  if (!available) return null;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={listenLabel}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => playRecording(audio)}
        style={({ pressed }) => [
          styles.base,
          compact ? styles.compact : styles.full,
          {
            backgroundColor: palette.accent,
            borderColor: palette.accentShadow,
            borderWidth: 2,
            opacity: pressed ? 0.88 : 1,
            transform: [{ translateY: pressed ? 2 : 0 }],
          },
        ]}
      >
        <Feather name="volume-2" size={compact ? 16 : 18} color={palette.accentText} />
        {compact ? null : (
          <AppText variant="label" style={{ color: palette.accentText }}>
            {listenLabel}
          </AppText>
        )}
      </Pressable>
      {slow ? (
        <Pressable
          accessibilityLabel={t('common.listenSlow')}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => playRecording(audio, { rate: SLOW_PLAYBACK_RATE })}
          style={({ pressed }) => [
            styles.base,
            compact ? styles.compact : styles.full,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              borderWidth: 2,
              opacity: pressed ? 0.88 : 1,
              transform: [{ translateY: pressed ? 2 : 0 }],
            },
          ]}
        >
          <Feather name="rewind" size={compact ? 15 : 17} color={palette.text} />
          {compact ? null : (
            <AppText variant="label">{t('common.listenSlow')}</AppText>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
