import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { HebrewText } from "@/components/HebrewText";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

type Letter = { glyph: string; name: string; final?: string };

export default function Alphabet() {
  return (
    <Shell>
      <AlphaInner />
    </Shell>
  );
}

function AlphaInner() {
  const { lang } = useAuth();
  const palette = usePalette();
  const [print, setPrint] = useState<Letter[]>([]);
  const [look, setLook] = useState<string[][]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ print: Letter[]; lookalikes: string[][]; cursive_note: string }>("/alphabet")
      .then((d) => {
        setPrint(d.print);
        setLook(d.lookalikes);
        setNote(d.cursive_note);
      })
      .catch(() => setError("unavailable"));
  }, []);
  if (error) return <Text testID="screen-unavailable" style={{ color: palette.inkSoft }}>{t(lang, "states.unavailable")}</Text>;
  return (
    <View testID="alphabet" style={{ gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>Alphabet</Text>
      <Text style={{ color: palette.inkSoft }}>{note}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {print.map((l) => (
          <View key={l.glyph} testID={`letter-${l.glyph}`} style={{ width: "30%", backgroundColor: palette.paper, padding: 12, borderRadius: 18, alignItems: "center" }}>
            <HebrewText>{l.glyph}</HebrewText>
            {l.final ? <HebrewText style={{ fontSize: 22, lineHeight: 36 }}>{l.final}</HebrewText> : null}
            <Text style={{ color: palette.inkSoft }}>{l.name}</Text>
          </View>
        ))}
      </View>
      <Text style={{ fontSize: 20, fontWeight: "600", color: palette.ink }}>Lookalikes</Text>
      {look.map((g) => (
        <Text key={g.join()} accessibilityLanguage="he" style={{ backgroundColor: palette.paper, borderRadius: 16, padding: 12, fontSize: 24 }} {...({ lang: "he", dir: "rtl" } as object)}>
          {g.join(" · ")}
        </Text>
      ))}
    </View>
  );
}
