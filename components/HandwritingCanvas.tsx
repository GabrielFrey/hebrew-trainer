import { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { radius, spacing } from '@/constants/theme';
import { AppText } from '@/components/Themed';
import type { Stroke } from '@/lib/handwriting';
import { usePalette } from '@/lib/theme';
import { useI18n } from '@/lib/use-i18n';

export type HandwritingCanvasHandle = {
  clear: () => void;
};

/**
 * Холст для письма пальцем. Координаты отдаются наружу в долях стороны
 * холста, поэтому распознаватель не зависит от размера экрана.
 */
export function HandwritingCanvas({
  onChange,
  disabled = false,
  hint,
  resetKey,
}: {
  onChange: (strokes: Stroke[]) => void;
  disabled?: boolean;
  hint?: string;
  /** Смена значения очищает холст. */
  resetKey: string;
}) {
  const palette = usePalette();
  const { t } = useI18n();
  const [size, setSize] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [lastReset, setLastReset] = useState(resetKey);
  const activeStroke = useRef<Stroke>([]);
  const strokesRef = useRef<Stroke[]>([]);
  const sizeRef = useRef(0);

  if (lastReset !== resetKey) {
    setLastReset(resetKey);
    setStrokes([]);
    activeStroke.current = [];
    strokesRef.current = [];
  }

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const side = Math.min(
      event.nativeEvent.layout.width,
      event.nativeEvent.layout.height || event.nativeEvent.layout.width
    );
    sizeRef.current = side;
    setSize(side);
  }, []);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (event) => {
          const side = sizeRef.current || 1;
          activeStroke.current = [
            {
              x: event.nativeEvent.locationX / side,
              y: event.nativeEvent.locationY / side,
            },
          ];
          strokesRef.current = [...strokesRef.current, activeStroke.current];
          setStrokes(strokesRef.current);
        },
        onPanResponderMove: (event) => {
          const side = sizeRef.current || 1;
          const point = {
            x: event.nativeEvent.locationX / side,
            y: event.nativeEvent.locationY / side,
          };
          activeStroke.current = [...activeStroke.current, point];
          strokesRef.current = [...strokesRef.current.slice(0, -1), activeStroke.current];
          setStrokes(strokesRef.current);
        },
        onPanResponderRelease: () => {
          // onChange нельзя вызывать внутри обновления состояния: обработчик
          // родителя тронет его state прямо во время рендера этого компонента.
          onChange(strokesRef.current);
        },
      }),
    [disabled, onChange]
  );

  const paths = strokes
    .filter((stroke) => stroke.length > 0)
    .map((stroke) =>
      stroke
        .map((point, index) => {
          const x = (point.x * size).toFixed(1);
          const y = (point.y * size).toFixed(1);
          return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
        })
        .join(' ')
    );

  const empty = strokes.every((stroke) => stroke.length === 0);

  return (
    <View
      accessibilityLabel={t('canvas.a11y')}
      onLayout={onLayout}
      style={[
        styles.canvas,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
      {...responder.panHandlers}
    >
      {size > 0 ? (
        <Svg width={size} height={size} style={styles.svg} pointerEvents="none">
          {/* Направляющая: середина поля, чтобы буква не уезжала вверх. */}
          <Path
            d={`M0 ${size / 2} L${size} ${size / 2}`}
            stroke={palette.border}
            strokeWidth={1}
            strokeDasharray="6 8"
          />
          {paths.map((d, index) => (
            <Path
              key={index}
              d={d}
              stroke={palette.text}
              strokeWidth={Math.max(8, size * 0.045)}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
      ) : null}

      {empty && hint ? (
        <View pointerEvents="none" style={styles.hint}>
          <AppText muted style={styles.hintText}>
            {hint}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    width: '100%',
  },
  svg: { position: 'absolute', left: 0, top: 0 },
  hint: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: spacing.xl,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  hintText: { textAlign: 'center' },
});
