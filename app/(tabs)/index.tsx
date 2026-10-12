import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { HudBar } from '@/components/HudBar';
import { LessonPath } from '@/components/LessonPath';
import { Mascot } from '@/components/Mascot';
import { AppText, Screen, Surface } from '@/components/Themed';
import { spacing } from '@/constants/tokens';
import { dayKey } from '@/lib/dates';
import { getCatalog, lessonPath, parseLessonId, themeById } from '@/lib/lexicon';
import { dailyLessonGoal, lessonsToday, nextLessonId } from '@/lib/lessons';
import { themeTitle } from '@/lib/i18n';
import { summariseToday } from '@/lib/session';
import { useStore } from '@/lib/store';
import { useI18n } from '@/lib/use-i18n';

export default function TodayScreen() {
  const router = useRouter();
  const { progress } = useStore();
  const { t, lang } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, [])
  );

  const summary = useMemo(() => summariseToday(progress, now), [progress, now]);
  const goal = dailyLessonGoal(progress.settings.minutesPerDay);
  const doneToday = lessonsToday(progress, dayKey());
  const nxt = nextLessonId(progress, progress.settings.level);
  const nxtUnit = nxt ? getCatalog().units.find((unit) => nxt.startsWith(`${unit.id}:`)) : undefined;
  const nxtTheme = nxtUnit ? themeById(nxtUnit.theme) : undefined;

  return (
    <Screen>
      <View style={styles.hudPad}>
        <HudBar />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Surface style={styles.hero}>
          <Mascot pose={doneToday >= goal ? 'cheer' : 'wave'} size={96} />
          <AppText variant="heading">
            {nxtTheme ? `${nxtTheme.emoji} ${themeTitle(nxtTheme, lang)}` : t('today.lessonsDone')}
          </AppText>
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
          ) : null}
          {summary.queueSize > 0 ? (
            <Button label={t('today.reviewSm2')} variant="secondary" onPress={() => router.push('/session')} />
          ) : (
            <Button
              label={t('today.reviewAhead')}
              variant="ghost"
              onPress={() => router.push('/session?ahead=1')}
            />
          )}
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
