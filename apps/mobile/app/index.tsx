import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { BitiMascot } from "@/components/BitiMascot";
import { useAuth } from "@/lib/auth";
import { t, type UiLang } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

const LANGS: { code: UiLang; label: string; course: string }[] = [
  { code: "ru", label: "Русский", course: "he-ru" },
  { code: "en", label: "English", course: "he-en" },
  { code: "uk", label: "Українська", course: "he-uk" },
  { code: "es", label: "Español", course: "he-es" },
  { code: "fr", label: "Français", course: "he-fr" },
];

export default function Onboarding() {
  const palette = usePalette();
  const { enter } = useAuth();
  const [lang, setLang] = useState<UiLang>("ru");
  const [course, setCourse] = useState("he-ru");
  const [motivation, setMotivation] = useState("aliyah");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go(to: "/learn" | "/placement") {
    setBusy(true);
    setError(null);
    try {
      await enter({
        ui_language: lang,
        display_name: name || t(lang, "onboarding.learner"),
        motivation,
        course_id: course,
      });
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
    <ScrollView testID="onboarding" contentContainerStyle={{ padding: 24, gap: 16, backgroundColor: palette.sand }}>
      <BitiMascot mood="happy" size={96} lang={lang} />
      <Text testID="onboarding-title" style={{ fontSize: 32, fontWeight: "700", color: palette.ink }}>
        {t(lang, "onboarding.title")}
      </Text>
      <Text style={{ fontSize: 18, color: palette.inkSoft }}>{t(lang, "brand.tagline")}</Text>
      <Text style={{ fontWeight: "600", color: palette.ink }}>{t(lang, "onboarding.language")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {LANGS.map(({ code, label, course: cid }) => (
          <Pressable
            key={code}
            testID={`lang-${code}`}
            accessibilityRole="button"
            onPress={() => {
              setLang(code);
              setCourse(cid);
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
      {error ? (
        <Text testID="onboarding-error" style={{ color: palette.incorrect }}>
          {error}
        </Text>
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
      <Text style={{ fontSize: 13, color: palette.inkSoft }}>Demo sign-in is development-only. Production requires OIDC.</Text>
    </ScrollView>
  );
}
