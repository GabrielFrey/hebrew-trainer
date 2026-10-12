import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/Themed';
import { TranslationToggle } from '@/components/TranslationToggle';
import { radius, shadows, spacing } from '@/constants/tokens';
import { resolveTranslation } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';
import { totalXp } from '@/lib/xp';

export function HudBar({ hearts = 5 }: { hearts?: number }) {
  const palette = usePalette();
  const router = useRouter();
  const { progress } = useStore();
  const { t } = useI18n();
  const streak = progress.streak.current;
  const xp = totalXp(progress);
  const flag = resolveTranslation(progress.settings) === 'en' ? 'EN' : 'RU';

  return (
    <View style={[styles.row, shadows.hud, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <HudChip
        color={palette.warning}
        emoji="🔥"
        label={String(streak)}
        a11y={t('hud.streak', { count: streak })}
      />
      <HudChip color={palette.xp} icon="star" label={String(xp)} a11y={t('hud.xp', { count: xp })} />
      <HudChip
        color={palette.heart}
        icon="heart"
        label={String(hearts)}
        a11y={t('hud.hearts', { count: hearts })}
      />
      <View style={styles.flag} accessibilityLabel={t('hud.flag', { code: flag })}>
        <TranslationToggle />
      </View>
      <Pressable
        accessibilityLabel={t('common.settings')}
        accessibilityRole="button"
        onPress={() => router.push('/settings')}
        hitSlop={8}
        style={[styles.gear, { backgroundColor: palette.surfaceAlt }]}
      >
        <Feather name="settings" size={18} color={palette.text} />
      </Pressable>
    </View>
  );
}

function HudChip({
  color,
  icon,
  emoji,
  label,
  a11y,
}: {
  color: string;
  icon?: keyof typeof Feather.glyphMap;
  emoji?: string;
  label: string;
  a11y: string;
}) {
  return (
    <View accessibilityLabel={a11y} style={styles.chip}>
      {emoji ? (
        <AppText variant="label">{emoji}</AppText>
      ) : icon ? (
        <Feather name={icon} size={16} color={color} />
      ) : null}
      <AppText variant="label" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  flag: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.xs, justifyContent: 'flex-end' },
  gear: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
