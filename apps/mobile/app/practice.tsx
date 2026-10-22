import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

export default function Practice() {
  return (
    <Shell>
      <PracticeInner />
    </Shell>
  );
}

function PracticeInner() {
  const { lang } = useAuth();
  const palette = usePalette();
  const [data, setData] = useState<{ due_cards: number; weak_lessons: string[]; hearts: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ due_cards: number; weak_lessons: string[]; hearts: number }>("/practice")
      .then(setData)
      .catch((e) => setError(String(e.message)));
  }, []);
  if (error) return <Text style={{ color: palette.incorrect }}>{error}</Text>;
  if (!data) return <Text>{t(lang, "states.loading")}</Text>;
  return (
    <View testID="practice" style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 8 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>{t(lang, "practice.title")}</Text>
      <Text>
        {t(lang, "practice.due")}: {data.due_cards} · ❤ {data.hearts}
      </Text>
      <Text>{t(lang, "practice.weak")}</Text>
      {data.weak_lessons.length ? data.weak_lessons.map((s) => <Text key={s}>{s}</Text>) : <Text>{t(lang, "states.empty")}</Text>}
    </View>
  );
}
