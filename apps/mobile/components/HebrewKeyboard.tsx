import { Pressable, Text, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

const ROWS = [
  ["ק", "ר", "א", "ט", "ו", "ן", "ם", "פ"],
  ["ש", "ד", "ג", "כ", "ע", "י", "ח", "ל", "ך", "ף"],
  ["ז", "ס", "ב", "ה", "נ", "מ", "צ", "ת", "ץ"],
];

const NIQQUD = [
  { mark: "\u05B0", name: "shva" },
  { mark: "\u05B8", name: "qamats" },
  { mark: "\u05B7", name: "patah" },
  { mark: "\u05B5", name: "tsere" },
  { mark: "\u05B6", name: "segol" },
  { mark: "\u05B4", name: "hiriq" },
  { mark: "\u05B9", name: "holam" },
  { mark: "\u05BB", name: "qubuts" },
  { mark: "\u05BC", name: "dagesh" },
];

export function HebrewKeyboard({
  value,
  onChange,
  niqqud = false,
  disabled = false,
}: {
  value: string;
  onChange: (next: string) => void;
  niqqud?: boolean;
  disabled?: boolean;
}) {
  const palette = usePalette();
  const { lang } = useAuth();
  const keyStyle = {
    minWidth: 40,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 8,
    paddingVertical: 6,
  };
  return (
    <View testID="hebrew-keyboard" style={{ gap: 8 }} {...({ dir: "rtl" } as object)}>
      <View
        testID="keyboard-preview"
        style={{
          minHeight: 52,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: palette.line,
          backgroundColor: palette.paper,
          paddingHorizontal: 12,
          justifyContent: "center",
        }}
      >
        <Text
          accessibilityLanguage="he"
          style={{ fontSize: 28, lineHeight: 44, writingDirection: "rtl", textAlign: "right" }}
          {...({ lang: "he", dir: "rtl" } as object)}
        >
          {value || "…"}
        </Text>
      </View>
      {ROWS.map((row) => (
        <View key={row.join("")} style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 }}>
          {row.map((ch) => (
            <Pressable
              key={ch}
              testID={`key-${ch}`}
              accessibilityRole="button"
              accessibilityLabel={ch}
              accessibilityLanguage="he"
              disabled={disabled}
              onPress={() => onChange(value + ch)}
              style={keyStyle}
              {...({ lang: "he" } as object)}
            >
              <Text style={{ fontSize: 22 }} {...({ lang: "he" } as object)}>
                {ch}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
      {niqqud ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 }}>
          {NIQQUD.map((n) => (
            <Pressable
              key={n.name}
              testID={`key-niqqud-${n.name}`}
              accessibilityRole="button"
              accessibilityLabel={n.name}
              disabled={disabled}
              onPress={() => onChange(value + n.mark)}
              style={[keyStyle, { backgroundColor: palette.sandDeep }]}
            >
              <Text style={{ fontSize: 18 }} {...({ lang: "he" } as object)}>
                א{n.mark}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable testID="key-space" accessibilityRole="button" accessibilityLabel={t(lang, "keyboard.space")} onPress={() => onChange(value + " ")} style={[keyStyle, { flex: 1 }]}>
          <Text>{t(lang, "keyboard.space")}</Text>
        </Pressable>
        <Pressable testID="key-backspace" accessibilityRole="button" accessibilityLabel={t(lang, "keyboard.backspace")} onPress={() => onChange(value.slice(0, -1))} style={keyStyle}>
          <Text>⌫</Text>
        </Pressable>
        <Pressable testID="key-clear" accessibilityRole="button" accessibilityLabel={t(lang, "keyboard.clear")} onPress={() => onChange("")} style={keyStyle}>
          <Text>{t(lang, "keyboard.clear")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
