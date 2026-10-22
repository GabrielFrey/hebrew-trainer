import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getQueue } from "@/lib/offline";
import { usePalette } from "@/lib/theme";

export default function Profile() {
  return (
    <Shell>
      <ProfileInner />
    </Shell>
  );
}

function ProfileInner() {
  const palette = usePalette();
  const { user, signOut, refresh, lang } = useAuth();
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [queueBackend, setQueueBackend] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    refresh().catch(() => undefined);
    api<Record<string, unknown>>("/meta")
      .then(setMeta)
      .catch((e) => setError(String(e.message)));
    getQueue().then((q) => setQueueBackend(q.backend));
  }, [refresh]);
  if (!user) return <Text>{t(lang, "states.loading")}</Text>;
  return (
    <View testID="profile" style={{ gap: 12 }}>
      <View style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>{user.display_name}</Text>
        <Text>XP {user.xp_total}</Text>
        <Text>Streak {user.streak}</Text>
        <Text>Hearts {user.hearts}</Text>
        <Text>League {user.league}</Text>
        <Text>Level {user.level}</Text>
        <Text>Daily goal {user.daily_goal_xp} XP</Text>
        <Text>Language {user.ui_language}</Text>
        <Text testID="queue-backend">Offline queue: {queueBackend || "…"}</Text>
      </View>
      <View style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: "600" }}>Capabilities</Text>
        {error ? <Text style={{ color: palette.incorrect }}>{error}</Text> : null}
        <Text style={{ color: palette.inkSoft }}>{JSON.stringify(meta, null, 2)}</Text>
        <Text>
          Achievements: Alef-Bet master, All seven binyanim, and First conversation unlock from server progress — they never come from the tutor.
        </Text>
        <Pressable
          testID="sign-out"
          onPress={() => {
            signOut();
            router.replace("/");
          }}
          style={{ borderWidth: 1, borderColor: palette.line, borderRadius: 999, padding: 12 }}
        >
          <Text style={{ textAlign: "center" }}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
