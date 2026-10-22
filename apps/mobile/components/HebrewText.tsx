import { Text, type TextStyle } from "react-native";

export function HebrewText({
  children,
  pointed,
  showNiqqud = true,
  style,
  testID,
}: {
  children: string;
  pointed?: string | null;
  showNiqqud?: boolean;
  style?: TextStyle;
  testID?: string;
}) {
  const text = showNiqqud && pointed ? pointed : children;
  return (
    <Text
      testID={testID}
      accessibilityLanguage="he"
      style={[
        {
          fontFamily: "NotoSansHebrew_400Regular",
          fontSize: 28,
          lineHeight: 46,
          writingDirection: "rtl",
          textAlign: "right",
        },
        style,
      ]}
      {...({ lang: "he", dir: "rtl" } as object)}
    >
      {text}
    </Text>
  );
}
