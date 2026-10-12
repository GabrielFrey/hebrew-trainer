import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { syncReminder } from '@/lib/notifications';
import { StoreProvider, useStore } from '@/lib/store';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { ready, progress } = useStore();
  const { palette, scheme } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const onboarded = progress.settings.onboarded;

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!onboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboarded && inOnboarding) {
      router.replace('/');
    }
  }, [ready, onboarded, segments, router]);

  const { t } = useI18n();
  const { remindersEnabled, reminderHour, minutesPerDay, language } = progress.settings;
  useEffect(() => {
    if (!ready || !onboarded) return;
    // Переназначаем напоминание при старте: час или длительность могли измениться.
    void syncReminder({ remindersEnabled, reminderHour, minutesPerDay, language });
  }, [ready, onboarded, remindersEnabled, reminderHour, minutesPerDay, language]);

  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      primary: palette.accent,
    },
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="session"
          options={{ title: t('nav.session'), presentation: 'fullScreenModal', headerShown: false }}
        />
        <Stack.Screen name="settings" options={{ title: t('nav.settings') }} />
        <Stack.Screen name="letter/[id]" options={{ title: t('nav.letter') }} />
        <Stack.Screen name="deck/[id]" options={{ title: t('nav.deck') }} />
        <Stack.Screen name="drill/[mode]" options={{ title: t('nav.drill') }} />
        <Stack.Screen name="lesson/[id]" options={{ title: t('nav.lesson') }} />
        <Stack.Screen name="lesson/[unit]/[index]" options={{ title: t('nav.lesson') }} />
      </Stack>
    </NavThemeProvider>
  );
}
