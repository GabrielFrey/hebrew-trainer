import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { api, setToken } from "@/lib/api";

export default function Home() {
  const [err, setErr] = useState<string | null>(null);
  async function enter() {
    try {
      const data = await api<{ access_token: string }>("/auth/demo", {
        method: "POST",
        body: JSON.stringify({ ui_language: "ru", display_name: "Mobile learner", motivation: "aliyah" }),
      });
      setToken(data.access_token);
      router.push("/learn");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "login failed");
    }
  }
  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "700" }}>Biti Ivrit</Text>
      <Text style={{ fontSize: 18 }}>Modern Hebrew on your phone. Same server as the web path.</Text>
      <Pressable onPress={enter} style={{ backgroundColor: "#C23B3B", padding: 14, borderRadius: 999 }}>
        <Text style={{ color: "#FFFCF7", textAlign: "center" }}>Start from Alef</Text>
      </Pressable>
      <Link href="/alphabet">Alphabet</Link>
      <Link href="/verbs">Verbs</Link>
      {err ? <Text>{err}</Text> : null}
      <Text>API {process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:43180"}</Text>
    </View>
  );
}
