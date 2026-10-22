import { View } from "react-native";
import type { UiLang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import Svg, { Circle, Ellipse, Line, Path } from "./svg";

export type BitiMood = "idle" | "happy" | "think" | "sad" | "streak";

const NAVY = "#0A1628";
const OUTLINE = "#142033";
const CREAM = "#F6F0E4";
const PLATE = "#E7DCC8";
const CHEEK = "#E8C4B0";
const INK = "#142033";

export function BitiMascot({
  mood = "idle",
  size = 88,
  lang = "en",
}: {
  mood?: BitiMood;
  size?: number;
  lang?: UiLang;
}) {
  const happy = mood === "happy" || mood === "streak";
  const sad = mood === "sad";
  const smile = happy
    ? "M46 72 Q60 85 74 72"
    : sad
      ? "M48 80 Q60 73 72 80"
      : mood === "think"
        ? "M50 76 Q63 80 73 75"
        : "M48 73.5 Q60 81.5 72 73.5";
  const pupilDx = mood === "think" ? 2.2 : 1.4;
  const pupilDy = mood === "think" ? 2.4 : sad ? 1.6 : 1.3;
  const ball = sad ? { cx: 49, cy: 21 } : { cx: 60, cy: 18.8 };
  const mouthW = happy ? 4.6 : 4.2;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={t(lang, `mascot.${mood}`)}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Circle cx="28" cy="58" r="12.4" fill={CREAM} />
        <Circle cx="92" cy="58" r="12.4" fill={CREAM} />
        <Circle cx="28" cy="58" r="10.6" fill={NAVY} />
        <Circle cx="92" cy="58" r="10.6" fill={NAVY} />
        <Circle cx="28" cy="58" r="4.4" fill="#1A2C44" />
        <Circle cx="92" cy="58" r="4.4" fill="#1A2C44" />
        <Ellipse cx="60" cy="90.5" rx="20" ry="12.2" fill={OUTLINE} />
        <Ellipse cx="60" cy="90.5" rx="17.8" ry="10.4" fill={CREAM} />
        <Path d="M42 84 Q32 93 40 101" fill="none" stroke={NAVY} strokeWidth="10.4" strokeLinecap="round" />
        <Path d="M78 84 Q88 93 80 101" fill="none" stroke={NAVY} strokeWidth="10.4" strokeLinecap="round" />
        <Circle cx="60" cy="58" r="31.2" fill={OUTLINE} />
        <Circle cx="60" cy="58" r="28.6" fill={CREAM} />
        <Path d="M39 48 Q60 41.5 81 48" fill="none" stroke={PLATE} strokeWidth="2.4" strokeLinecap="round" />
        <Ellipse cx="41" cy="68.5" rx="6.4" ry="3.8" fill={CHEEK} />
        <Ellipse cx="79" cy="68.5" rx="6.4" ry="3.8" fill={CHEEK} />
        <Line
          x1="60"
          y1="29.5"
          x2={sad ? 51 : 60}
          y2={sad ? 22 : 19.5}
          stroke={NAVY}
          strokeWidth="4.6"
          strokeLinecap="round"
        />
        <Circle
          cx={ball.cx}
          cy={ball.cy}
          r="5.4"
          fill={mood === "streak" ? "#FCD34D" : "#B45309"}
          stroke={OUTLINE}
          strokeWidth="1.8"
        />
        {mood === "streak" ? (
          <>
            <Path
              d="M26 30 L28.5 36 L35 34 L30 39 L31 46 L26 42 L20 46 L22 39 L17 34 L24 36 Z"
              fill="#FCD34D"
              stroke={OUTLINE}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <Path
              d="M90 26 L92 31.5 L98 30 L94 35 L95 41 L90 37.5 L85 41 L86.5 35 L82 30 L88 31.5 Z"
              fill="#FCD34D"
              stroke={OUTLINE}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </>
        ) : null}
        <Circle cx="45.5" cy="55" r="12.4" fill={OUTLINE} />
        <Circle cx="74.5" cy="55" r="12.4" fill={OUTLINE} />
        <Circle cx="45.5" cy="55" r="9.7" fill="#FFFFFF" />
        <Circle cx="74.5" cy="55" r="9.7" fill="#FFFFFF" />
        <Circle cx={45.5 + pupilDx} cy={55 + pupilDy} r="7.3" fill={INK} />
        <Circle cx={74.5 + pupilDx} cy={55 + pupilDy} r="7.3" fill={INK} />
        <Circle cx={45.5 + pupilDx + 2.4} cy={55 + pupilDy - 2.6} r="2.7" fill="#FFFFFF" />
        <Circle cx={74.5 + pupilDx + 2.4} cy={55 + pupilDy - 2.6} r="2.7" fill="#FFFFFF" />
        <Circle cx={45.5 + pupilDx - 2.6} cy={55 + pupilDy + 2.4} r="1.15" fill="#FFFFFF" />
        <Circle cx={74.5 + pupilDx - 2.6} cy={55 + pupilDy + 2.4} r="1.15" fill="#FFFFFF" />
        <Path d={smile} fill="none" stroke={INK} strokeWidth={mouthW} strokeLinecap="round" />
        {mood === "happy" ? (
          <Path
            d="M86 42 L91 33 L96 42"
            fill="none"
            stroke="#0C5F58"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
    </View>
  );
}
