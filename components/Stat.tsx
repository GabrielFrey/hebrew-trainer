import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/Themed';
import { radius, shadows, spacing } from '@/constants/tokens';
import { usePalette } from '@/lib/theme';

export function StatTile({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.tile,
        shadows.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <AppText variant="title">{value}</AppText>
      <AppText variant="label" muted>
        {label}
      </AppText>
      {hint ? (
        <AppText variant="caption" muted>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export function ProgressBar({
  value,
  total,
  tone = 'accent',
}: {
  value: number;
  total: number;
  tone?: 'accent' | 'success';
}) {
  const palette = usePalette();
  const ratio = total <= 0 ? 0 : Math.min(1, Math.max(0, value / total));
  return (
    <View
      style={[styles.track, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: value }}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${ratio * 100}%`,
            backgroundColor: tone === 'success' ? palette.success : palette.accent,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.md,
    borderWidth: 2,
    flexBasis: 140,
    flexGrow: 1,
    gap: 2,
    padding: spacing.lg,
  },
  track: {
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 16,
    overflow: 'hidden',
    width: '100%',
  },
  fill: { borderRadius: radius.pill, height: '100%' },
});
