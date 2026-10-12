import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { AppText } from '@/components/Themed';
import { radius, spacing } from '@/constants/tokens';
import { usePalette } from '@/lib/theme';

export function ScreenHeader({
  title,
  subtitle,
  action,
  extra,
}: {
  title: string;
  subtitle?: string;
  action?: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void };
  extra?: ReactNode;
}) {
  const palette = usePalette();
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? <AppText muted>{subtitle}</AppText> : null}
      </View>
      {extra || action ? (
        <View style={styles.trailing}>
          {extra}
          {action ? (
            <Pressable
              accessibilityLabel={action.label}
              accessibilityRole="button"
              hitSlop={10}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: palette.surface, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name={action.icon} size={18} color={palette.text} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  titles: { flex: 1, gap: 2 },
  trailing: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  action: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
