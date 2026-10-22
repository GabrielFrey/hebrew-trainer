import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { BitiMascot } from "@/components/BitiMascot";
import { useAuth } from "@/lib/auth";
import { usePalette } from "@/lib/theme";

export default function Onboarding() {
  const palette = usePalette();
  const { enter } = useAuth();
  const [lang, setLang] = useState<"ru" | "en" | "uk" | "es" | "fr">("ru");
  const [course, setCourse] = useState("he-ru");
  const [motivation, setMotivation] = useState("aliyah");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const copy =
    lang === "ru"
      ? {
          title: "Добро пожаловать в Biti Ivrit",
          tag: "Современный иврит — от первой буквы до живой израильской речи.",
          name: "Как вас зовут?",
          why: "Зачем вы учите иврит?",
          go: "Начать с алефа",
          place: "Короткий тест уровня",
        }
      : {
          title: "Welcome to Biti Ivrit",
          tag: "Modern Hebrew — from the first letter to everyday Israeli life.",
          name: "What should we call you?",
          why: "Why are you learning?",
          go: "Start from Alef",
          place: "Short placement",
        };

  async function go(to: "/learn" | "/placement") {
    setBusy(true);
    setError(null);
    try {
      await enter({
        ui_language: lang,
        display_name: name || (lang === "ru" ? "Ученик" : "Learner"),
        motivation,
        course_id: course,
      });
      router.replace(to);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start");
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
      <BitiMascot mood="happy" size={96} />
      <Text testID="onboarding-title" style={{ fontSize: 32, fontWeight: "700", color: palette.ink }}>
        {copy.title}
      </Text>
      <Text style={{ fontSize: 18, color: palette.inkSoft }}>{copy.tag}</Text>
      <Text style={{ fontWeight: "600", color: palette.ink }}>Interface</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(
          [
            ["ru", "Русский", "he-ru"],
            ["en", "English", "he-en"],
            ["uk", "Українська", "he-uk"],
            ["es", "Español", "he-es"],
            ["fr", "Français", "he-fr"],
          ] as const
        ).map(([code, label, cid]) => (
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
      <Text style={{ fontWeight: "600", color: palette.ink }}>Course</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(["he-ru", "he-uk", "he-en", "he-es", "he-fr"] as const).map((id) => (
          <Pressable key={id} testID={`course-${id}`} onPress={() => setCourse(id)} style={chip(course === id)}>
            <Text style={{ color: course === id ? palette.paper : palette.ink }}>{id}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ color: palette.ink }}>{copy.name}</Text>
      <TextInput
        testID="onboarding-name"
        value={name}
        onChangeText={setName}
        accessibilityLabel={copy.name}
        style={{
          borderWidth: 1,
          borderColor: palette.line,
          backgroundColor: palette.paper,
          borderRadius: 16,
          padding: 12,
          color: palette.ink,
        }}
      />
      <Text style={{ color: palette.ink }}>{copy.why}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(
          [
            ["aliyah", lang === "ru" ? "Репатриация" : "Aliyah"],
            ["work", lang === "ru" ? "Работа" : "Work"],
            ["travel", lang === "ru" ? "Поездки" : "Travel"],
            ["family", lang === "ru" ? "Семья" : "Family"],
          ] as const
        ).map(([id, label]) => (
          <Pressable
            key={id}
            testID={`motivation-${id}`}
            accessibilityRole="button"
            onPress={() => setMotivation(id)}
            style={[chip(motivation === id), { borderRadius: 16 }]}
          >
            <Text style={{ color: motivation === id ? palette.paper : palette.ink }}>{label}</Text>
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
        <Text style={{ color: palette.paper, textAlign: "center", fontWeight: "600" }}>{copy.go}</Text>
      </Pressable>
      <Pressable
        testID="start-placement"
        accessibilityRole="button"
        disabled={busy}
        onPress={() => go("/placement")}
        style={{ borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 14, borderRadius: 999 }}
      >
        <Text style={{ color: palette.ink, textAlign: "center" }}>{copy.place}</Text>
      </Pressable>
      <Text style={{ fontSize: 13, color: palette.inkSoft }}>Demo sign-in is development-only. Production requires OIDC.</Text>
    </ScrollView>
  );
}
