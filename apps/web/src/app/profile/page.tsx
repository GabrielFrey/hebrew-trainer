"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, type User } from "@/lib/api";

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileInner />
    </AppShell>
  );
}

function ProfileInner() {
  const [user, setUser] = useState<User | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    api<User>("/auth/me").then(setUser);
    api<Record<string, unknown>>("/meta").then(setMeta);
  }, []);
  if (!user) return <p>Loading…</p>;
  return (
    <section className="grid gap-4 md:grid-cols-2">
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
        </ul>
      </div>
      <div className="rounded-3xl bg-paper p-5">
        <h2 className="text-xl font-medium">Capabilities</h2>
        <pre className="mt-3 overflow-auto text-sm text-ink-soft">{JSON.stringify(meta, null, 2)}</pre>
        <p className="mt-3 text-sm">
          Achievements: Alef-Bet master, All seven binyanim, and First conversation unlock from server progress — they
          never come from the tutor.
        </p>
      </div>
    </section>
  );
}
