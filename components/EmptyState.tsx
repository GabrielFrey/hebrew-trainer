import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { spacing } from '@/constants/theme';
import { AppText } from '@/components/Themed';
import { Button } from '@/components/Button';
import { usePalette } from '@/lib/theme';

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const palette = usePalette();
  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, { backgroundColor: palette.surfaceAlt }]}>
        <Feather name={icon} size={26} color={palette.textMuted} />
      </View>
      <AppText variant="heading" style={styles.centered}>
        {title}
      </AppText>
      {description ? (
        <AppText muted style={styles.centered}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 56,
  },
  centered: { textAlign: 'center' },
  action: { marginTop: spacing.lg },
});
