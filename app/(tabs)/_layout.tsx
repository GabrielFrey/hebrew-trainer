import { Platform, StyleSheet, View } from 'react-native';
import { DynamicColorIOS } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

import { AppSymbol } from '@/components/AppSymbol';
import { GlassSurface } from '@/components/GlassSurface';
import { typography } from '@/constants/tokens';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

function GlassTabBarBackground() {
  return <GlassSurface testID="glass-tabbar" style={StyleSheet.absoluteFill} />;
}

function JsTabs() {
  const palette = usePalette();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.tabInactive,
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 10,
          height: 64,
          borderRadius: 28,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          overflow: 'hidden',
        },
        tabBarLabelStyle: { fontFamily: typography.fontFamily.extra, fontSize: 11 },
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color, size }) => (
            <AppSymbol sf="house.fill" fallback="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alphabet"
        options={{
          title: t('tabs.alphabet'),
          tabBarIcon: ({ color, size }) => (
            <AppSymbol sf="textformat" fallback="type" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="words"
        options={{
          href: null,
          title: t('tabs.words'),
        }}
      />
      <Tabs.Screen
        name="verbs"
        options={{
          href: null,
          title: t('tabs.verbs'),
        }}
      />
      <Tabs.Screen
        name="reading"
        options={{
          title: t('tabs.reading'),
          tabBarIcon: ({ color, size }) => (
            <AppSymbol sf="bubble.left.and.bubble.right.fill" fallback="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          tabBarIcon: ({ color, size }) => (
            <AppSymbol sf="trophy.fill" fallback="award" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function IosNativeTabs() {
  const palette = usePalette();
  const { t } = useI18n();
  const iconColor = DynamicColorIOS({ light: '#5B7354', dark: '#A8BFA0' });
  const selected = DynamicColorIOS({ light: '#58CC02', dark: '#7AC70C' });

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={palette.accent}
      iconColor={{ default: iconColor, selected }}
      labelStyle={{ fontFamily: typography.fontFamily.extra, fontSize: 11 }}
    >
      <NativeTabs.Trigger name="index">
        <Label>{t('tabs.today')}</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alphabet">
        <Label>{t('tabs.alphabet')}</Label>
        <Icon sf={{ default: 'textformat', selected: 'textformat' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reading">
        <Label>{t('tabs.reading')}</Label>
        <Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <Label>{t('tabs.progress')}</Label>
        <Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabsLayout() {
  if (Platform.OS === 'ios') {
    return (
      <View style={{ flex: 1 }}>
        <IosNativeTabs />
      </View>
    );
  }
  return <JsTabs />;
}
