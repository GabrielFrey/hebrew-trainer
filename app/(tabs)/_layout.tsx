import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { typography } from '@/constants/tokens';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export default function TabsLayout() {
  const palette = usePalette();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.tabInactive,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: 2,
          height: 64,
        },
        tabBarLabelStyle: { fontFamily: typography.fontFamily.extra, fontSize: 11 },
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="alphabet"
        options={{
          title: t('tabs.alphabet'),
          tabBarIcon: ({ color, size }) => <Feather name="type" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="words"
        options={{
          title: t('tabs.words'),
          tabBarIcon: ({ color, size }) => <Feather name="map" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="verbs"
        options={{
          title: t('tabs.verbs'),
          tabBarIcon: ({ color, size }) => <Feather name="repeat" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reading"
        options={{
          title: t('tabs.reading'),
          tabBarIcon: ({ color, size }) => <Feather name="message-circle" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          tabBarIcon: ({ color, size }) => <Feather name="award" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
