/** Finger-writing pad, ported from the main-branch app «Иврит с нуля»; Biti palette. */
import { useCallback, useMemo, useRef, useState } from "react";
import { PanResponder, Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Stroke } from "@/lib/handwriting";
import { usePalette } from "@/lib/theme";

export function HandwritingCanvas({
  onChange,
  hint,
  resetKey,
  disabled = false,
}: {
  onChange: (strokes: Stroke[]) => void;
  hint?: string;
  resetKey: string;
  disabled?: boolean;
}) {
  const palette = usePalette();
  const [size, setSize] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [lastReset, setLastReset] = useState(resetKey);
  const active = useRef<Stroke>([]);
  const all = useRef<Stroke[]>([]);
  const side = useRef(0);

  if (lastReset !== resetKey) {
    setLastReset(resetKey);
    setStrokes([]);
    active.current = [];
    all.current = [];
  }

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const s = Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height || e.nativeEvent.layout.width);
    side.current = s;
    setSize(s);
  }, []);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const s = side.current || 1;
          active.current = [{ x: e.nativeEvent.locationX / s, y: e.nativeEvent.locationY / s }];
          all.current = [...all.current, active.current];
          setStrokes(all.current);
        },
        onPanResponderMove: (e) => {
          const s = side.current || 1;
          active.current = [...active.current, { x: e.nativeEvent.locationX / s, y: e.nativeEvent.locationY / s }];
          all.current = [...all.current.slice(0, -1), active.current];
          setStrokes(all.current);
        },
        onPanResponderRelease: () => onChange(all.current),
      }),
    [disabled, onChange],
  );

  const paths = strokes
    .filter((s) => s.length > 0)
    .map((s) => s.map((p, i) => `${i === 0 ? "M" : "L"}${(p.x * size).toFixed(1)} ${(p.y * size).toFixed(1)}`).join(" "));

  return (
    <View
      testID="handwriting-canvas"
      accessibilityLabel={hint}
      onLayout={onLayout}
      style={{
        aspectRatio: 1,
        width: "100%",
        maxWidth: 320,
        alignSelf: "center",
        borderRadius: 24,
        borderWidth: 2,
        borderColor: palette.indigo,
        backgroundColor: palette.paper,
        overflow: "hidden",
      }}
      {...responder.panHandlers}
    >
      {size > 0 ? (
        <Svg width={size} height={size} style={{ position: "absolute", left: 0, top: 0 }} pointerEvents="none">
          <Path d={`M12 ${size * 0.72} L${size - 12} ${size * 0.72}`} stroke={palette.indigo} strokeWidth={2} strokeDasharray="7 8" opacity={0.45} />
          {paths.map((d, i) => (
            <Path key={i} d={d} stroke={palette.ink} strokeWidth={Math.max(8, size * 0.045)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
      ) : null}
      {paths.length === 0 && hint ? (
        <View pointerEvents="none" style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: palette.inkSoft, textAlign: "center" }}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}
