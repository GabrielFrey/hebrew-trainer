import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { AppText, Screen, Surface } from '@/components/Themed';
import { radius, spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';
import { usePalette, useTheme } from '@/lib/theme';
import type { Goal, Level, ThemePreference } from '@/lib/types';

const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Как в системе',
  light: 'Светлая',
  dark: 'Тёмная',
};

const LEVEL_LABELS: Record<Level, string> = {
  zero: 'С нуля',
  letters: 'Умею буквы',
};

const GOAL_LABELS: Record<Goal, string> = {
  reading: 'Чтение',
  speaking: 'Разговор',
};

export default function SettingsScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { scheme } = useTheme();
  const { progress, updateSettings, reset } = useStore();
  const settings = progress.settings;

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

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        <Section title="Уровень">
          {(['zero', 'letters'] as Level[]).map((value) => (
            <Row
              key={value}
              label={LEVEL_LABELS[value]}
              selected={settings.level === value}
              onPress={() => updateSettings({ level: value })}
            />
          ))}
        </Section>

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
          {([5, 10, 15] as const).map((value) => (
            <Row
              key={value}
              label={`${value} минут`}
              selected={settings.minutesPerDay === value}
              onPress={() => updateSettings({ minutesPerDay: value })}
            />
          ))}
        </Section>

        <Surface tone="alt" style={styles.about}>
          <AppText variant="label">О данных</AppText>
          <AppText variant="caption" muted>
            Прогресс хранится локально через AsyncStorage. Синхронизации и аккаунта нет. Слова и
            огласовки берутся из data/hebrew.json.
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
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}
    >
      <AppText variant="label">{label}</AppText>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  about: { gap: spacing.xs },
  version: { textAlign: 'center' },
});
