import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { AppText } from '@/components/Themed';
import { radius, spacing, typography } from '@/constants/tokens';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

const ROWS = [
  ['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'],
  ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף'],
  ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ'],
];

export function HebrewKeyboard({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const palette = usePalette();
  const { t } = useI18n();

  const push = (ch: string) => {
    if (disabled) return;
    onChange(value + ch);
  };

  return (
    <View style={styles.wrap} testID="hebrew-keyboard">
      <View style={[styles.field, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <Text
          testID="hebrew-typed"
          style={[styles.typed, { color: value ? palette.text : palette.textMuted }]}
        >
          {value || '…'}
        </Text>
      </View>
      {ROWS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((ch) => (
            <Pressable
              key={ch}
              accessibilityLabel={ch}
              disabled={disabled}
              onPress={() => push(ch)}
              style={({ pressed }) => [
                styles.key,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={styles.glyph}>{ch}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <Pressable
          accessibilityLabel={t('keyboard.space')}
          disabled={disabled}
          onPress={() => push(' ')}
          style={({ pressed }) => [
            styles.space,
            { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <AppText variant="caption">{t('keyboard.space')}</AppText>
        </Pressable>
        <Pressable
          accessibilityLabel={t('keyboard.backspace')}
          disabled={disabled}
          onPress={() => onChange(value.slice(0, -1))}
          style={({ pressed }) => [
            styles.key,
            { backgroundColor: palette.surfaceAlt, borderColor: palette.border, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Feather name="delete" size={16} color={palette.text} />
        </Pressable>
        <Pressable
          accessibilityLabel={t('session.retry')}
          disabled={disabled}
          onPress={() => onChange('')}
          style={({ pressed }) => [
            styles.key,
            { backgroundColor: palette.surfaceAlt, borderColor: palette.border, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Feather name="x" size={16} color={palette.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  field: {
    borderRadius: radius.md,
    borderWidth: 2,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  typed: {
    fontFamily: typography.fontFamily.hebrew,
    fontSize: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  key: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 2,
    height: 42,
    justifyContent: 'center',
    minWidth: 32,
    paddingHorizontal: 6,
  },
  space: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 2,
    flex: 1,
    height: 42,
    justifyContent: 'center',
  },
  glyph: {
    fontFamily: typography.fontFamily.hebrew,
    fontSize: 20,
  },
});
