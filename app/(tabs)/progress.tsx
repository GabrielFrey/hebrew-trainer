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
import { dayKey, endOfToday, pluralRu } from '@/lib/dates';
import { getLetter, getPhrase, getWord, letters, phrases, words } from '@/lib/data';
import { accuracy, isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import type { CardState } from '@/lib/types';

function cardLabel(card: CardState): { hebrew: string; ru: string } | null {
  if (card.kind === 'letter') {
    const letter = getLetter(card.refId);
    return letter ? { hebrew: letter.char, ru: letter.nameRu } : null;
  }
  if (card.kind === 'word') {
    const word = getWord(card.refId);
    return word ? { hebrew: word.nikud, ru: word.ru } : null;
  }
  const phrase = getPhrase(card.refId);
  return phrase ? { hebrew: phrase.nikud, ru: phrase.ru } : null;
}

export default function ProgressScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { progress } = useStore();

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
        <ScreenHeader title="Прогресс" />
        <EmptyState
          icon="bar-chart-2"
          title="Статистики пока нет"
          description="Пройдите первую сессию: после неё здесь появятся выученные буквы, слова и точность ответов."
          actionLabel="Начать тренировку"
          onAction={() => router.push('/session')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Прогресс"
          subtitle={
            progress.streak.current > 0
              ? `${progress.streak.current} ${pluralRu(progress.streak.current, ['день', 'дня', 'дней'])} подряд`
              : 'Серия прервана — начните заново сегодня'
          }
          action={{ icon: 'settings', label: 'Настройки', onPress: () => router.push('/settings') }}
        />

        <View style={styles.block}>
          <View style={styles.tiles}>
            <StatTile value={`${learnedLetters}/${letters.length}`} label="Буквы" />
            <StatTile value={`${learnedWords}/${words.length}`} label="Слова" />
            <StatTile value={`${learnedPhrases}/${phrases.length}`} label="Фразы" />
            <StatTile
              value={overallAccuracy === null ? '—' : `${Math.round(overallAccuracy * 100)}%`}
              label="Точность"
              hint="По всем ответам"
            />
          </View>
        </View>

        <View style={styles.block}>
          <AppText variant="heading" style={styles.sectionTitle}>
            Повторить сегодня
          </AppText>
          {dueToday.length === 0 ? (
            <Surface tone="alt">
              <AppText>Всё повторено. Ближайшие карточки вернутся в другой день.</AppText>
            </Surface>
          ) : (
            <Surface padded={false}>
              {dueToday.map((card, index) => {
                const label = cardLabel(card);
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
                      <AppText variant="label">{label.ru}</AppText>
                      <AppText variant="caption" muted>
                        {card.kind === 'letter' ? 'буква' : card.kind === 'word' ? 'слово' : 'фраза'}
                        {card.lapses > 0
                          ? ` · ошибок: ${card.lapses}`
                          : ` · интервал ${card.intervalDays} дн.`}
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
            Последние 7 дней
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
              Высота столбика — число отвеченных карточек за день.
            </AppText>
          </Surface>
        </View>

        {weakest.length > 0 ? (
          <View style={styles.block}>
            <AppText variant="heading" style={styles.sectionTitle}>
              Слабые места
            </AppText>
            <Surface style={styles.weakList}>
              {weakest.map((card) => {
                const label = cardLabel(card);
                if (!label) return null;
                return (
                  <View key={card.id} style={styles.weakRow}>
                    <View style={styles.rowText}>
                      <AppText variant="label">{label.ru}</AppText>
                      <ProgressBar value={card.correct} total={card.total} />
                      <AppText variant="caption" muted>
                        {card.correct} из {card.total} верно
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
          <Button label="Тренироваться" onPress={() => router.push('/session')} />
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
