import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { resolveTranslation } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import type { UiLanguage } from '@/lib/types';
import { useI18n } from '@/lib/use-i18n';

export function TranslationToggle({ compact = true }: { compact?: boolean }) {
  const palette = usePalette();
  const { t } = useI18n();
  const { progress, updateSettings } = useStore();
  const current = resolveTranslation(progress.settings);

  const setLang = (value: UiLanguage) => {
    if (progress.settings.translationLanguage === value) return;
    updateSettings({ translationLanguage: value });
  };

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t('common.translationToggle')}
      style={[
        styles.row,
        {
          backgroundColor: palette.surfaceAlt,
          borderColor: palette.border,
        },
      ]}
      testID="translation-toggle"
    >
      {(['ru', 'en'] as const).map((value) => {
        const selected = current === value;
        return (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={value === 'ru' ? 'RU' : 'EN'}
            onPress={() => setLang(value)}
            style={({ pressed }) => [
              styles.chip,
              compact ? styles.chipCompact : styles.chipWide,
              {
                backgroundColor: selected ? palette.accent : 'transparent',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            testID={`translation-toggle-${value}`}
          >
            <AppText
              variant="label"
              style={{ color: selected ? palette.accentText : palette.text }}
            >
              {value === 'ru' ? 'RU' : 'EN'}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 2,
  },
  chip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
  },
  chipCompact: {
    minWidth: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipWide: {
    minWidth: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
