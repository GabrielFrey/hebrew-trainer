import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, clearToken, demoLogin, hydrateToken, replayOffline, type User } from "./api";
import { type UiLang } from "./i18n";

type AuthCtx = {
  user: User | null;
  ready: boolean;
  lang: UiLang;
  refresh: () => Promise<void>;
  enter: (body: { ui_language: string; display_name: string; motivation: string; course_id?: string }) => Promise<User>;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const token = await hydrateToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await api<User>("/auth/me");
      setUser(me);
      await replayOffline();
    } catch {
      clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      ready,
      lang: user?.ui_language || "ru",
      refresh,
      async enter(body) {
        const next = await demoLogin(body);
        setUser(next);
        return next;
      },
      signOut() {
        clearToken();
        setUser(null);
      },
    }),
    [user, ready, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
