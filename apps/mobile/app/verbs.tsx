import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { api } from "@/lib/api";

export default function Verbs() {
  const [rows, setRows] = useState<Array<{ root: string; binyan: string; gloss: Record<string, string> }>>([]);
  useEffect(() => {
    api<{ paradigms: Array<{ root: string; binyan: string; gloss: Record<string, string> }> }>("/verbs").then((d) =>
      setRows(d.paradigms),
    );
  }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      {rows.map((r) => (
        <Text key={`${r.root}-${r.binyan}`} style={{ fontSize: 20 }}>
          {r.root} · {r.binyan} · {r.gloss.en}
        </Text>
      ))}
    </ScrollView>
  );
}
