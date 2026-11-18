import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { Link, router } from "expo-router";
import Constants from "expo-constants";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

const COURSE_KEY: Record<string, string> = {
  "he-ru": "onboarding.courseHeRu",
  "he-uk": "onboarding.courseHeUk",
  "he-en": "onboarding.courseHeEn",
  "he-es": "onboarding.courseHeEs",
  "he-fr": "onboarding.courseHeFr",
};

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
  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);
  if (!user) return <Text>{t(lang, "states.loading")}</Text>;
  const version = Constants.expoConfig?.version || "0.1.0";
  const courseKey = COURSE_KEY[user.course_id || "he-en"] || "onboarding.courseHeEn";
  return (
    <View testID="profile" style={{ gap: 12 }}>
      <View style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>{user.display_name}</Text>
        <Text style={{ color: palette.ink }}>
          {t(lang, "progress.xp")}: {user.xp_total}
        </Text>
        <Text style={{ color: palette.ink }}>
          {t(lang, "progress.streak")}: {user.streak}
        </Text>
        <Text style={{ color: palette.ink }}>
          {t(lang, "progress.hearts")}: {user.hearts}
        </Text>
        <Text style={{ color: palette.ink }}>
          {t(lang, "progress.league")}: {user.league}
        </Text>
        <Text style={{ color: palette.ink }}>
          {t(lang, "profile.level")}: {user.level}
        </Text>
        <Text style={{ color: palette.ink }}>
          {t(lang, "progress.goal")}: {user.daily_goal_xp} {t(lang, "progress.xp")}
        </Text>
        <Text style={{ color: palette.ink }}>
          {t(lang, "onboarding.language")}: {user.ui_language}
        </Text>
        <Text style={{ color: palette.ink }}>
          {t(lang, "profile.course")}: {t(lang, courseKey)}
        </Text>
        <Text style={{ color: palette.inkSoft }}>{t(lang, "profile.offline")}</Text>
        <Text style={{ color: palette.inkSoft }}>{t(lang, "profile.version", { version })}</Text>
      </View>
      <Link href="/privacy" asChild>
        <Pressable
          testID="privacy-link"
          accessibilityRole="link"
          accessibilityLabel={t(lang, "onboarding.privacy")}
          style={{ minHeight: 44, justifyContent: "center", backgroundColor: palette.paper, borderRadius: 999, paddingHorizontal: 18 }}
        >
          <Text style={{ textAlign: "center", color: palette.indigo, fontWeight: "600" }}>{t(lang, "onboarding.privacy")}</Text>
        </Pressable>
      </Link>
      <View style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 8 }}>
        <Text style={{ color: palette.inkSoft }}>{t(lang, "profile.signOutNote")}</Text>
        <Pressable
          testID="sign-out"
          accessibilityRole="button"
          accessibilityLabel={t(lang, "profile.signOut")}
          onPress={() => {
            signOut();
            router.replace("/");
          }}
          style={{ minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: palette.line, borderRadius: 999, paddingHorizontal: 12 }}
        >
          <Text style={{ textAlign: "center", color: palette.ink }}>{t(lang, "profile.signOut")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
