import { BlurView } from "expo-blur";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { type ReactNode, useEffect, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { usePalette } from "./theme";

function callFlag(fn: unknown): boolean {
  try {
    return typeof fn === "function" ? Boolean((fn as () => boolean)()) : false;
  } catch {
    return false;
  }
}

export function glassBackend(): "liquid" | "blur" | "solid" {
  const liquid = Platform.OS === "ios" && (callFlag(isLiquidGlassAvailable) || callFlag(isGlassEffectAPIAvailable));
  if (liquid) return "liquid";
  if (Platform.OS === "ios" || Platform.OS === "android") return "blur";
  return "solid";
}

/** Chrome only — never put dense Hebrew lesson text on glass (ADR 0004 / Apple HIG). */
export function GlassSurface({
  children,
  style,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const palette = usePalette();
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const info = AccessibilityInfo as typeof AccessibilityInfo & {
      isReduceTransparencyEnabled?: () => Promise<boolean>;
    };
    info.isReduceTransparencyEnabled?.().then(setReduce).catch(() => setReduce(false));
  }, []);

  const backend = reduce ? "solid" : glassBackend();

  if (backend === "liquid") {
    return (
      <GlassView testID={testID} style={style} glassEffectStyle="regular">
        {children}
      </GlassView>
    );
  }
  if (backend === "blur") {
    return (
      <BlurView testID={testID} intensity={36} tint="default" style={[styles.blur, { overflow: "hidden" }, style]}>
        {children}
      </BlurView>
    );
  }
  return (
    <View
      testID={testID}
      style={[
        styles.solid,
        { backgroundColor: palette.glass, borderColor: palette.line },
        Platform.OS === "web" ? styles.webGlass : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  blur: { borderRadius: 22 },
  solid: { borderRadius: 22, borderWidth: 1 },
  webGlass: {
    // CSS backdrop-filter is applied via className on web export screenshots.
    ...(Platform.OS === "web" ? ({ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" } as object) : {}),
  },
});
