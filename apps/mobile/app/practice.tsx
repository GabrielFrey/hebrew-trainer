import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Shell } from "@/components/Shell";
import { api, type PathStage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loc, t } from "@/lib/i18n";
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
  const [titles, setTitles] = useState<Record<string, Record<string, string>>>({});
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ due_cards: number; weak_lessons: string[]; hearts: number }>("/practice")
      .then(setData)
      .catch(() => setError("unavailable"));
    api<{ stages: PathStage[] }>("/curriculum/path")
      .then((path) => {
        const map: Record<string, Record<string, string>> = {};
        for (const stage of path.stages) {
          for (const node of [...stage.nodes, stage.checkpoint]) {
            if (node) map[node.slug] = node.title;
          }
        }
        setTitles(map);
      })
      .catch(() => undefined);
  }, []);
  if (error) return <Text testID="screen-unavailable" style={{ color: palette.inkSoft }}>{t(lang, "states.unavailable")}</Text>;
  if (!data) return <Text>{t(lang, "states.loading")}</Text>;
  return (
    <View testID="practice" style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 8 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>{t(lang, "practice.title")}</Text>
      <Text>
        {t(lang, "practice.due")}: {data.due_cards} · ❤ {data.hearts}
      </Text>
      <Text>{t(lang, "practice.weak")}</Text>
      {data.weak_lessons.length ? (
        data.weak_lessons.map((slug) => (
          <Pressable
            key={slug}
            accessibilityRole="button"
            accessibilityLabel={t(lang, "practice.open")}
            onPress={() => router.push(`/learn/${slug}`)}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: palette.indigo }}>{loc(titles[slug], lang) || slug}</Text>
          </Pressable>
        ))
      ) : (
        <Text>{t(lang, "states.empty")}</Text>
      )}
    </View>
  );
}
