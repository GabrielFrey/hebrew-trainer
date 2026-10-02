import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HebrewText } from '@/components/HebrewText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProgressBar, StatTile } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { dayKey, pluralRu } from '@/lib/dates';
import { letters, words } from '@/lib/data';
import { summariseToday } from '@/lib/session';
import { isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';

export default function TodayScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { progress } = useStore();
  const [tick, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setTick((value) => value + 1);
    }, [])
  );

  const summary = useMemo(() => summariseToday(progress), [progress, tick]);
  const cards = useMemo(() => Object.values(progress.cards), [progress.cards]);

  const learnedLetters = cards.filter((c) => c.kind === 'letter' && isLearned(c)).length;
  const learnedWords = cards.filter((c) => c.kind === 'word' && isLearned(c)).length;
  const todayLog = progress.sessions.filter((s) => s.day === dayKey());
  const reviewedToday = todayLog.reduce((sum, s) => sum + s.reviewed, 0);
  const streak = progress.streak.current;
  const minutes = progress.settings.minutesPerDay;

  const nothingToDo = summary.queueSize === 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Сегодня"
          subtitle={`Короткая тренировка на ${minutes} ${pluralRu(minutes, ['минуту', 'минуты', 'минут'])}`}
          action={{ icon: 'settings', label: 'Настройки', onPress: () => router.push('/settings') }}
        />

        <View style={styles.block}>
          <Surface style={styles.hero}>
            <View style={styles.streakRow}>
              <View style={[styles.streakBadge, { backgroundColor: `${palette.warning}22` }]}>
                <Feather name="zap" size={16} color={palette.warning} />
                <AppText variant="label" style={{ color: palette.warning }}>
                  {streak === 0
                    ? 'Серия ещё не начата'
                    : `${streak} ${pluralRu(streak, ['день', 'дня', 'дней'])} подряд`}
                </AppText>
              </View>
              {progress.streak.longest > 0 ? (
                <AppText variant="caption" muted>
                  Рекорд: {progress.streak.longest}
                </AppText>
              ) : null}
            </View>

            {nothingToDo ? (
              <View style={styles.doneBlock}>
                <AppText variant="heading">На сегодня всё повторено</AppText>
                <AppText muted>
                  Новые карточки откроются завтра. Если хочется позаниматься ещё, можно пройти
                  повторения досрочно.
                </AppText>
                <Button
                  label="Повторить досрочно"
                  variant="secondary"
                  onPress={() => router.push('/session?ahead=1')}
                  style={styles.cta}
                />
              </View>
            ) : (
              <View style={styles.doneBlock}>
                <AppText variant="heading">
                  Очередь: {summary.queueSize}{' '}
                  {pluralRu(summary.queueSize, ['карточка', 'карточки', 'карточек'])}
                </AppText>
                <AppText muted>
                  {summary.dueCount} на повторение · {summary.newCount} новых
                </AppText>
                <ProgressBar value={reviewedToday} total={reviewedToday + summary.queueSize} />
                <Button
                  label="Начать"
                  size="lg"
                  onPress={() => router.push('/session')}
                  style={styles.cta}
                />
              </View>
            )}
          </Surface>
        </View>

        <View style={styles.block}>
          <View style={styles.tiles}>
            <StatTile
              value={`${learnedLetters}/${letters.length}`}
              label="Буквы выучены"
              hint="Интервал 6 дней и больше"
            />
            <StatTile
              value={`${learnedWords}/${words.length}`}
              label="Слова выучены"
              hint="Из загруженных колод"
            />
          </View>
        </View>

        <View style={styles.block}>
          <AppText variant="heading" style={styles.sectionTitle}>
            Разминка
          </AppText>
          {cards.length === 0 ? (
            <Surface>
              <EmptyState
                icon="play-circle"
                title="Ещё нет истории"
                description="Пройдите первую сессию — здесь появятся ваши последние буквы и слова."
                actionLabel="Начать"
                onAction={() => router.push('/session')}
              />
            </Surface>
          ) : (
            <Surface padded={false} style={styles.warmup}>
              <View style={styles.warmupRow}>
                <View style={styles.warmupText}>
                  <AppText variant="label">Узнай букву</AppText>
                  <AppText variant="caption" muted>
                    Быстрый проход по открытым буквам
                  </AppText>
                </View>
                <Button
                  label="Открыть"
                  variant="secondary"
                  onPress={() => router.push('/drill/recognise')}
                />
              </View>
              <View style={[styles.warmupRow, { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <View style={styles.warmupText}>
                  <AppText variant="label">Напиши букву</AppText>
                  <AppText variant="caption" muted>
                    По названию и звуку — с самопроверкой
                  </AppText>
                </View>
                <Button
                  label="Открыть"
                  variant="secondary"
                  onPress={() => router.push('/drill/write')}
                />
              </View>
            </Surface>
          )}
        </View>

        <View style={styles.block}>
          <Surface tone="alt" style={styles.quote}>
            <HebrewText size="inline">יוֹם טוֹב!</HebrewText>
            <AppText variant="caption" muted>
              «Хорошего дня» — йом тов
            </AppText>
          </Surface>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  block: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  hero: { gap: spacing.lg },
  streakRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  streakBadge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  doneBlock: { gap: spacing.md },
  cta: { marginTop: spacing.sm },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  sectionTitle: { marginBottom: spacing.md },
  warmup: { overflow: 'hidden' },
  warmupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  warmupText: { flex: 1, gap: 2 },
  quote: { alignItems: 'flex-end', gap: spacing.xs },
});
