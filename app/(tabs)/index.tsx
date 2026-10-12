import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProgressBar, StatTile } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { dayKey } from '@/lib/dates';
import { getLevel } from '@/lib/data';
import { getCatalog, themeById } from '@/lib/lexicon';
import { dailyLessonGoal, lessonsToday, nextLessonId } from '@/lib/lessons';
import { levelTitle, pluralUnits, themeTitle } from '@/lib/i18n';
import { summariseToday } from '@/lib/session';
import { isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export default function TodayScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { progress } = useStore();
  const { t, lang } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, [])
  );

  const summary = useMemo(() => summariseToday(progress, now), [progress, now]);
  const level = getLevel(progress.settings.level);
  const goal = dailyLessonGoal(progress.settings.minutesPerDay);
  const doneToday = lessonsToday(progress, dayKey());
  const nxt = nextLessonId(progress, progress.settings.level);
  const nxtUnit = nxt
    ? getCatalog().units.find((unit) => nxt.startsWith(`${unit.id}:`))
    : undefined;
  const nxtTheme = nxtUnit ? themeById(nxtUnit.theme) : undefined;
  const streak = progress.streak.current;
  const learnedWords = Object.values(progress.cards).filter((c) => c.kind === 'word' && isLearned(c)).length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={t('tabs.today')}
          subtitle={t('today.subtitle', {
            level: levelTitle(level, lang),
            minutes: progress.settings.minutesPerDay,
            minutesWord: pluralUnits(lang, progress.settings.minutesPerDay, 'minute'),
          })}
          action={{ icon: 'settings', label: t('common.settings'), onPress: () => router.push('/settings') }}
        />

        <Surface style={styles.hero}>
          <View style={[styles.streakBadge, { backgroundColor: `${palette.warning}22` }]}>
            <Feather name="zap" size={16} color={palette.warning} />
            <AppText variant="label" style={{ color: palette.warning }}>
              {streak === 0
                ? t('today.streakNone')
                : t('today.streak', { count: streak, daysWord: pluralUnits(lang, streak, 'day') })}
            </AppText>
          </View>

          <AppText variant="caption" muted>
            {doneToday >= goal
              ? t('today.goalMet')
              : t('today.dailyGoal', { done: doneToday, goal })}
          </AppText>
          <ProgressBar value={Math.min(doneToday, goal)} total={goal} />

          {nxt ? (
            <>
              <AppText variant="heading">
                {nxtTheme ? `${nxtTheme.emoji} ${themeTitle(nxtTheme, lang)}` : t('today.newLesson')}
              </AppText>
              <Button
                label={t('today.continue')}
                size="lg"
                onPress={() => router.push(`/lesson/${encodeURIComponent(nxt)}`)}
              />
            </>
          ) : (
            <AppText muted>{t('today.lessonsDone')}</AppText>
          )}
        </Surface>

        <View style={styles.stats}>
          <StatTile value={String(learnedWords)} label={t('today.wordsLearned')} hint={t('today.intervalHint')} />
          <StatTile
            value={String(summary.queueSize)}
            label={t('today.reviewSm2')}
            hint={t('today.queueHint', { due: summary.dueCount, fresh: summary.newCount })}
          />
        </View>

        {summary.queueSize > 0 ? (
          <Button
            label={t('common.start')}
            variant="secondary"
            onPress={() => router.push('/session')}
          />
        ) : (
          <Button
            label={t('today.reviewAhead')}
            variant="ghost"
            onPress={() => router.push('/session?ahead=1')}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  streakBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stats: { flexDirection: 'row', gap: spacing.md },
});
