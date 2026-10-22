"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function PracticePage() {
  return (
    <AppShell>
      <PracticeInner />
    </AppShell>
  );
}

function PracticeInner() {
  const { t } = useT();
  const [data, setData] = useState<{
    due_cards: number;
    weak_lessons: string[];
    daily_goal_xp: number;
    hearts: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ due_cards: number; weak_lessons: string[]; daily_goal_xp: number; hearts: number }>("/practice")
      .then(setData)
      .catch((e) => setError(String(e.message)));
  }, []);
  if (error) return <p className="text-incorrect">{error}</p>;
  if (!data) return <p>{t("states.loading")}</p>;
  return (
    <section data-testid="practice" className="rounded-3xl bg-paper p-6">
      <h1 className="text-3xl font-semibold">{t("practice.title")}</h1>
      <p className="mt-2 text-ink-soft">
        {t("practice.due")}: {data.due_cards} · {t("progress.hearts")}: {data.hearts} · {t("progress.goal")}: {data.daily_goal_xp} XP
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/review" className="rounded-full bg-indigo px-5 py-2 text-paper">
          {t("nav.review")}
        </Link>
        <Link href="/learn" className="rounded-full border border-line px-5 py-2">
          {t("nav.learn")}
        </Link>
      </div>
      <h2 className="mt-8 text-xl font-medium">{t("practice.weak")}</h2>
      {data.weak_lessons.length ? (
        <ul className="mt-2 space-y-2">
          {data.weak_lessons.map((slug) => (
            <li key={slug}>
              <Link href={`/learn/${slug}`} className="text-indigo underline">
                {slug}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-ink-soft">{t("states.empty")}</p>
      )}
    </section>
  );
}
