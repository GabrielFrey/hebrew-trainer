import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Shell } from "@/components/Shell";
import { api, type PathNode } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loc, t } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

export default function Learn() {
  return (
    <Shell>
      <LearnInner />
    </Shell>
  );
}

function LearnInner() {
  const { lang } = useAuth();
  const palette = usePalette();
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ nodes: PathNode[] }>("/curriculum/path")
      .then((d) => setNodes(d.nodes))
      .catch((e) => setError(String(e.message)));
  }, []);

  if (error) return <Text style={{ color: palette.incorrect }}>{error}</Text>;
  if (!nodes.length) return <Text>{t(lang, "states.loading")}</Text>;

  return (
    <View testID="learn-path" style={{ gap: 10 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>{t(lang, "nav.learn")}</Text>
      {nodes.map((node, i) => {
        const open = node.unlocked || node.completed;
        return (
          <Pressable
            key={node.slug}
            testID={`path-${node.slug}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: !open }}
            disabled={!open}
            onPress={() => open && router.push(`/learn/${node.slug}`)}
            style={{
              padding: 14,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: node.completed ? palette.olive : open ? palette.indigo : palette.line,
              backgroundColor: open ? palette.paper : palette.sandDeep,
            }}
          >
            <Text style={{ fontSize: 12, color: palette.inkSoft, textTransform: "uppercase" }}>
              {node.kind === "boss" ? "Boss" : node.track} · {node.level}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "600", color: palette.ink }}>
              {i + 1}. {loc(node.title, lang)}
            </Text>
            {!open ? <Text style={{ color: palette.inkSoft }}>{t(lang, "lesson.locked")}</Text> : null}
            {node.completed ? (
              <Text style={{ color: palette.correct }}>✓ {Math.round((node.accuracy || 0) * 100)}%</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
