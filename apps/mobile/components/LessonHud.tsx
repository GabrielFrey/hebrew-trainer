/** Lesson progress bar + hearts + combo, after the main-branch lesson HUD. */
import { Text, View } from "react-native";
import { t, type UiLang } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

export function LessonHud({ lang, index, total, hearts, combo }: { lang: UiLang; index: number; total: number; hearts: number | null; combo: number }) {
  const palette = usePalette();
  const pct = total ? Math.min(1, index / total) : 0;
  return (
    <View testID="lesson-hud" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        testID="lesson-progress"
        accessibilityRole="progressbar"
        accessibilityLabel={t(lang, "lesson.progress", { n: Math.min(total, index + 1), total })}
        accessibilityValue={{ min: 0, max: total, now: index }}
        style={{ flex: 1, height: 14, borderRadius: 999, backgroundColor: palette.sandDeep, overflow: "hidden" }}
      >
        <View style={{ width: `${Math.round(pct * 100)}%`, height: "100%", borderRadius: 999, backgroundColor: palette.olive }} />
      </View>
      {combo >= 2 ? (
        <Text testID="lesson.comboCount" style={{ color: palette.gold, fontWeight: "700" }} accessibilityLabel={t(lang, "lesson.combo", { n: combo })}>
          🔥{combo}
        </Text>
      ) : null}
      {hearts != null ? (
        <Text testID="lesson-hearts" style={{ color: palette.pomegranate, fontWeight: "700" }} accessibilityLabel={t(lang, "lesson.hearts", { n: hearts })}>
          ♥ {hearts}
        </Text>
      ) : null}
    </View>
  );
}
