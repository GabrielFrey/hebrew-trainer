import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { DailyGoal } from "@/components/DailyGoal";
import { LearningPath } from "@/components/LearningPath";
import { Shell } from "@/components/Shell";
import { api, type PathNode, type PathStage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";
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
  const [stages, setStages] = useState<PathStage[]>([]);
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [daily, setDaily] = useState<{ xp: number; goal: number } | null>(null);

  useEffect(() => {
    api<{ stages?: PathStage[]; nodes: PathNode[]; current_slug?: string; daily?: { xp: number; goal: number } }>("/curriculum/path")
      .then((d) => {
        setDaily(d.daily || null);
        setStages(d.stages || []);
        setNodes(d.nodes);
        setCurrentSlug(d.current_slug || null);
      })
      .catch((e) => setError(String(e.message)));
  }, []);

  if (error) {
    return (
      <View style={{ gap: 12 }}>
        <Text testID="learn-error" style={{ color: palette.inkSoft }}>
          {t(lang, "states.error")}
        </Text>
        <Pressable
          testID="learn-retry"
          onPress={() => {
            setError(null);
            api<{ stages?: PathStage[]; nodes: PathNode[]; current_slug?: string }>("/curriculum/path")
              .then((d) => {
                setStages(d.stages || []);
                setNodes(d.nodes);
                setCurrentSlug(d.current_slug || null);
              })
              .catch((e) => setError(String(e.message)));
          }}
        >
          <Text style={{ color: palette.indigo, fontWeight: "600" }}>{t(lang, "onboarding.retry")}</Text>
        </Pressable>
      </View>
    );
  }
  if (!nodes.length && !stages.length) return <Text>{t(lang, "states.loading")}</Text>;

  return (
    <View testID="learn-path" style={{ gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>{t(lang, "nav.learn")}</Text>
      <Text style={{ color: palette.inkSoft }}>{t(lang, "path.intro")}</Text>
      {daily ? <DailyGoal lang={lang} xp={daily.xp} goal={daily.goal} /> : null}
      {stages.length ? <LearningPath stages={stages} currentSlug={currentSlug} lang={lang} /> : null}
    </View>
  );
}
