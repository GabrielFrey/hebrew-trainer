import { View } from "react-native";
import Svg, { Circle, Ellipse, Line, Path } from "./svg";

export type BitiMood = "idle" | "happy" | "think" | "sad" | "streak";

const LABELS: Record<BitiMood, string> = {
  idle: "Biti, a small robot mascot, waiting",
  happy: "Biti celebrating a correct answer",
  think: "Biti thinking about an almost-correct answer",
  sad: "Biti encouraging you after a mistake",
  streak: "Biti celebrating a streak",
};

export function BitiMascot({
  mood = "idle",
  size = 88,
}: {
  mood?: BitiMood;
  size?: number;
}) {
  const smile =
    mood === "happy" || mood === "streak"
      ? "M46 78 Q60 92 74 78"
      : mood === "sad"
        ? "M48 86 Q60 76 72 86"
        : mood === "think"
          ? "M50 82 Q64 86 74 80"
          : "M48 80 Q60 88 72 80";
  const pupilY = mood === "think" ? 56 : 58;
  const ball = mood === "sad" ? { cx: 46, cy: 8 } : { cx: 60, cy: 6 };
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={LABELS[mood]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Circle cx="32" cy="52" r="10" fill="#1B3A5F" />
        <Circle cx="88" cy="52" r="10" fill="#1B3A5F" />
        <Ellipse cx="60" cy="92" rx="28" ry="20" fill="#F6F0E4" />
        <Path d="M34 86 Q28 100 38 108" fill="#1B3A5F" />
        <Path d="M86 86 Q92 100 82 108" fill="#1B3A5F" />
        <Circle cx="60" cy="52" r="34" fill="#F6F0E4" />
        <Line
          x1="60"
          y1="22"
          x2={mood === "sad" ? 48 : 60}
          y2={mood === "sad" ? 10 : 8}
          stroke="#1B3A5F"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Circle cx={ball.cx} cy={ball.cy} r="6" fill={mood === "streak" ? "#FCD34D" : "#B45309"} />
        {mood === "streak" ? (
          <>
            <Path d="M18 28 L22 36 L30 32 L22 40 L18 48 L14 40 L6 32 L14 36 Z" fill="#FCD34D" />
            <Path d="M96 22 L99 28 L106 26 L100 32 L98 40 L94 32 L88 26 L94 28 Z" fill="#FCD34D" />
          </>
        ) : null}
        <Circle cx="46" cy="56" r="11" fill="#FFFFFF" />
        <Circle cx="74" cy="56" r="11" fill="#FFFFFF" />
        <Circle cx="48" cy={pupilY} r="5.5" fill="#142033" />
        <Circle cx="76" cy={pupilY} r="5.5" fill="#142033" />
        <Circle cx="50" cy={pupilY - 2} r="1.6" fill="#FFFFFF" />
        <Circle cx="78" cy={pupilY - 2} r="1.6" fill="#FFFFFF" />
        <Path d={smile} fill="none" stroke="#142033" strokeWidth="3.2" strokeLinecap="round" />
        {mood === "happy" ? (
          <Path d="M86 44 L90 36 L94 44" fill="none" stroke="#0C5F58" strokeWidth="3" strokeLinecap="round" />
        ) : null}
      </Svg>
    </View>
  );
}
