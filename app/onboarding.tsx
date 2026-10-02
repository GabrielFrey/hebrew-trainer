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
import { requestPermission, syncReminder } from '@/lib/notifications';
import { useStore } from '@/lib/store';
import { usePalette } from '@/lib/theme';
import type { Goal, LevelId, MinutesPerDay } from '@/lib/types';

const STEPS = 3;
const MINUTES: MinutesPerDay[] = [5, 10, 20];
const REMINDER_HOUR = 20;

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateSettings } = useStore();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<LevelId>('elementary');
  const [goal, setGoal] = useState<Goal>('reading');
  const [minutes, setMinutes] = useState<MinutesPerDay>(10);

  const finish = async () => {
    updateSettings({
      level,
      goal,
      minutesPerDay: minutes,
      showNikud: defaultShowNikud(level),
      onboarded: true,
      reminderHour: REMINDER_HOUR,
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
            Шаг {step + 1} из {STEPS}
          </AppText>
        </View>

        {step === 0 ? (
          <Step
            title="Ваш уровень"
            description="От него зависят колоды, длина фраз и огласовки. Уровень можно поменять в любой момент — выученное не сбросится."
          >
            {levels.map((item) => (
              <Option
                key={item.id}
                selected={level === item.id}
                title={item.title}
                description={`${item.summary}. ${item.detail}.`}
                onPress={() => setLevel(item.id)}
              />
            ))}
          </Step>
        ) : null}

        {step === 1 ? (
          <Step title="Главная цель" description="Акцент в сессии: разбор текста или живая речь.">
            <Option
              selected={goal === 'reading'}
              title="Чтение"
              description="Уверенно читать вслух, в том числе без огласовок"
              onPress={() => setGoal('reading')}
            />
            <Option
              selected={goal === 'speaking'}
              title="Разговор"
              description="Базовый словарь и простые фразы на слух"
              onPress={() => setGoal('speaking')}
            />
          </Step>
        ) : null}

        {step === 2 ? (
          <Step
            title="Сколько времени в день?"
            description={`Очередь всегда не длиннее 15 карточек. Во столько же будем присылать напоминание — в ${REMINDER_HOUR}:00.`}
          >
            {MINUTES.map((value) => (
              <Option
                key={value}
                selected={minutes === value}
                title={`${value} минут`}
                description={
                  value === 5
                    ? 'Минимум, чтобы не терять серию'
                    : value === 10
                      ? 'Комфортный ритм на каждый день'
                      : 'Быстрый прогресс, если есть силы'
                }
                onPress={() => setMinutes(value)}
              />
            ))}
          </Step>
        ) : null}

        <View style={styles.actions}>
          {step > 0 ? (
            <Button
              label="Назад"
              variant="ghost"
              onPress={() => setStep((value) => value - 1)}
              style={styles.actionButton}
            />
          ) : null}
          <Button
            label={step === STEPS - 1 ? 'Начать учиться' : 'Дальше'}
            size="lg"
            onPress={() => (step === STEPS - 1 ? void finish() : setStep((value) => value + 1))}
            style={styles.actionButton}
          />
        </View>

        <AppText variant="caption" muted style={styles.centered}>
          Прогресс хранится только на устройстве. Аккаунт не нужен.
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
