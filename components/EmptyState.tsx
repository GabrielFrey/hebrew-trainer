import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import type { MascotPose } from '@/components/Mascot';
import { AppText } from '@/components/Themed';
import { spacing } from '@/constants/tokens';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  pose = 'think',
}: {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  pose?: MascotPose;
}) {
  return (
    <View style={styles.wrap}>
      <Mascot pose={pose} size={132} />
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
  centered: { textAlign: 'center' },
  action: { marginTop: spacing.lg, minWidth: 200 },
});
