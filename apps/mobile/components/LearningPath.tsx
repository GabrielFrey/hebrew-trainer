import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { I18nManager, Pressable, Text, View } from "react-native";
import { BitiMascot } from "@/components/BitiMascot";
import { useShellScroll } from "@/components/Shell";
import Svg, { Path } from "@/components/svg";
import type { PathNode, PathStage, UiLang } from "@/lib/api";
import { loc, t, tp } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

type NodeState = "locked" | "available" | "current" | "completed";

function nodeState(node: PathNode, currentSlug: string | null): NodeState {
  if (node.completed) return "completed";
  if (!node.unlocked || node.status === "planned") return "locked";
  if (node.slug === currentSlug) return "current";
  return "available";
}

function trailD(points: Array<{ x: number; y: number }>): string {
  if (!points.length) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    d += ` Q ${cx - (b.y - a.y) * 0.16} ${cy + (b.x - a.x) * 0.1} ${b.x} ${b.y}`;
  }
  return d;
}

export function LearningPath({
  stages,
  currentSlug,
  lang,
}: {
  stages: PathStage[];
  currentSlug: string | null;
  lang: UiLang;
}) {
  const palette = usePalette();
  const rtl = I18nManager.isRTL || lang === "he";
  const scroll = useShellScroll();
  const width = 320;
  let offset = 0;
  const layout = stages.map((stage) => {
    const items = [...stage.nodes, stage.checkpoint].filter(Boolean);
    const step = 118;
    const height = items.length * step + 88 + (stage.planned_count ? 28 : 0);
    const y0 = offset;
    offset += height + 24;
    const points = items.map((_, i) => {
      const y = 70 + i * step;
      const wave = Math.sin(i * 0.95 + 0.4) * 72;
      return { x: width / 2 + wave * (rtl ? -1 : 1), y };
    });
    return { stage, items, height, y0, points, step };
  });
  const currentY = useMemo(() => {
    for (const block of layout) {
      const idx = block.items.findIndex((n) => n.slug === currentSlug);
      if (idx >= 0) return block.y0 + block.points[idx].y;
    }
    return 0;
  }, [layout, currentSlug]);

  useEffect(() => {
    scroll?.current?.scrollTo({ y: Math.max(0, currentY - 120), animated: true });
  }, [currentY, scroll]);

  return (
    <View testID="path-trail" style={{ gap: 18 }}>
      {layout.map(({ stage, items, height, points }) => {
        const done = stage.progress.completed;
        const total = Math.max(1, stage.progress.published);
        const pct = Math.round((done / total) * 100);
        return (
          <View key={stage.id} testID={`stage-${stage.id}`}>
            <View
              testID={`stage-header-${stage.id}`}
              style={{
                backgroundColor: palette.paper,
                borderRadius: 24,
                padding: 16,
                borderWidth: 1,
                borderColor: palette.line,
              }}
            >
              <Text style={{ color: palette.inkSoft, fontSize: 12, textTransform: "uppercase" }}>
                {stage.ulpan} · {stage.cefr}
              </Text>
              <Text style={{ color: palette.ink, fontSize: 22, fontWeight: "700" }}>{loc(stage.title, lang)}</Text>
              <Text style={{ color: palette.inkSoft, fontSize: 18 }} {...({ lang: "he" } as object)}>
                {stage.title.he}
              </Text>
              <Text style={{ color: palette.inkSoft, marginTop: 6 }}>
                {done}/{stage.progress.published} · {pct}%
                {stage.badge ? ` · ♛ ${t(lang, "path.badge")}` : ""}
              </Text>
              <View style={{ height: 8, borderRadius: 99, backgroundColor: palette.sandDeep, marginTop: 10, overflow: "hidden" }}>
                <View style={{ width: `${pct}%`, height: "100%", backgroundColor: palette.olive }} />
              </View>
            </View>
            <View style={{ height, marginTop: 8 }}>
              <Svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
                <Path
                  d={trailD(points)}
                  fill="none"
                  stroke={palette.line}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={stage.open ? undefined : "10 12"}
                />
              </Svg>
              {items.map((node, i) => (
                <View
                  key={node.slug}
                  style={{
                    position: "absolute",
                    left: points[i].x - 56,
                    top: points[i].y - 48,
                    width: 112,
                    alignItems: "center",
                  }}
                >
                  <TrailNode node={node} currentSlug={currentSlug} lang={lang} />
                </View>
              ))}
              {stage.planned_count > 0 ? (
                <Text style={{ position: "absolute", bottom: 4, alignSelf: "center", color: palette.inkSoft, fontSize: 12 }}>
                  ··· {tp(lang, "path.morePlanned", stage.planned_count)}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function TrailNode({
  node,
  currentSlug,
  lang,
}: {
  node: PathNode;
  currentSlug: string | null;
  lang: UiLang;
}) {
  const palette = usePalette();
  const state = nodeState(node, currentSlug);
  const gate = node.kind === "checkpoint" || node.kind === "boss" || node.kind === "legendary";
  const open = state !== "locked";
  const word =
    state === "completed"
      ? t(lang, "path.completed")
      : state === "current"
        ? t(lang, "path.current")
        : state === "available"
          ? gate
            ? t(lang, "path.testOut")
            : t(lang, "path.available")
          : t(lang, "path.locked");
  const icon = state === "completed" ? "♛" : gate ? "🏆" : state === "locked" ? "🔒" : "●";
  const border =
    state === "completed" ? palette.gold : state === "current" || state === "available" ? (gate ? palette.pomegranate : palette.indigo) : palette.line;
  return (
    <View>
      {state === "current" ? <BitiMascot size={48} mood="idle" lang={lang} /> : <View style={{ height: 20 }} />}
      <Pressable
        testID={`path-${node.slug}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !open }}
        accessibilityLabel={`${loc(node.title, lang)} ${word}`}
        disabled={!open}
        onPress={() => open && router.push(`/learn/${node.slug}`)}
        style={{
          width: gate ? 76 : 64,
          height: gate ? 76 : 64,
          borderRadius: 999,
          borderWidth: 4,
          borderColor: border,
          backgroundColor: open ? palette.paper : palette.sandDeep,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: palette.ink, fontSize: 18 }}>{gate && state !== "completed" ? "🏆" : icon === "●" ? loc(node.title, lang).slice(0, 1) : icon}</Text>
      </Pressable>
      <Text style={{ textAlign: "center", fontSize: 11, color: palette.ink, marginTop: 4 }}>
        {icon} {word}
      </Text>
    </View>
  );
}
