/** Daily XP goal bar, after the main-branch daily-goal card. */
import { Text, View } from "react-native";
import { t, type UiLang } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

export function DailyGoal({ lang, xp, goal }: { lang: UiLang; xp: number; goal: number }) {
  const palette = usePalette();
  const pct = goal > 0 ? Math.min(1, xp / goal) : 0;
  const done = xp >= goal && goal > 0;
  return (
    <View testID="daily-goal" style={{ backgroundColor: palette.paper, borderRadius: 20, padding: 12, gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontWeight: "700", color: palette.ink }}>{t(lang, "lesson.dailyGoal")}</Text>
        <Text testID="daily-goal-line" style={{ color: done ? palette.olive : palette.inkSoft }}>
          {done ? t(lang, "lesson.dailyGoalDone") : t(lang, "lesson.dailyGoalLine", { xp, goal })}
        </Text>
      </View>
      <View style={{ height: 10, borderRadius: 999, backgroundColor: palette.sandDeep, overflow: "hidden" }}>
        <View style={{ width: `${Math.round(pct * 100)}%`, height: "100%", backgroundColor: done ? palette.olive : palette.pomegranate }} />
      </View>
    </View>
  );
}
