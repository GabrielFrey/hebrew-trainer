import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { api } from "@/lib/api";

type Lesson = {
  title: Record<string, string>;
  explanation: Record<string, string>;
  exercises: Array<{ id: string; type: string; prompt: Record<string, string>; choices?: Array<Record<string, string>> }>;
  audio: { capability: string };
};

export default function LessonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [attempt, setAttempt] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const data = await api<Lesson>(`/lessons/${slug}`);
      const started = await api<{ attempt_id: string }>(`/lessons/${slug}/start`, { method: "POST" });
      setLesson(data);
      setAttempt(started.attempt_id);
    })();
  }, [slug]);
  if (!lesson) return <Text>Loading…</Text>;
  const ex = lesson.exercises[idx];
  async function check() {
    if (!attempt || !ex) return;
    const res = await api<{ grade: { result: string } }>(`/attempts/${attempt}/submit`, {
      method: "POST",
      body: JSON.stringify({ exercise_id: ex.id, value, client_key: `${attempt}-${ex.id}` }),
    });
    setResult(res.grade.result);
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24 }}>{lesson.title.ru || lesson.title.en}</Text>
      <Text>{lesson.explanation.ru || lesson.explanation.en}</Text>
      {lesson.audio.capability === "unavailable" ? <Text>Audio unavailable — no TTS key.</Text> : null}
      <Text>{ex?.prompt.ru || ex?.prompt.en}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        style={{ borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 28, textAlign: "right" }}
        placeholder="עברית"
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(ex?.choices || []).map((c) => (
          <Pressable key={c.id} onPress={() => setValue(c.id)} style={{ padding: 10, backgroundColor: "#FFFCF7", borderRadius: 12 }}>
            <Text>{c.he || c.en || c.id}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={check} style={{ backgroundColor: "#2C3D6B", padding: 12, borderRadius: 999 }}>
        <Text style={{ color: "#fff", textAlign: "center" }}>Check</Text>
      </Pressable>
      {result ? <Text>{result}</Text> : null}
      {result ? (
        <Pressable
          onPress={() => {
            setResult(null);
            setValue("");
            setIdx((i) => Math.min(i + 1, lesson.exercises.length - 1));
          }}
        >
          <Text>Next</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
