import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AudioButton } from '@/components/AudioButton';
import { EmptyState } from '@/components/EmptyState';
import { HebrewText } from '@/components/HebrewText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { exampleGloss, posLabel } from '@/lib/i18n';
import { hebrewFor, showTranscription, slangForLevel } from '@/lib/levels';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export default function SlangScreen() {
  const { progress } = useStore();
  const { t, lang } = useI18n();
  const palette = usePalette();
  const [query, setQuery] = useState('');
  const items = slangForLevel(progress.settings.level);
  const settings = progress.settings;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = needle
      ? items.filter((item) => {
          const hay = `${item.hebrew} ${item.nikud} ${item.ru} ${item.en} ${item.transcription} ${item.usage.ru} ${item.usage.en}`;
          return hay.toLowerCase().includes(needle);
        })
      : items;
    return pool.slice(0, needle ? 150 : 80);
  }, [items, query]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t('slang.title')} subtitle={t('slang.subtitle')} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('slang.search')}
          placeholderTextColor={palette.textMuted}
          accessibilityLabel={t('slang.search')}
          style={[
            styles.search,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              color: palette.text,
            },
          ]}
        />
        <AppText variant="caption" muted>
          {t('slang.count', { shown: filtered.length, total: items.length })}
        </AppText>
        {items.length === 0 ? (
          <EmptyState icon="message-circle" title={t('slang.empty')} description={t('lessons.locked')} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search" title={t('slang.empty')} description={t('slang.search')} />
        ) : (
          <View style={styles.list}>
            {filtered.map((item) => (
              <Surface key={item.id} style={styles.card}>
                <HebrewText size="card" align="right">
                  {hebrewFor(item, settings)}
                </HebrewText>
                {showTranscription(settings.level) ? (
                  <AppText muted>{item.transcription}</AppText>
                ) : null}
                <AppText variant="heading">{lang === 'en' ? item.en : item.ru}</AppText>
                <AppText variant="caption" muted>
                  {posLabel(item.pos, lang)}
                </AppText>
                <AppText variant="label">{t('slang.usage')}</AppText>
                <AppText>{lang === 'en' ? item.usage.en : item.usage.ru}</AppText>
                <AppText muted>{exampleGloss(item.example, lang)}</AppText>
                <AudioButton audio={item.audio} compact />
              </Surface>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  list: { gap: spacing.md },
  card: { gap: spacing.sm, borderRadius: radius.md },
  search: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
});
