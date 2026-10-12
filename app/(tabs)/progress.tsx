import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HebrewText } from '@/components/HebrewText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProgressBar, StatTile } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { dayKey, endOfToday } from '@/lib/dates';
import { getLetter, getPhrase, getWord, letters, phrases, words } from '@/lib/data';
import { letterName, phraseGloss, pluralUnits, wordGloss } from '@/lib/i18n';
import { accuracy, isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import type { CardState, UiLanguage } from '@/lib/types';
import { useI18n } from '@/lib/use-i18n';

function cardLabel(card: CardState, lang: UiLanguage): { hebrew: string; gloss: string } | null {
  if (card.kind === 'letter') {
    const letter = getLetter(card.refId);
    return letter ? { hebrew: letter.char, gloss: letterName(letter, lang) } : null;
  }
  if (card.kind === 'word') {
    const word = getWord(card.refId);
    return word ? { hebrew: word.nikud, gloss: wordGloss(word, lang) } : null;
  }
  const phrase = getPhrase(card.refId);
  return phrase ? { hebrew: phrase.nikud, gloss: phraseGloss(phrase, lang) } : null;
}

export default function ProgressScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { progress } = useStore();
  const { t, lang, translation } = useI18n();

  const cards = useMemo(() => Object.values(progress.cards), [progress.cards]);

  const letterCards = cards.filter((c) => c.kind === 'letter');
  const wordCards = cards.filter((c) => c.kind === 'word');
  const phraseCards = cards.filter((c) => c.kind === 'phrase');

  const learnedLetters = letterCards.filter(isLearned).length;
  const learnedWords = wordCards.filter(isLearned).length;
  const learnedPhrases = phraseCards.filter(isLearned).length;

  const overallAccuracy = accuracy(cards);
  const dueToday = useMemo(() => {
    const limit = endOfToday();
    return cards
      .filter((c) => c.dueAt <= limit)
      .sort((a, b) => a.dueAt - b.dueAt)
      .slice(0, 8);
  }, [cards]);

  const weakest = useMemo(
    () =>
      cards
        .filter((c) => c.total >= 2)
        .sort((a, b) => a.correct / a.total - b.correct / b.total)
        .slice(0, 5),
    [cards]
  );

  const last7 = useMemo(() => {
    const days: { day: string; reviewed: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = dayKey(Date.now() - i * 24 * 60 * 60 * 1000);
      const reviewed = progress.sessions
        .filter((s) => s.day === day)
        .reduce((sum, s) => sum + s.reviewed, 0);
      days.push({ day, reviewed });
    }
    return days;
  }, [progress.sessions]);

  const maxReviewed = Math.max(1, ...last7.map((d) => d.reviewed));

  if (cards.length === 0) {
    return (
      <Screen>
        <ScreenHeader title={t('tabs.progress')} />
        <EmptyState
          icon="bar-chart-2"
          title={t('progress.empty')}
          description={t('progress.emptyHint')}
          actionLabel={t('progress.start')}
          onAction={() => router.push('/session')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={t('tabs.progress')}
          subtitle={
            progress.streak.current > 0
              ? t('progress.subtitleStreak', {
                  count: progress.streak.current,
                  daysWord: pluralUnits(lang, progress.streak.current, 'day'),
                })
              : t('progress.subtitleBroken')
          }
          action={{ icon: 'settings', label: t('common.settings'), onPress: () => router.push('/settings') }}
        />

        <View style={styles.block}>
          <View style={styles.tiles}>
            <StatTile value={`${learnedLetters}/${letters.length}`} label={t('progress.letters')} />
            <StatTile value={`${learnedWords}/${words.length}`} label={t('progress.words')} />
            <StatTile value={`${learnedPhrases}/${phrases.length}`} label={t('progress.phrases')} />
            <StatTile
              value={overallAccuracy === null ? '—' : `${Math.round(overallAccuracy * 100)}%`}
              label={t('progress.accuracy')}
              hint={t('progress.accuracyHint')}
            />
          </View>
        </View>

        <View style={styles.block}>
          <AppText variant="heading" style={styles.sectionTitle}>
            {t('progress.dueToday')}
          </AppText>
          {dueToday.length === 0 ? (
            <Surface tone="alt">
              <AppText>{t('progress.dueEmpty')}</AppText>
            </Surface>
          ) : (
            <Surface padded={false}>
              {dueToday.map((card, index) => {
                const label = cardLabel(card, translation);
                if (!label) return null;
                return (
                  <View
                    key={card.id}
                    style={[
                      styles.row,
                      index > 0
                        ? { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }
                        : null,
                    ]}
                  >
                    <View style={styles.rowText}>
                      <AppText variant="label">{label.gloss}</AppText>
                      <AppText variant="caption" muted>
                        {card.kind === 'letter'
                          ? t('progress.kindLetter')
                          : card.kind === 'word'
                            ? t('progress.kindWord')
                            : t('progress.kindPhrase')}
                        {card.lapses > 0
                          ? ` · ${t('progress.lapses', { count: card.lapses })}`
                          : ` · ${t('progress.interval', { days: card.intervalDays })}`}
                      </AppText>
                    </View>
                    <HebrewText size="inline" style={styles.rowHebrew} numberOfLines={1}>
                      {label.hebrew}
                    </HebrewText>
                  </View>
                );
              })}
            </Surface>
          )}
        </View>

        <View style={styles.block}>
          <AppText variant="heading" style={styles.sectionTitle}>
            {t('progress.last7')}
          </AppText>
          <Surface style={styles.chart}>
            <View style={styles.bars}>
              {last7.map((day) => (
                <View key={day.day} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: day.reviewed > 0 ? palette.accent : palette.surfaceAlt,
                          height: `${Math.max(6, (day.reviewed / maxReviewed) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <AppText variant="caption" muted>
                    {day.day.slice(8)}
                  </AppText>
                </View>
              ))}
            </View>
            <AppText variant="caption" muted>
              {t('progress.chartHint')}
            </AppText>
          </Surface>
        </View>

        {weakest.length > 0 ? (
          <View style={styles.block}>
            <AppText variant="heading" style={styles.sectionTitle}>
              {t('progress.weak')}
            </AppText>
            <Surface style={styles.weakList}>
              {weakest.map((card) => {
                const label = cardLabel(card, translation);
                if (!label) return null;
                return (
                  <View key={card.id} style={styles.weakRow}>
                    <View style={styles.rowText}>
                      <AppText variant="label">{label.gloss}</AppText>
                      <ProgressBar value={card.correct} total={card.total} />
                      <AppText variant="caption" muted>
                        {t('progress.correctOf', { correct: card.correct, total: card.total })}
                      </AppText>
                    </View>
                    <HebrewText size="inline" style={styles.rowHebrew} numberOfLines={1}>
                      {label.hebrew}
                    </HebrewText>
                  </View>
                );
              })}
            </Surface>
          </View>
        ) : null}

        <View style={styles.block}>
          <Button label={t('progress.practice')} onPress={() => router.push('/session')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  block: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  sectionTitle: { marginBottom: spacing.md },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  rowText: { flex: 1, gap: spacing.xs },
  rowHebrew: { flexShrink: 0, maxWidth: '45%' },
  chart: { gap: spacing.md },
  bars: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.sm, height: 120 },
  barColumn: { alignItems: 'center', flex: 1, gap: spacing.xs },
  barTrack: { height: 92, justifyContent: 'flex-end', width: '100%' },
  bar: { borderRadius: radius.sm, width: '100%' },
  weakList: { gap: spacing.lg },
  weakRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
});
