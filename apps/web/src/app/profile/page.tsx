"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, type User } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileInner />
    </AppShell>
  );
}

function ProfileInner() {
  const { t } = useT();
  const [user, setUser] = useState<User | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    api<User>("/auth/me").then(setUser);
    api<Record<string, unknown>>("/meta").then(setMeta);
  }, []);
  if (!user) return <p>{t("states.loading")}</p>;
  return (
    <section data-testid="profile" className="grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl bg-paper p-5">
        <h1 className="text-3xl font-semibold">{user.display_name}</h1>
        <ul className="mt-4 space-y-2">
          <li>XP {user.xp_total}</li>
          <li>Streak {user.streak}</li>
          <li>Hearts {user.hearts}</li>
          <li>League {user.league}</li>
          <li>Level {user.level}</li>
          <li>Daily goal {user.daily_goal_xp} XP</li>
          <li>Language {user.ui_language}</li>
          <li>Course {user.course_id}</li>
        </ul>
        <p className="mt-4 text-sm text-ink-soft">Switch course — progress is stored per pair.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["he-ru", "he-uk", "he-en", "he-es", "he-fr"].map((id) => (
            <button
              key={id}
              type="button"
              data-testid={`switch-course-${id}`}
              className={`rounded-full border px-3 py-1 text-sm ${user.course_id === id ? "border-indigo bg-sand" : "border-line"}`}
              onClick={async () => {
                const next = await api<User>("/auth/me", { method: "PATCH", body: JSON.stringify({ course_id: id }) });
                setUser(next);
              }}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-3xl bg-paper p-5">
        <h2 className="text-xl font-medium">Capabilities</h2>
        {meta ? (
          <ul className="mt-3 space-y-1 text-sm text-ink-soft">
            <li>Auth: {String((meta.auth as { mode?: string } | undefined)?.mode || "unknown")}</li>
            <li>Audio: {String((meta.audio as { capability?: string } | undefined)?.capability || "unknown")}</li>
            <li>Speech: {String((meta.speech as { capability?: string } | undefined)?.capability || "unknown")}</li>
            <li>
              Tutor: {String((meta.tutor as { capability?: string } | undefined)?.capability || "unknown")} — never
              awards XP
            </li>
            <li>
              Catalog: {String((meta.catalog as { published?: number } | undefined)?.published ?? "?")} published /{" "}
              {String((meta.catalog as { lessons?: number } | undefined)?.lessons ?? "?")} mapped
            </li>
            <li>uk / es / fr copy: in_review until a native reviewer signs off</li>
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">{t("profile.loadingCapabilities")}</p>
        )}
        <p className="mt-3 text-sm">
          Achievements: Alef-Bet master, All seven binyanim, and First conversation unlock from server progress — they
          never come from the tutor.
        </p>
      </div>
    </section>
  );
}
