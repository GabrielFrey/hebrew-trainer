import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { initialWindowMetrics, useSafeAreaInsets } from "react-native-safe-area-context";
import { BitiMascot } from "@/components/BitiMascot";
import { connectionState, lastApiHost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { COURSE_FOR_LANG, deviceUiLang } from "@/lib/device-lang";
import { t, type UiLang } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

const LANGS: { code: UiLang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "uk", label: "Українська" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

export default function Onboarding() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, initialWindowMetrics?.insets.top ?? 0, Platform.OS === "ios" ? 54 : 0);
  const bottomInset = Math.max(insets.bottom, initialWindowMetrics?.insets.bottom ?? 0);
  const { enter } = useAuth();
  const initialLang = useMemo(() => deviceUiLang(), []);
  const [lang, setLang] = useState<UiLang>(initialLang);
  const [course, setCourse] = useState(COURSE_FOR_LANG[initialLang]);
  const [motivation, setMotivation] = useState("aliyah");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [offlineNote, setOfflineNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go(to: "/learn" | "/placement") {
    setBusy(true);
    setError(null);
    setOfflineNote(null);
    try {
      await enter({
        ui_language: lang,
        display_name: name || t(lang, "onboarding.learner"),
        motivation,
        course_id: course,
      });
      if (connectionState() === "offline") {
        setOfflineNote(t(lang, "onboarding.workingOffline", { host: lastApiHost() }));
      }
      router.replace(to);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(lang, "onboarding.couldNotStart"));
    } finally {
      setBusy(false);
    }
  }

  const chip = (active: boolean) => ({
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: active ? palette.indigo : palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
  });

  return (
    <ScrollView
      testID="onboarding"
      contentContainerStyle={{
        paddingTop: topInset + 20,
        paddingBottom: bottomInset + 32,
        paddingHorizontal: 24,
        gap: 16,
        backgroundColor: palette.sand,
      }}
    >
      <View testID="onboarding-hero" style={{ alignItems: "flex-start", marginTop: 8 }}>
        <BitiMascot mood="happy" size={96} lang={lang} />
      </View>
      <Text testID="onboarding-title" style={{ fontSize: 32, fontWeight: "700", color: palette.ink }}>
        {t(lang, "onboarding.title")}
      </Text>
      <Text testID="brand-name-start" style={{ fontSize: 18, color: palette.inkSoft }}>
        {t(lang, "brand.name")}
      </Text>
      <Text style={{ fontSize: 18, color: palette.inkSoft }}>{t(lang, "brand.tagline")}</Text>
      <Text style={{ fontWeight: "600", color: palette.ink }}>{t(lang, "onboarding.language")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {LANGS.map(({ code, label }) => (
          <Pressable
            key={code}
            testID={`lang-${code}`}
            accessibilityRole="button"
            onPress={() => {
              setLang(code);
              setCourse(COURSE_FOR_LANG[code]);
            }}
            style={chip(lang === code)}
          >
            <Text style={{ color: lang === code ? palette.paper : palette.ink }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ fontWeight: "600", color: palette.ink }}>{t(lang, "onboarding.course")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(["he-ru", "he-uk", "he-en", "he-es", "he-fr"] as const).map((id) => {
          const key =
            id === "he-ru"
              ? "onboarding.courseHeRu"
              : id === "he-uk"
                ? "onboarding.courseHeUk"
                : id === "he-en"
                  ? "onboarding.courseHeEn"
                  : id === "he-es"
                    ? "onboarding.courseHeEs"
                    : "onboarding.courseHeFr";
          return (
            <Pressable key={id} testID={`course-${id}`} onPress={() => setCourse(id)} style={chip(course === id)}>
              <Text style={{ color: course === id ? palette.paper : palette.ink }}>{t(lang, key)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontSize: 13, color: palette.inkSoft }}>{t(lang, "onboarding.reviewFlag")}</Text>
      <Text style={{ color: palette.ink }}>{t(lang, "onboarding.namePrompt")}</Text>
      <TextInput
        testID="onboarding-name"
        value={name}
        onChangeText={setName}
        accessibilityLabel={t(lang, "onboarding.namePrompt")}
        style={{
          borderWidth: 1,
          borderColor: palette.line,
          backgroundColor: palette.paper,
          borderRadius: 16,
          padding: 12,
          color: palette.ink,
        }}
      />
      <Text style={{ color: palette.ink }}>{t(lang, "onboarding.motivation")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(["aliyah", "work", "travel", "family"] as const).map((id) => (
          <Pressable
            key={id}
            testID={`motivation-${id}`}
            accessibilityRole="button"
            onPress={() => setMotivation(id)}
            style={[chip(motivation === id), { borderRadius: 16 }]}
          >
            <Text style={{ color: motivation === id ? palette.paper : palette.ink }}>{t(lang, `onboarding.${id}`)}</Text>
          </Pressable>
        ))}
      </View>
      {offlineNote ? (
        <Text testID="onboarding-offline" style={{ color: palette.almost }}>
          {offlineNote}
        </Text>
      ) : null}
      {error ? (
        <View style={{ gap: 8 }}>
          <Text testID="onboarding-error" style={{ color: palette.incorrect }}>
            {error}
          </Text>
          <Pressable
            testID="onboarding-retry"
            accessibilityRole="button"
            onPress={() => go("/learn")}
            style={{ borderWidth: 1, borderColor: palette.line, padding: 12, borderRadius: 999 }}
          >
            <Text style={{ textAlign: "center", color: palette.ink }}>{t(lang, "onboarding.retry")}</Text>
          </Pressable>
        </View>
      ) : null}
      <Pressable
        testID="start-alef"
        accessibilityRole="button"
        disabled={busy}
        onPress={() => go("/learn")}
        style={{ backgroundColor: palette.pomegranate, padding: 14, borderRadius: 999, opacity: busy ? 0.5 : 1 }}
      >
        <Text style={{ color: palette.paper, textAlign: "center", fontWeight: "600" }}>{t(lang, "onboarding.skip")}</Text>
      </Pressable>
      <Pressable
        testID="start-placement"
        accessibilityRole="button"
        disabled={busy}
        onPress={() => go("/placement")}
        style={{ borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 14, borderRadius: 999 }}
      >
        <Text style={{ color: palette.ink, textAlign: "center" }}>{t(lang, "onboarding.placement")}</Text>
      </Pressable>
      <Text style={{ fontSize: 13, color: palette.inkSoft }}>{t(lang, "onboarding.demoNote")}</Text>
    </ScrollView>
  );
}
