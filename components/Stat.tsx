import { StyleSheet, View } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { AppText } from '@/components/Themed';
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
    <View style={[styles.track, { backgroundColor: palette.surfaceAlt }]}>
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
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    flexBasis: 140,
    gap: 2,
    padding: spacing.lg,
  },
  track: {
    borderRadius: radius.pill,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  fill: { borderRadius: radius.pill, height: '100%' },
});
