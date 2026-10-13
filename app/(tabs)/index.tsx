import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { GoalRing } from '@/components/GoalRing';
import { HudBar } from '@/components/HudBar';
import { LessonPath } from '@/components/LessonPath';
import { AppText, Screen, Surface } from '@/components/Themed';
import { spacing } from '@/constants/tokens';
import { dayKey } from '@/lib/dates';
import { lessonPath, parseLessonId } from '@/lib/lexicon';
import { dailyLessonGoal, minutesToday, nextLessonId } from '@/lib/lessons';
import { summariseToday } from '@/lib/session';
import { useStore } from '@/lib/store';
import { useI18n } from '@/lib/use-i18n';

export default function TodayScreen() {
  const router = useRouter();
  const { progress } = useStore();
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, [])
  );

  const summary = useMemo(() => summariseToday(progress, now), [progress, now]);
  const goal = dailyLessonGoal(progress.settings.minutesPerDay);
  const doneToday = minutesToday(progress, dayKey());
  const nxt = nextLessonId(progress, progress.settings.level);

  return (
    <Screen>
      <View style={styles.hudPad}>
        <HudBar />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Surface style={styles.hero}>
          <GoalRing value={doneToday} total={goal} label={t('today.goalRing', { done: doneToday, goal })} />
          <AppText muted>
            {doneToday >= goal ? t('today.goalMet') : t('today.dailyGoal', { done: doneToday, goal })}
          </AppText>
          {nxt ? (
            <Button
              label={t('today.continue')}
              size="lg"
              onPress={() => {
                const parsed = parseLessonId(nxt);
                router.push(parsed ? lessonPath(parsed.unitId, parsed.index) : '/');
              }}
            />
          ) : (
            <AppText>{t('today.lessonsDone')}</AppText>
          )}
          {summary.queueSize > 0 ? (
            <Button
              label={t('today.reviewSm2', { count: summary.queueSize })}
              variant="secondary"
              onPress={() => router.push('/session')}
            />
          ) : null}
          <Button label={t('today.verbs')} variant="ghost" onPress={() => router.push('/verbs')} />
        </Surface>
        <LessonPath />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hudPad: { paddingTop: spacing.sm },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', gap: spacing.md },
});
