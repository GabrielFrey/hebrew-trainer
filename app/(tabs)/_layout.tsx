import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export default function TabsLayout() {
  const palette = usePalette();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.tabInactive,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: { fontSize: 11 },
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Feather name="sun" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="alphabet"
        options={{
          title: t('tabs.alphabet'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Feather name="type" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="words"
        options={{
          title: t('tabs.words'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Feather name="book-open" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reading"
        options={{
          title: t('tabs.reading'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Feather name="align-right" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
