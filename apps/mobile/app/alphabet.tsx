import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { HebrewText } from "@/components/HebrewText";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loc, t } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

type Letter = {
  id: string;
  glyph: string;
  final?: string | null;
  name_he?: string;
  name: string | Record<string, string>;
  translit?: string;
  sound?: Record<string, string>;
  example?: { he: string; translit: string; gloss: Record<string, string> };
};
type Variant = { id: string; pair: string[]; sound: Record<string, string>; translit: string[] };
type Alpha = { print: Letter[]; finals?: Array<{ glyph: string; base: string }>; variants?: Variant[]; lookalikes: string[][]; cursive_note: string };

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
  const [data, setData] = useState<Alpha | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<Alpha>("/alphabet")
      .then(setData)
      .catch(() => setError("unavailable"));
  }, []);
  if (error) return <Text testID="screen-unavailable" style={{ color: palette.inkSoft }}>{t(lang, "states.unavailable")}</Text>;
  if (!data) return null;
  const name = (l: Letter) => (typeof l.name === "string" ? l.name : loc(l.name, lang));
  const card = { backgroundColor: palette.paper, borderRadius: 18, padding: 12, gap: 4 } as const;
  return (
    <View testID="alphabet" style={{ gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>Alphabet</Text>
      <Text style={{ color: palette.inkSoft }}>{data.cursive_note}</Text>
      {data.print.map((l) => (
        <View key={l.glyph} testID={`letter-${l.glyph}`} style={card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: palette.ink, fontWeight: "600" }}>
              {name(l)}
              {l.translit ? ` · ${l.translit}` : ""}
            </Text>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              {l.final ? <HebrewText style={{ fontSize: 28, lineHeight: 44, color: palette.inkSoft }}>{l.final}</HebrewText> : null}
              <HebrewText style={{ fontSize: 40, lineHeight: 60 }}>{l.glyph}</HebrewText>
            </View>
          </View>
          {l.name_he ? <HebrewText style={{ fontSize: 20, lineHeight: 34 }}>{l.name_he}</HebrewText> : null}
          {l.sound ? <Text style={{ color: palette.inkSoft }}>{loc(l.sound, lang)}</Text> : null}
          {l.example ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: palette.inkSoft }}>
                {l.example.translit} — {loc(l.example.gloss, lang)}
              </Text>
              <HebrewText style={{ fontSize: 22, lineHeight: 38 }}>{l.example.he}</HebrewText>
            </View>
          ) : null}
        </View>
      ))}
      {data.finals?.length ? (
        <>
          <Text style={{ fontSize: 20, fontWeight: "600", color: palette.ink }}>Final forms</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {data.finals.map((f) => (
              <View key={f.glyph} testID={`final-${f.glyph}`} style={{ ...card, width: "30%", alignItems: "center" }}>
                <HebrewText style={{ fontSize: 32, lineHeight: 50, textAlign: "center" }}>{`${f.base} → ${f.glyph}`}</HebrewText>
              </View>
            ))}
          </View>
        </>
      ) : null}
      {data.variants?.length ? (
        <>
          <Text style={{ fontSize: 20, fontWeight: "600", color: palette.ink }}>Dagesh · שׁ / שׂ</Text>
          {data.variants.map((v) => (
            <View key={v.id} testID={`variant-${v.id}`} style={{ ...card, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: palette.inkSoft }}>
                {v.translit.join(" / ")} · {loc(v.sound, lang)}
              </Text>
              <HebrewText style={{ fontSize: 32, lineHeight: 50 }}>{v.pair.join("  ")}</HebrewText>
            </View>
          ))}
        </>
      ) : null}
      <Text style={{ fontSize: 20, fontWeight: "600", color: palette.ink }}>Lookalikes</Text>
      {data.lookalikes.map((g) => (
        <Text key={g.join()} accessibilityLanguage="he" style={{ backgroundColor: palette.paper, borderRadius: 16, padding: 12, fontSize: 24 }} {...({ lang: "he", dir: "rtl" } as object)}>
          {g.join(" · ")}
        </Text>
      ))}
    </View>
  );
}
