import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AudioButton } from '@/components/AudioButton';
import { EmptyState } from '@/components/EmptyState';
import { HebrewText } from '@/components/HebrewText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppText, Screen, Surface } from '@/components/Themed';
import { TranslationToggle } from '@/components/TranslationToggle';
import { radius, spacing, unitBannerColors } from '@/constants/tokens';
import { levels } from '@/lib/data';
import { exampleGloss, levelTitle, posLabel } from '@/lib/i18n';
import { hebrewFor, showTranscription, slangForLevel } from '@/lib/levels';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export default function SlangScreen() {
  const { progress } = useStore();
  const { t, lang, translation } = useI18n();
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
        <ScreenHeader
          title={t('slang.title')}
          subtitle={t('slang.subtitle')}
          extra={<TranslationToggle />}
        />
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
            {filtered.map((item) => {
              const levelIndex = ['elementary', 'basic', 'intermediate', 'advanced', 'expert'].indexOf(
                item.level
              );
              const tagColor = unitBannerColors[levelIndex] ?? unitBannerColors[0];
              const darkOnTag = tagColor === '#FFC800' || tagColor === '#FF9600' || tagColor === '#FF86D0';
              const level = levels.find((entry) => entry.id === item.level);
              return (
              <Surface key={item.id} style={styles.card}>
                <View style={[styles.tag, { backgroundColor: tagColor }]}>
                  <AppText variant="caption" style={{ color: darkOnTag ? '#1B3A14' : '#FFFFFF' }}>
                    {level ? levelTitle(level, lang) : item.level}
                  </AppText>
                </View>
                <HebrewText size="card" align="right">
                  {hebrewFor(item, settings)}
                </HebrewText>
                {showTranscription(settings.level) ? (
                  <AppText muted>{item.transcription}</AppText>
                ) : null}
                <AppText variant="heading">{translation === 'en' ? item.en : item.ru}</AppText>
                <AppText variant="caption" muted>
                  {posLabel(item.pos, lang)}
                </AppText>
                <AppText variant="label">{t('slang.usage')}</AppText>
                <AppText>{translation === 'en' ? item.usage.en : item.usage.ru}</AppText>
                <AppText muted>{exampleGloss(item.example, translation)}</AppText>
                <AudioButton audio={item.audio} compact />
              </Surface>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  list: { gap: spacing.md },
  card: { gap: spacing.sm, borderRadius: radius.lg },
  tag: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  search: {
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
});
