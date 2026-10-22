import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";

type Node = { slug: string; title: Record<string, string>; unlocked: boolean; completed: boolean; kind: string };

export default function Learn() {
  const [nodes, setNodes] = useState<Node[]>([]);
  useEffect(() => {
    api<{ nodes: Node[] }>("/curriculum/path").then((d) => setNodes(d.nodes));
  }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      {nodes.map((n) => (
        <Pressable
          key={n.slug}
          disabled={!n.unlocked && !n.completed}
          onPress={() => router.push(`/lesson/${n.slug}`)}
          style={{
            padding: 14,
            borderRadius: 18,
            backgroundColor: n.completed ? "#E8F0E6" : n.unlocked ? "#FFFCF7" : "#E8DFD0",
          }}
        >
          <Text>{n.kind === "boss" ? "Boss · " : ""}{n.title.ru || n.title.en}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
