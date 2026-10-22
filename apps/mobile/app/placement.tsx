import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { HebrewKeyboard } from "@/components/HebrewKeyboard";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loc } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

export default function Placement() {
  return (
    <Shell>
      <PlaceInner />
    </Shell>
  );
}

function PlaceInner() {
  const { lang } = useAuth();
  const palette = usePalette();
  const [items, setItems] = useState<Array<{ id: string; prompt: Record<string, string> }>>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ items: Array<{ id: string; prompt: Record<string, string> }> }>("/placement")
      .then((d) => setItems(d.items))
      .catch((e) => setError(String(e.message)));
  }, []);
  async function submit() {
    await api("/placement", { method: "POST", body: JSON.stringify({ answers }) });
    router.replace("/learn");
  }
  return (
    <View testID="placement" style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>Placement</Text>
      <Text style={{ color: palette.inkSoft }}>Skippable. Type Hebrew — transliteration is not graded.</Text>
      {error ? <Text style={{ color: palette.incorrect }}>{error}</Text> : null}
      {items.map((item) => (
        <View key={item.id} style={{ gap: 8 }}>
          <Text>{loc(item.prompt, lang)}</Text>
          <HebrewKeyboard value={answers[item.id] || ""} onChange={(v) => setAnswers({ ...answers, [item.id]: v })} />
        </View>
      ))}
      <Pressable testID="placement-submit" onPress={submit} style={{ backgroundColor: palette.indigo, padding: 12, borderRadius: 999 }}>
        <Text style={{ color: palette.paper, textAlign: "center" }}>Submit</Text>
      </Pressable>
      <Pressable testID="placement-skip" onPress={() => router.replace("/learn")} style={{ borderWidth: 1, borderColor: palette.line, padding: 12, borderRadius: 999 }}>
        <Text style={{ textAlign: "center" }}>Skip</Text>
      </Pressable>
    </View>
  );
}
