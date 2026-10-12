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
import { dayKey } from '@/lib/dates';
import { getLevel, letters } from '@/lib/data';
import { levelTitle, pluralUnits } from '@/lib/i18n';
import { teachesLetters, wordsForLevel } from '@/lib/levels';
import { SESSION_SIZE, summariseToday } from '@/lib/session';
import { isLearned } from '@/lib/srs';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export default function TodayScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { progress } = useStore();
  const { t, lang } = useI18n();
  // Re-read the clock on focus so the queue reflects a date rollover.
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, [])
  );

  const summary = useMemo(() => summariseToday(progress, now), [progress, now]);
  const cards = useMemo(() => Object.values(progress.cards), [progress.cards]);

  const learnedLetters = cards.filter((c) => c.kind === 'letter' && isLearned(c)).length;
  const learnedWords = cards.filter((c) => c.kind === 'word' && isLearned(c)).length;
  const todayLog = progress.sessions.filter((s) => s.day === dayKey());
  const reviewedToday = todayLog.reduce((sum, s) => sum + s.reviewed, 0);
  const streak = progress.streak.current;
  const minutes = progress.settings.minutesPerDay;
  const level = getLevel(progress.settings.level);
  const unlockedWords = wordsForLevel(progress.settings.level);
  const lettersInPlay = teachesLetters(progress.settings.level);

  const nothingToDo = summary.queueSize === 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={t('tabs.today')}
          subtitle={t('today.subtitle', {
            level: levelTitle(level, lang),
            minutes,
            minutesWord: pluralUnits(lang, minutes, 'minute'),
          })}
          action={{ icon: 'settings', label: t('common.settings'), onPress: () => router.push('/settings') }}
        />

        <View style={styles.block}>
          <Surface style={styles.hero}>
            <View style={styles.streakRow}>
              <View style={[styles.streakBadge, { backgroundColor: `${palette.warning}22` }]}>
                <Feather name="zap" size={16} color={palette.warning} />
                <AppText variant="label" style={{ color: palette.warning }}>
                  {streak === 0
                    ? t('today.streakNone')
                    : t('today.streak', { count: streak, daysWord: pluralUnits(lang, streak, 'day') })}
                </AppText>
              </View>
              {progress.streak.longest > 0 ? (
                <AppText variant="caption" muted>
                  {t('today.record', { count: progress.streak.longest })}
                </AppText>
              ) : null}
            </View>

            {nothingToDo ? (
              <View style={styles.doneBlock}>
                <AppText variant="heading">{t('today.allDone')}</AppText>
                <AppText muted>{t('today.allDoneHint')}</AppText>
                <Button
                  label={t('today.reviewAhead')}
                  variant="secondary"
                  onPress={() => router.push('/session?ahead=1')}
                  style={styles.cta}
                />
              </View>
            ) : (
              <View style={styles.doneBlock}>
                <AppText variant="heading">
                  {t('today.queue', {
                    count: summary.queueSize,
                    cardsWord: pluralUnits(lang, summary.queueSize, 'card'),
                  })}
                </AppText>
                <AppText muted>
                  {t('today.queueHint', { due: summary.dueCount, fresh: summary.newCount })}
                </AppText>
                {summary.dueCount === 0 && summary.queueSize < SESSION_SIZE ? (
                  <AppText variant="caption" muted>
                    {t('today.shortQueue')}
                  </AppText>
                ) : null}
                <ProgressBar value={reviewedToday} total={reviewedToday + summary.queueSize} />
                <Button
                  label={t('common.start')}
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
            {lettersInPlay ? (
              <StatTile
                value={`${learnedLetters}/${letters.length}`}
                label={t('today.lettersLearned')}
                hint={t('today.intervalHint')}
              />
            ) : null}
            <StatTile
              value={`${learnedWords}/${unlockedWords.length}`}
              label={t('today.wordsLearned')}
              hint={t('today.unlockedHint', { level: levelTitle(level, lang) })}
            />
          </View>
        </View>

        <View style={styles.block}>
          <AppText variant="heading" style={styles.sectionTitle}>
            {t('today.warmup')}
          </AppText>
          {cards.length === 0 ? (
            <Surface>
              <EmptyState
                icon="play-circle"
                title={t('today.noHistory')}
                description={t('today.noHistoryHint')}
                actionLabel={t('common.start')}
                onAction={() => router.push('/session')}
              />
            </Surface>
          ) : (
            <Surface padded={false} style={styles.warmup}>
              <View style={styles.warmupRow}>
                <View style={styles.warmupText}>
                  <AppText variant="label">{t('today.recogniseLetter')}</AppText>
                  <AppText variant="caption" muted>
                    {t('today.recogniseHint')}
                  </AppText>
                </View>
                <Button
                  label={t('common.open')}
                  variant="secondary"
                  onPress={() => router.push('/drill/recognise')}
                />
              </View>
              <View style={[styles.warmupRow, { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <View style={styles.warmupText}>
                  <AppText variant="label">{t('today.writeLetter')}</AppText>
                  <AppText variant="caption" muted>
                    {t('today.writeHint')}
                  </AppText>
                </View>
                <Button
                  label={t('common.open')}
                  variant="secondary"
                  onPress={() => router.push('/drill/write')}
                />
              </View>
            </Surface>
          )}
        </View>

        {progress.settings.reminderAsked && !progress.settings.remindersEnabled ? (
          <View style={styles.block}>
            <Surface tone="alt" style={styles.quote}>
              <AppText variant="label">{t('today.remindersOff')}</AppText>
              <AppText variant="caption" muted>
                {t('today.remindersOffHint')}
              </AppText>
            </Surface>
          </View>
        ) : null}

        <View style={styles.block}>
          <Surface tone="alt" style={styles.quote}>
            <HebrewText size="inline">יוֹם טוֹב!</HebrewText>
            <AppText variant="caption" muted>
              {t('today.quote')}
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
