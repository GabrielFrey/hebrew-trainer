import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { HebrewText } from '@/components/HebrewText';
import { ProgressBar } from '@/components/Stat';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { levels } from '@/lib/data';
import { defaultShowNikud } from '@/lib/levels';
import { levelDetail, levelSummary, levelTitle, resolveLanguage } from '@/lib/i18n';
import { requestPermission, syncReminder } from '@/lib/notifications';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import type { Goal, LevelId, MinutesPerDay, UiLanguage } from '@/lib/types';
import { useI18n } from '@/lib/use-i18n';

const STEPS = 4;
const MINUTES: MinutesPerDay[] = [5, 10, 20];
const REMINDER_HOUR = 20;

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateSettings, progress } = useStore();
  const { t, lang } = useI18n();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<LevelId>('elementary');
  const [goal, setGoal] = useState<Goal>('reading');
  const [minutes, setMinutes] = useState<MinutesPerDay>(10);
  const [translationLanguage, setTranslationLanguage] = useState<UiLanguage>(() =>
    resolveLanguage(progress.settings.language)
  );

  const finish = async () => {
    updateSettings({
      level,
      goal,
      minutesPerDay: minutes,
      showNikud: defaultShowNikud(level),
      onboarded: true,
      reminderHour: REMINDER_HOUR,
      translationLanguage,
    });
    router.replace('/');

    // Разрешение спрашиваем уже после онбординга, и отказ ничего не блокирует.
    const outcome = await requestPermission();
    const granted = outcome === 'granted';
    updateSettings({ reminderAsked: true, remindersEnabled: granted });
    if (granted) {
      await syncReminder({
        remindersEnabled: true,
        reminderHour: REMINDER_HOUR,
        minutesPerDay: minutes,
        language: progress.settings.language,
      });
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <HebrewText size="card" align="center">
            שָׁלוֹם
          </HebrewText>
          <AppText variant="caption" muted style={styles.centered}>
            шало́м
          </AppText>
        </View>

        <View style={styles.progress}>
          <ProgressBar value={step + 1} total={STEPS} />
          <AppText variant="caption" muted>
            {t('onboarding.step', { n: step + 1, total: STEPS })}
          </AppText>
        </View>

        {step === 0 ? (
          <Step title={t('onboarding.levelTitle')} description={t('onboarding.levelHint')}>
            {levels.map((item) => (
              <Option
                key={item.id}
                selected={level === item.id}
                title={levelTitle(item, lang)}
                description={`${levelSummary(item, lang)}. ${levelDetail(item, lang)}.`}
                onPress={() => setLevel(item.id)}
              />
            ))}
          </Step>
        ) : null}

        {step === 1 ? (
          <Step title={t('onboarding.goalTitle')} description={t('onboarding.goalHint')}>
            <Option
              selected={goal === 'reading'}
              title={t('settings.goal.reading')}
              description={t('onboarding.goal.readingHint')}
              onPress={() => setGoal('reading')}
            />
            <Option
              selected={goal === 'speaking'}
              title={t('settings.goal.speaking')}
              description={t('onboarding.goal.speakingHint')}
              onPress={() => setGoal('speaking')}
            />
          </Step>
        ) : null}

        {step === 2 ? (
          <Step
            title={t('onboarding.minutesTitle')}
            description={t('onboarding.minutesHint', { hour: REMINDER_HOUR })}
          >
            {MINUTES.map((value) => (
              <Option
                key={value}
                selected={minutes === value}
                title={t('settings.minutesValue', { n: value })}
                description={t(value === 5 ? 'onboarding.min5' : value === 10 ? 'onboarding.min10' : 'onboarding.min20')}
                onPress={() => setMinutes(value)}
              />
            ))}
          </Step>
        ) : null}

        {step === 3 ? (
          <Step title={t('onboarding.translationTitle')} description={t('onboarding.translationHint')}>
            <Option
              selected={translationLanguage === 'ru'}
              title={t('settings.translation.ru')}
              description={t('onboarding.translation.ruHint')}
              onPress={() => setTranslationLanguage('ru')}
            />
            <Option
              selected={translationLanguage === 'en'}
              title={t('settings.translation.en')}
              description={t('onboarding.translation.enHint')}
              onPress={() => setTranslationLanguage('en')}
            />
          </Step>
        ) : null}

        <View style={styles.actions}>
          {step > 0 ? (
            <Button
              label={t('common.back')}
              variant="ghost"
              onPress={() => setStep((value) => value - 1)}
              style={styles.actionButton}
            />
          ) : null}
          <Button
            label={step === STEPS - 1 ? t('onboarding.start') : t('common.next')}
            size="lg"
            onPress={() => (step === STEPS - 1 ? void finish() : setStep((value) => value + 1))}
            style={styles.actionButton}
          />
        </View>

        <AppText variant="caption" muted style={styles.centered}>
          {t('onboarding.privacy')}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

function Step({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.step}>
      <AppText variant="title">{title}</AppText>
      <AppText muted>{description}</AppText>
      <View style={styles.options}>{children}</View>
    </View>
  );
}

function Option({
  title,
  description,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress}>
      <Surface
        style={[
          styles.option,
          {
            borderColor: selected ? palette.accent : palette.border,
            borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={styles.optionText}>
          <AppText variant="heading">{title}</AppText>
          <AppText variant="caption" muted>
            {description}
          </AppText>
        </View>
        <View
          style={[
            styles.radio,
            {
              backgroundColor: selected ? palette.accent : 'transparent',
              borderColor: selected ? palette.accent : palette.border,
            },
          ]}
        >
          {selected ? <Feather name="check" size={14} color={palette.accentText} /> : null}
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.xs, paddingTop: spacing.lg },
  centered: { textAlign: 'center' },
  progress: { gap: spacing.sm },
  step: { gap: spacing.sm },
  options: { gap: spacing.md, marginTop: spacing.md },
  option: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  optionText: { flex: 1, gap: 2 },
  radio: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionButton: { flex: 1 },
});
