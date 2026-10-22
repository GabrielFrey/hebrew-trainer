import { Stack } from "expo-router";
import { I18nManager } from "react-native";

I18nManager.allowRTL(true);

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: "Biti Ivrit",
        headerStyle: { backgroundColor: "#F6F1E8" },
        headerTintColor: "#1C1917",
        contentStyle: { backgroundColor: "#F6F1E8" },
      }}
    />
  );
}
