import { NotoSansHebrew_400Regular, NotoSansHebrew_700Bold, useFonts } from "@expo-google-fonts/noto-sans-hebrew";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nManager, Pressable, Text, View } from "react-native";
import { BitiMascot } from "@/components/BitiMascot";
import { deviceUiLang } from "@/lib/device-lang";
import { t } from "@/lib/i18n";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/lib/auth";
import { usePalette } from "@/lib/theme";

I18nManager.allowRTL(true);

/** Friendly crash screen with retry (main-branch error-screen pattern), Biti palette + mascot. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  const lang = deviceUiLang();
  return (
    <View testID="error-screen" style={{ flex: 1, backgroundColor: "#EEF2F7", alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
      <BitiMascot lang={lang} mood="sad" />
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#142033", textAlign: "center" }}>{t(lang, "lesson.errorTitle")}</Text>
      <Text style={{ color: "#3A4A5E", textAlign: "center" }}>{t(lang, "lesson.errorBody")}</Text>
      {__DEV__ ? <Text style={{ color: "#6B7787", fontSize: 12, textAlign: "center" }}>{error.message}</Text> : null}
      <Pressable
        testID="error-retry"
        accessibilityRole="button"
        onPress={retry}
        style={{ backgroundColor: "#9A3412", borderRadius: 999, paddingVertical: 12, paddingHorizontal: 24 }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{t(lang, "lesson.retry")}</Text>
      </Pressable>
    </View>
  );
}

function StackNav() {
  const palette = usePalette();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.sand },
      }}
    />
  );
}

export default function Layout() {
  const [loaded] = useFonts({ NotoSansHebrew_400Regular, NotoSansHebrew_700Bold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: "#EEF2F7" }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar style="dark" />
        <AuthProvider>
          <StackNav />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
