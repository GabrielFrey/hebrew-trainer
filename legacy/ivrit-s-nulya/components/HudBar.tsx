import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppSymbol } from '@/components/AppSymbol';
import { GlassSurface } from '@/components/GlassSurface';
import { AppText } from '@/components/Themed';
import { TranslationToggle } from '@/components/TranslationToggle';
import { radius, spacing } from '@/constants/tokens';
import { resolveTranslation } from '@/lib/i18n';
import { MIN_TOUCH } from '@/lib/glass';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';
import { totalXp } from '@/lib/xp';

export function HudBar() {
  const palette = usePalette();
  const router = useRouter();
  const { progress } = useStore();
  const { t } = useI18n();
  const streak = progress.streak.current;
  const xp = totalXp(progress);
  const flag = resolveTranslation(progress.settings) === 'en' ? 'EN' : 'RU';

  return (
    <GlassSurface
      testID="glass-hud"
      style={[styles.rowWrap, { borderColor: palette.border }]}
      contentStyle={styles.row}
    >
      <HudChip
        color={palette.warning}
        emoji="🔥"
        label={String(streak)}
        a11y={t('hud.streak', { count: streak })}
      />
      <HudChip
        color={palette.xp}
        sf="star.fill"
        fallback="star"
        label={String(xp)}
        a11y={t('hud.xp', { count: xp })}
      />
      <View style={styles.flag} accessibilityLabel={t('hud.flag', { code: flag })}>
        <TranslationToggle />
      </View>
      <Pressable
        accessibilityLabel={t('common.settings')}
        accessibilityRole="button"
        onPress={() => router.push('/settings')}
        hitSlop={6}
        style={[styles.gear, { backgroundColor: palette.surfaceAlt }]}
      >
        <AppSymbol sf="gearshape" fallback="settings" size={20} color={palette.text} />
      </Pressable>
    </GlassSurface>
  );
}

function HudChip({
  color,
  sf,
  fallback,
  emoji,
  label,
  a11y,
}: {
  color: string;
  sf?: 'star.fill';
  fallback?: 'star';
  emoji?: string;
  label: string;
  a11y: string;
}) {
  return (
    <View accessibilityLabel={a11y} style={styles.chip}>
      {emoji ? (
        <AppText variant="label">{emoji}</AppText>
      ) : sf && fallback ? (
        <AppSymbol sf={sf} fallback={fallback} size={16} color={color} />
      ) : null}
      <AppText variant="label" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  flag: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.xs, justifyContent: 'flex-end' },
  gear: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: MIN_TOUCH,
    justifyContent: 'center',
    width: MIN_TOUCH,
  },
});
