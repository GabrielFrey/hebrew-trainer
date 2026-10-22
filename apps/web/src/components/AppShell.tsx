"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BitiMascot } from "@/components/BitiMascot";
import { api, token, type User } from "@/lib/api";
import { I18nProvider, useT } from "@/lib/i18n";

const LINKS = [
  ["/learn", "nav.learn"],
  ["/review", "nav.review"],
  ["/alphabet", "nav.alphabet"],
  ["/verbs", "nav.verbs"],
  ["/conversation", "nav.talk"],
  ["/practice", "nav.practice"],
  ["/profile", "nav.profile"],
  ["/editorial", "nav.editorial"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-ink-soft">…</p>}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!token()) {
      setReady(true);
      if (path !== "/") router.replace("/");
      return;
    }
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => router.replace("/"))
      .finally(() => setReady(true));
  }, [path, router]);

  const lang = user?.ui_language || "ru";
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  if (!ready) {
    return <p className="p-8 text-ink-soft">…</p>;
  }
  return (
    <I18nProvider lang={lang}>
      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-4 pb-24 pt-4 md:px-8">
        <SkipLink />
        <header className="glass sticky top-3 z-20 mb-6 flex items-center justify-between rounded-3xl border border-line px-4 py-3">
          <Link href="/learn" className="flex items-center gap-3">
            <BitiMascot size={44} lang={lang} />
            <BrandMark />
          </Link>
          {user ? (
            <div className="flex items-center gap-3 text-sm">
              <span aria-label="XP">{user.xp_total} XP</span>
              <span aria-label="Streak">🔥 {user.streak}</span>
              <span aria-label="Hearts">❤ {user.hearts}</span>
            </div>
          ) : null}
        </header>
        <Nav />
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    </I18nProvider>
  );
}

function SkipLink() {
  const { t } = useT();
  return (
    <a
      href="#main"
      data-testid="skip-content"
      className="sr-only z-50 rounded-full bg-indigo px-4 py-2 text-paper focus:not-sr-only focus:absolute focus:start-4 focus:top-3"
    >
      {t("chrome.skipToContent")}
    </a>
  );
}

function BrandMark() {
  const { t } = useT();
  return (
    <div>
      <p data-testid="brand-name" className="text-lg font-semibold">
        {t("brand.name")}
      </p>
      <p className="text-xs text-ink-soft">ביתי עברית</p>
    </div>
  );
}

function Nav() {
  const { t } = useT();
  const path = usePathname();
  return (
    <nav className="mb-6 flex flex-wrap gap-2" aria-label={t("chrome.primaryNav")}>
      {LINKS.map(([href, key]) => (
        <Link
          key={href}
          href={href}
          data-testid={`nav-${href.slice(1)}`}
          className={`rounded-full px-3 py-1.5 text-sm ${
            path.startsWith(href) ? "bg-indigo text-paper" : "bg-paper border border-line"
          }`}
        >
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
