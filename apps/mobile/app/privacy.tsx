import { router } from "expo-router";
import { Platform, Pressable, ScrollView, Text } from "react-native";
import { initialWindowMetrics, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

const UPDATED = "2026-11-18";

export default function Privacy() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, initialWindowMetrics?.insets.top ?? 0, Platform.OS === "ios" ? 54 : 0);
  const bottomInset = Math.max(insets.bottom, initialWindowMetrics?.insets.bottom ?? 0);
  const { lang } = useAuth();
  const block = { color: palette.ink, fontSize: 16, lineHeight: 24 };
  return (
    <ScrollView
      testID="privacy"
      contentContainerStyle={{
        paddingTop: topInset + 20,
        paddingBottom: bottomInset + 32,
        paddingHorizontal: 24,
        gap: 16,
        backgroundColor: palette.sand,
      }}
    >
      <Text style={{ fontSize: 32, fontWeight: "700", color: palette.ink }}>{t(lang, "privacy.title")}</Text>
      <Text style={{ color: palette.inkSoft }}>{t(lang, "privacy.updated", { date: UPDATED })}</Text>
      <Text style={block}>{t(lang, "privacy.intro")}</Text>
      <Text style={block}>{t(lang, "privacy.device")}</Text>
      <Text style={block}>{t(lang, "privacy.network")}</Text>
      <Text style={block}>{t(lang, "privacy.analytics")}</Text>
      <Text style={block}>{t(lang, "privacy.children")}</Text>
      <Text style={block}>{t(lang, "privacy.contact")}</Text>
      <Pressable
        testID="privacy-back"
        accessibilityRole="button"
        accessibilityLabel={t(lang, "privacy.back")}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start", paddingHorizontal: 4 }}
      >
        <Text style={{ color: palette.indigo, fontWeight: "600" }}>{t(lang, "privacy.back")}</Text>
      </Pressable>
    </ScrollView>
  );
}
