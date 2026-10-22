import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { HebrewKeyboard } from "@/components/HebrewKeyboard";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loc, t } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

type PlacementResult = {
  score: number;
  level: string;
  total?: number;
  stage?: { id: string; ulpan: string; cefr: string; title: Record<string, string> };
};

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
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PlacementResult | null>(null);

  const load = useCallback(() => {
    setError(null);
    api<{ items: Array<{ id: string; prompt: Record<string, string> }> }>("/placement")
      .then((d) => setItems(d.items))
      .catch((e) => setError(e instanceof Error ? e.message : t(lang, "states.error")));
  }, [lang]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<PlacementResult>("/placement", { method: "POST", body: JSON.stringify({ answers }) });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(lang, "states.error"));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    const stage = result.stage ? `${loc(result.stage.title, lang) || result.stage.ulpan} (${result.stage.cefr})` : result.level;
    return (
      <View testID="placement-result" style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>{t(lang, "placement.resultTitle")}</Text>
        <Text testID="placement-level" style={{ fontSize: 22, color: palette.indigo, fontWeight: "600" }}>{stage}</Text>
        <Text style={{ color: palette.inkSoft }}>
          {t(lang, "placement.resultBody", { score: result.score, total: result.total ?? items.length, stage })}
        </Text>
        <Pressable testID="placement-continue" onPress={() => router.replace("/learn")} style={{ backgroundColor: palette.indigo, padding: 12, borderRadius: 999 }}>
          <Text style={{ color: palette.paper, textAlign: "center" }}>{t(lang, "placement.continue")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View testID="placement" style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>{t(lang, "placement.title")}</Text>
      <Text style={{ color: palette.inkSoft }}>{t(lang, "placement.hint")}</Text>
      {error ? (
        <View style={{ gap: 8 }}>
          <Text testID="placement-error" style={{ color: palette.incorrect }}>
            {error}
          </Text>
          <Pressable testID="placement-retry" onPress={load} style={{ borderWidth: 1, borderColor: palette.line, padding: 12, borderRadius: 999 }}>
            <Text style={{ textAlign: "center" }}>{t(lang, "onboarding.retry")}</Text>
          </Pressable>
        </View>
      ) : null}
      {items.map((item) => (
        <View key={item.id} style={{ gap: 8 }}>
          <Text>{loc(item.prompt, lang)}</Text>
          <HebrewKeyboard value={answers[item.id] || ""} onChange={(v) => setAnswers({ ...answers, [item.id]: v })} />
        </View>
      ))}
      <Pressable
        testID="placement-submit"
        disabled={busy}
        onPress={submit}
        style={{ backgroundColor: palette.indigo, padding: 12, borderRadius: 999, opacity: busy ? 0.5 : 1 }}
      >
        <Text style={{ color: palette.paper, textAlign: "center" }}>{t(lang, "placement.submit")}</Text>
      </Pressable>
      <Pressable testID="placement-skip" onPress={() => router.replace("/learn")} style={{ borderWidth: 1, borderColor: palette.line, padding: 12, borderRadius: 999 }}>
        <Text style={{ textAlign: "center" }}>{t(lang, "placement.skip")}</Text>
      </Pressable>
    </View>
  );
}
