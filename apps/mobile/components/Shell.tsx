import { Link, usePathname, useRouter } from "expo-router";
import { createContext, type ComponentRef, type ReactNode, type RefObject, useContext, useEffect, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BitiMascot } from "@/components/BitiMascot";
import { useAuth } from "@/lib/auth";
import { GlassSurface } from "@/lib/glass";
import { t } from "@/lib/i18n";
import { usePalette } from "@/lib/theme";

const LINKS = [
  ["/learn", "nav.learn"],
  ["/review", "nav.review"],
  ["/alphabet", "nav.alphabet"],
  ["/verbs", "nav.verbs"],
  ["/practice", "nav.practice"],
  ["/profile", "nav.profile"],
] as const;

type ShellScrollView = ComponentRef<typeof ScrollView>;

const ShellScrollCtx = createContext<RefObject<ShellScrollView | null> | null>(null);

export function useShellScroll() {
  return useContext(ShellScrollCtx);
}

export function Shell({ children }: { children: ReactNode }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const router = useRouter();
  const { user, ready, lang } = useAuth();
  const scrollRef = useRef<ShellScrollView>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.sand, padding: 24 }}>
        <Text style={{ color: palette.inkSoft }}>{t(lang, "states.loading")}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.sand, paddingTop: insets.top }}>
      <GlassSurface
        testID="mobile-chrome"
        style={{ marginHorizontal: 12, marginTop: 8, paddingHorizontal: 14, paddingVertical: 10 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <BitiMascot size={40} lang={lang} />
            <View>
              <Text testID="brand-name" style={{ fontSize: 18, fontWeight: "700", color: palette.ink }}>
                {t(lang, "brand.name")}
              </Text>
              <Text style={{ fontSize: 12, color: palette.inkSoft }} {...({ lang: "he" } as object)}>
                ביתי עברית
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Text accessibilityLabel="XP" style={{ color: palette.ink, fontSize: 12 }}>
              {user.xp_total} XP
            </Text>
            <Text accessibilityLabel="Streak" style={{ color: palette.ink, fontSize: 12 }}>
              🔥 {user.streak}
            </Text>
            <Text accessibilityLabel="Hearts" style={{ color: palette.ink, fontSize: 12 }}>
              ❤ {user.hearts}
            </Text>
          </View>
        </View>
      </GlassSurface>
      <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
        {LINKS.map(([href, key]) => {
          const active = path === href || (href !== "/learn" && path.startsWith(href));
          return (
            <Link key={href} href={href} asChild>
              <Pressable
                accessibilityRole="link"
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: active ? palette.indigo : palette.paper,
                  borderWidth: 1,
                  borderColor: palette.line,
                }}
              >
                <Text style={{ color: active ? palette.paper : palette.ink, fontSize: 14 }}>{t(lang, key)}</Text>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>
      <ShellScrollCtx.Provider value={scrollRef}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 12 }}>
          {children}
        </ScrollView>
      </ShellScrollCtx.Provider>
    </View>
  );
}
