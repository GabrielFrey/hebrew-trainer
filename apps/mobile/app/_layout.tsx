import { NotoSansHebrew_400Regular, NotoSansHebrew_700Bold, useFonts } from "@expo-google-fonts/noto-sans-hebrew";
import { Stack } from "expo-router";
import { I18nManager, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/lib/auth";
import { usePalette } from "@/lib/theme";

I18nManager.allowRTL(true);

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
  if (!loaded) return <View style={{ flex: 1, backgroundColor: "#F6F1E8" }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StackNav />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
