import { View } from "react-native";
import Svg, { Circle, Path, Rect } from "./svg";

export function BitiMascot({
  mood = "idle",
  size = 88,
}: {
  mood?: "idle" | "happy" | "think" | "sad";
  size?: number;
}) {
  const window = mood === "happy" ? "#F4D35E" : mood === "sad" ? "#C23B3B" : mood === "think" ? "#9AABD4" : "#F6E7C1";
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Biti, a small house mascot">
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Path d="M16 54 L60 18 L104 54 V104 H16 Z" fill="#2C3D6B" />
        <Path d="M28 52 L60 26 L92 52 V96 H28 Z" fill="#F6F1E8" />
        <Rect x="46" y="58" width="28" height="28" rx="6" fill={window} />
        <Circle cx="54" cy="70" r="3.2" fill="#1C1917" />
        <Circle cx="66" cy="70" r="3.2" fill="#1C1917" />
        <Path d="M54 80 Q60 84 66 80" fill="none" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" />
        <Path d="M44 18 L52 14 L56 28 L48 32 Z" fill="#C23B3B" />
      </Svg>
    </View>
  );
}
