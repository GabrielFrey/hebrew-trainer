import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { api } from "@/lib/api";

export default function Alphabet() {
  const [letters, setLetters] = useState<Array<{ glyph: string; name: string; final?: string }>>([]);
  useEffect(() => {
    api<{ print: Array<{ glyph: string; name: string; final?: string }> }>("/alphabet").then((d) => setLetters(d.print));
  }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {letters.map((l) => (
        <View key={l.glyph} style={{ width: "30%", backgroundColor: "#FFFCF7", padding: 12, borderRadius: 16 }}>
          <Text style={{ fontSize: 32, textAlign: "center" }}>{l.glyph}</Text>
          <Text style={{ textAlign: "center" }}>{l.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
