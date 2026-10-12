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
import { levelDetail, levelSummary, levelTitle, resolveTranslation } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { usePalette, useTheme } from '@/lib/theme';
import type {
  Goal,
  LanguagePreference,
  LevelId,
  MinutesPerDay,
  ThemePreference,
  UiLanguage,
} from '@/lib/types';
import { useI18n } from '@/lib/use-i18n';

const MINUTES: MinutesPerDay[] = [5, 10, 20];
const HOURS = [8, 12, 18, 20, 21];

export default function SettingsScreen() {
  const router = useRouter();
  const { scheme } = useTheme();
  const { progress, updateSettings, reset } = useStore();
  const { t, lang } = useI18n();
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
        language: next.language,
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
    Alert.alert(t('settings.resetTitle'), t('settings.resetBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.reset'), style: 'destructive', onPress: run },
    ]);
  };

  const unlockedDecks = decksForLevel(settings.level).length;
  const unlockedWords = wordsForLevel(settings.level).length;

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section
          icon="layers"
          title={t('settings.level')}
          hint={t('settings.levelHint', {
            decks: unlockedDecks,
            words: unlockedWords,
            total: words.length,
          })}
        >
          {levels.map((level) => (
            <Row
              key={level.id}
              label={levelTitle(level, lang)}
              detail={`${levelSummary(level, lang)}. ${levelDetail(level, lang)}`}
              selected={settings.level === level.id}
              onPress={() => changeLevel(level.id)}
            />
          ))}
        </Section>

        {canToggleNikud(settings.level) ? (
          <Section icon="eye" title={t('settings.nikud')} hint={t('settings.nikudHint')}>
            <Row
              label={t('settings.nikudOn')}
              selected={settings.showNikud}
              onPress={() => updateSettings({ showNikud: true })}
            />
            <Row
              label={t('settings.nikudOff')}
              selected={!settings.showNikud}
              onPress={() => updateSettings({ showNikud: false })}
            />
          </Section>
        ) : (
          <Surface tone="alt" style={styles.about}>
            <AppText variant="label">{t('settings.nikud')}</AppText>
            <AppText variant="caption" muted>
              {t('settings.nikudLocked')}
            </AppText>
          </Surface>
        )}

        <Section icon="target" title={t('settings.goal')}>
          {(['reading', 'speaking'] as Goal[]).map((value) => (
            <Row
              key={value}
              label={t(`settings.goal.${value}`)}
              selected={settings.goal === value}
              onPress={() => updateSettings({ goal: value })}
            />
          ))}
        </Section>

        <Section icon="clock" title={t('settings.minutes')}>
          {MINUTES.map((value) => (
            <Row
              key={value}
              label={t('settings.minutesValue', { n: value })}
              selected={settings.minutesPerDay === value}
              onPress={() => {
                updateSettings({ minutesPerDay: value });
                applyReminder({ minutesPerDay: value });
              }}
            />
          ))}
        </Section>

        <Section
          icon="bell"
          title={t('settings.reminder')}
          hint={
            permission === false && !settings.remindersEnabled
              ? t('settings.reminderDenied')
              : t('settings.reminderHint')
          }
        >
          <Row
            label={settings.remindersEnabled ? t('settings.reminderOn') : t('settings.reminderOff')}
            selected={settings.remindersEnabled}
            onPress={() => void toggleReminders()}
          />
          {settings.remindersEnabled
            ? HOURS.map((hour) => (
                <Row
                  key={hour}
                  label={t('settings.reminderAt', { hour })}
                  selected={settings.reminderHour === hour}
                  onPress={() => {
                    updateSettings({ reminderHour: hour });
                    applyReminder({ reminderHour: hour });
                  }}
                />
              ))
            : null}
        </Section>

        <Section
          icon="globe"
          title={t('settings.language')}
          hint={t('settings.languageHint')}
        >
          {(['system', 'ru', 'en'] as LanguagePreference[]).map((value) => (
            <Row
              key={value}
              label={t(`settings.language.${value}`)}
              selected={settings.language === value}
              onPress={() => {
                updateSettings({ language: value });
                void syncReminder({
                  remindersEnabled: settings.remindersEnabled,
                  reminderHour: settings.reminderHour,
                  minutesPerDay: settings.minutesPerDay,
                  language: value,
                });
              }}
            />
          ))}
        </Section>

        <Section icon="flag" title={t('settings.translation')} hint={t('settings.translationHint')}>
          {(['ru', 'en'] as UiLanguage[]).map((value) => (
            <Row
              key={value}
              label={t(`settings.translation.${value}`)}
              selected={resolveTranslation(settings) === value}
              onPress={() => updateSettings({ translationLanguage: value })}
            />
          ))}
        </Section>

        <Section icon="volume-2" title={t('settings.sounds')} hint={t('settings.soundsHint')}>
          <Row
            label={settings.soundEnabled === false ? t('settings.soundsOff') : t('settings.soundsOn')}
            selected={settings.soundEnabled !== false}
            onPress={() => updateSettings({ soundEnabled: settings.soundEnabled === false })}
          />
        </Section>

        <Section
          icon="moon"
          title={t('settings.theme')}
          hint={t('settings.themeHint', {
            scheme: scheme === 'dark' ? t('settings.theme.darkName') : t('settings.theme.lightName'),
          })}
        >
          {(['system', 'light', 'dark'] as ThemePreference[]).map((value) => (
            <Row
              key={value}
              label={t(`settings.theme.${value}`)}
              selected={settings.theme === value}
              onPress={() => updateSettings({ theme: value })}
            />
          ))}
        </Section>

        <Surface tone="alt" style={styles.about}>
          <AppText variant="label">{t('settings.about')}</AppText>
          <AppText variant="caption" muted>
            {t('settings.aboutBody', { count: recordingCount() })}
          </AppText>
        </Surface>

        <Button label={t('settings.reset')} variant="danger" onPress={confirmReset} />

        <AppText variant="caption" muted style={styles.version}>
          {t('settings.version')}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const palette = usePalette();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionIcon, { backgroundColor: palette.successSoft }]}>
          <Feather name={icon} size={18} color={palette.accent} />
        </View>
        <AppText variant="heading" style={styles.sectionTitle}>
          {title}
        </AppText>
      </View>
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
  sectionHead: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { flex: 1 },
  sectionIcon: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
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
