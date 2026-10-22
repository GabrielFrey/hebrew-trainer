import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { HebrewText } from "@/components/HebrewText";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

type Paradigm = {
  root: string;
  binyan: string;
  gloss: Record<string, string>;
  infinitive: string;
  infinitive_pointed: string;
  present: Record<string, { plain: string; pointed: string }>;
};

export default function Verbs() {
  return (
    <Shell>
      <VerbsInner />
    </Shell>
  );
}

function VerbsInner() {
  const { lang } = useAuth();
  const palette = usePalette();
  const [items, setItems] = useState<Paradigm[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ paradigms: Paradigm[] }>("/verbs")
      .then((d) => setItems(d.paradigms))
      .catch(() => setError("unavailable"));
  }, []);
  if (error) return <Text testID="screen-unavailable" style={{ color: palette.inkSoft }}>{t(lang, "states.unavailable")}</Text>;
  return (
    <View testID="verbs" style={{ gap: 10 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>Verb explorer</Text>
      <Text style={{ color: palette.inkSoft }}>Root → binyan → present table. Seven binyanim represented.</Text>
      {items.map((p) => {
        const key = `${p.root}-${p.binyan}`;
        return (
          <View key={key} style={{ backgroundColor: palette.paper, borderRadius: 22, padding: 14, gap: 6 }}>
            <Pressable testID={`verb-${p.root}`} onPress={() => setOpen(open === key ? null : key)} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text accessibilityLanguage="he" style={{ fontSize: 22 }} {...({ lang: "he", dir: "rtl" } as object)}>
                {p.root}
              </Text>
              <Text style={{ color: palette.inkSoft }}>{p.binyan}</Text>
            </Pressable>
            <Text style={{ color: palette.ink }}>{p.gloss.en}</Text>
            {open === key
              ? Object.entries(p.present).map(([slot, forms]) => (
                  <View key={slot} style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 6 }}>
                    <Text style={{ color: palette.inkSoft }}>{slot}</Text>
                    <HebrewText pointed={forms.pointed}>{forms.plain}</HebrewText>
                  </View>
                ))
              : null}
            {open === key ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: palette.inkSoft }}>inf.</Text>
                <HebrewText pointed={p.infinitive_pointed}>{p.infinitive}</HebrewText>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
