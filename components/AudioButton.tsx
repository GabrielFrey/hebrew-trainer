import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { radius, spacing } from '@/constants/tokens';
import { AppText } from '@/components/Themed';
import { hasRecording, playRecording } from '@/lib/audio';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

/**
 * Сначала запись носителя, иначе заранее сгенерированный нейроголос.
 * Когда файла нет, кнопка неактивна и прямо сообщает «нет записи» —
 * синтеза на устройстве нет.
 */
export function AudioButton({
  audio,
  label,
  compact = false,
}: {
  audio: string | null | undefined;
  label?: string;
  compact?: boolean;
}) {
  const palette = usePalette();
  const { t } = useI18n();
  const listenLabel = label ?? t('common.listen');
  const available = hasRecording(audio);

  if (!available) {
    return (
      <View
        accessibilityLabel={t('common.recordMissingA11y')}
        style={[
          styles.base,
          compact ? styles.compact : styles.full,
          { backgroundColor: 'transparent', borderColor: palette.border, borderWidth: 2 },
        ]}
      >
        <Feather name="mic-off" size={compact ? 15 : 17} color={palette.textMuted} />
        {compact ? null : (
          <AppText variant="caption" muted>
            {t('common.recordMissing')}
          </AppText>
        )}
      </View>
    );
  }

  return (
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
