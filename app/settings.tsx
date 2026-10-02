import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { recordingCount } from '@/lib/audio';
import { levels, words } from '@/lib/data';
import { canToggleNikud, decksForLevel, defaultShowNikud, wordsForLevel } from '@/lib/levels';
import { hasPermission, requestPermission, syncReminder } from '@/lib/notifications';
import { useStore } from '@/lib/store';
import { usePalette, useTheme } from '@/lib/theme';
import type { Goal, LevelId, MinutesPerDay, ThemePreference } from '@/lib/types';

const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Как в системе',
  light: 'Светлая',
  dark: 'Тёмная',
};

const GOAL_LABELS: Record<Goal, string> = {
  reading: 'Чтение',
  speaking: 'Разговор',
};

const MINUTES: MinutesPerDay[] = [5, 10, 20];
const HOURS = [8, 12, 18, 20, 21];

export default function SettingsScreen() {
  const router = useRouter();
  const { scheme } = useTheme();
  const { progress, updateSettings, reset } = useStore();
  const settings = progress.settings;
  const [permission, setPermission] = useState<boolean | null>(null);

  useEffect(() => {
    void hasPermission().then(setPermission);
  }, []);

  const applyReminder = useCallback(
    (patch: { remindersEnabled?: boolean; reminderHour?: number; minutesPerDay?: MinutesPerDay }) => {
      const next = { ...settings, ...patch };
      void syncReminder({
        remindersEnabled: next.remindersEnabled,
        reminderHour: next.reminderHour,
        minutesPerDay: next.minutesPerDay,
      });
    },
    [settings]
  );

  const toggleReminders = useCallback(async () => {
    if (settings.remindersEnabled) {
      updateSettings({ remindersEnabled: false });
      applyReminder({ remindersEnabled: false });
      return;
    }
    const outcome = await requestPermission();
    setPermission(outcome === 'granted');
    updateSettings({ reminderAsked: true, remindersEnabled: outcome === 'granted' });
    if (outcome === 'granted') applyReminder({ remindersEnabled: true });
  }, [applyReminder, settings.remindersEnabled, updateSettings]);

  const changeLevel = (level: LevelId) => {
    // Смена уровня не сбрасывает карточки: меняется только набор нового материала.
    updateSettings({ level, showNikud: defaultShowNikud(level) });
  };

  const confirmReset = () => {
    const run = () => {
      reset();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') {
      run();
      return;
    }
    Alert.alert(
      'Сбросить прогресс?',
      'Все выученные буквы, слова и серия дней будут удалены с устройства.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Сбросить', style: 'destructive', onPress: run },
      ]
    );
  };

  const unlockedDecks = decksForLevel(settings.level).length;
  const unlockedWords = wordsForLevel(settings.level).length;

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section
          title="Уровень"
          hint={`Открыто ${unlockedDecks} колод и ${unlockedWords} слов из ${words.length}`}
        >
          {levels.map((level) => (
            <Row
              key={level.id}
              label={level.title}
              detail={level.summary}
              selected={settings.level === level.id}
              onPress={() => changeLevel(level.id)}
            />
          ))}
        </Section>

        {canToggleNikud(settings.level) ? (
          <Section title="Огласовки" hint="На этом уровне можно читать и с никудом, и без">
            <Row
              label="С огласовками"
              selected={settings.showNikud}
              onPress={() => updateSettings({ showNikud: true })}
            />
            <Row
              label="Без огласовок"
              selected={!settings.showNikud}
              onPress={() => updateSettings({ showNikud: false })}
            />
          </Section>
        ) : (
          <Surface tone="alt" style={styles.about}>
            <AppText variant="label">Огласовки</AppText>
            <AppText variant="caption" muted>
              На элементарном и базовом уровне огласовки показываются всегда — переключателя нет.
            </AppText>
          </Surface>
        )}

        <Section title="Цель">
          {(['reading', 'speaking'] as Goal[]).map((value) => (
            <Row
              key={value}
              label={GOAL_LABELS[value]}
              selected={settings.goal === value}
              onPress={() => updateSettings({ goal: value })}
            />
          ))}
        </Section>

        <Section title="Время в день">
          {MINUTES.map((value) => (
            <Row
              key={value}
              label={`${value} минут`}
              selected={settings.minutesPerDay === value}
              onPress={() => {
                updateSettings({ minutesPerDay: value });
                applyReminder({ minutesPerDay: value });
              }}
            />
          ))}
        </Section>

        <Section
          title="Напоминание"
          hint={
            permission === false && !settings.remindersEnabled
              ? 'Разрешение на уведомления не выдано. Приложение работает и без него.'
              : 'Одно локальное уведомление в день, текст на русском'
          }
        >
          <Row
            label={settings.remindersEnabled ? 'Включено' : 'Выключено'}
            selected={settings.remindersEnabled}
            onPress={() => void toggleReminders()}
          />
          {settings.remindersEnabled
            ? HOURS.map((hour) => (
                <Row
                  key={hour}
                  label={`В ${hour}:00`}
                  selected={settings.reminderHour === hour}
                  onPress={() => {
                    updateSettings({ reminderHour: hour });
                    applyReminder({ reminderHour: hour });
                  }}
                />
              ))
            : null}
        </Section>

        <Section title="Тема" hint={`Сейчас используется ${scheme === 'dark' ? 'тёмная' : 'светлая'}`}>
          {(['system', 'light', 'dark'] as ThemePreference[]).map((value) => (
            <Row
              key={value}
              label={THEME_LABELS[value]}
              selected={settings.theme === value}
              onPress={() => updateSettings({ theme: value })}
            />
          ))}
        </Section>

        <Surface tone="alt" style={styles.about}>
          <AppText variant="label">О данных и звуке</AppText>
          <AppText variant="caption" muted>
            Прогресс хранится локально через AsyncStorage, синхронизации и аккаунта нет. Слова и
            огласовки берутся из data/hebrew.json. Озвучка — только записи носителей языка
            ({recordingCount()} шт.); там, где записи нет, кнопка так и говорит, а синтез речи не
            подставляется.
          </AppText>
        </Surface>

        <Button label="Сбросить прогресс" variant="danger" onPress={confirmReset} />

        <AppText variant="caption" muted style={styles.version}>
          Иврит с нуля · локальная сборка
        </AppText>
      </ScrollView>
    </Screen>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <AppText variant="heading">{title}</AppText>
      {hint ? (
        <AppText variant="caption" muted>
          {hint}
        </AppText>
      ) : null}
      <Surface padded={false} style={styles.rows}>
        {children}
      </Surface>
    </View>
  );
}

function Row({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderTopColor: palette.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.rowText}>
        <AppText variant="label">{label}</AppText>
        {detail ? (
          <AppText variant="caption" muted>
            {detail}
          </AppText>
        ) : null}
      </View>
      {selected ? <Feather name="check" size={18} color={palette.accent} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  section: { gap: spacing.sm },
  rows: { borderRadius: radius.md, marginTop: spacing.xs, overflow: 'hidden' },
  row: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  rowText: { flex: 1, gap: 2 },
  about: { gap: spacing.xs },
  version: { textAlign: 'center' },
});
