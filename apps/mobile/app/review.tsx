import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { HebrewKeyboard } from "@/components/HebrewKeyboard";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

type Card = { id: string; kind: string; prompt: Record<string, unknown>; step: number; due_day: string };

export default function Review() {
  return (
    <Shell>
      <ReviewInner />
    </Shell>
  );
}

function ReviewInner() {
  const { lang } = useAuth();
  const palette = usePalette();
  const [cards, setCards] = useState<Card[]>([]);
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ cards: Card[] }>("/srs/due")
      .then((d) => setCards(d.cards))
      .catch(() => setError("unavailable"));
  }, []);

  if (error) return <Text testID="screen-unavailable" style={{ color: palette.inkSoft }}>{t(lang, "states.unavailable")}</Text>;
  if (!cards.length) {
    return (
      <View testID="review-empty" style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>{t(lang, "nav.review")}</Text>
        <Text style={{ color: palette.inkSoft }}>{t(lang, "states.empty")} {t(lang, "review.srsHint")}</Text>
      </View>
    );
  }

  const card = cards[0];
  async function send() {
    const res = await api<{ grade: { result: string }; next_due: string }>(`/srs/${card.id}/review`, {
      method: "POST",
      body: JSON.stringify({ value, client_key: `srs-${card.id}` }),
    });
    setMsg(`${res.grade.result} · next ${res.next_due}`);
    setCards(cards.slice(1));
    setValue("");
  }

  return (
    <View testID="review-card" style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>{t(lang, "nav.review")}</Text>
      <Text style={{ color: palette.inkSoft }}>{cards.length} due</Text>
      <Text accessibilityLanguage="he" style={{ fontSize: 32, lineHeight: 48, writingDirection: "rtl", textAlign: "right" }} {...({ lang: "he", dir: "rtl" } as object)}>
        {String(card.prompt.he || card.prompt.id)}
      </Text>
      <HebrewKeyboard value={value} onChange={setValue} />
      <Pressable testID="check-answer" onPress={send} style={{ backgroundColor: palette.indigo, padding: 12, borderRadius: 999 }}>
        <Text style={{ color: palette.paper, textAlign: "center" }}>{t(lang, "lesson.check")}</Text>
      </Pressable>
      {msg ? <Text>{msg}</Text> : null}
    </View>
  );
}
