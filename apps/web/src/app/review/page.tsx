"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HebrewKeyboard } from "@/components/HebrewKeyboard";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";

type Card = { id: string; kind: string; prompt: Record<string, unknown>; step: number; due_day: string };

export default function ReviewPage() {
  return (
    <AppShell>
      <ReviewInner />
    </AppShell>
  );
}

function ReviewInner() {
  const { t } = useT();
  const [cards, setCards] = useState<Card[]>([]);
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api<{ cards: Card[] }>("/srs/due").then((d) => setCards(d.cards));
  }, []);

  if (!cards.length) {
    return (
      <section data-testid="review-empty" className="rounded-3xl bg-paper p-6">
        <h1 className="text-3xl font-semibold">{t("nav.review")}</h1>
        <p className="mt-2 text-ink-soft">{t("states.empty")} {t("review.srsHint")}</p>
      </section>
    );
  }

  const card = cards[0];
  async function send() {
    const res = await api<{ grade: { result: string }; next_due: string }>(`/srs/${card.id}/review`, {
      method: "POST",
      body: JSON.stringify({ value }),
    });
    setMsg(`${res.grade.result} · next ${res.next_due}`);
    setCards(cards.slice(1));
    setValue("");
  }

  return (
    <section data-testid="review-card" className="rounded-3xl bg-paper p-6">
      <h1 className="text-3xl font-semibold">{t("nav.review")}</h1>
      <p className="text-ink-soft">{cards.length} due</p>
      <p className="my-4 he" lang="he" dir="rtl">
        {String(card.prompt.he || card.prompt.id)}
      </p>
      <HebrewKeyboard value={value} onChange={setValue} />
      <button type="button" data-testid="check-answer" onClick={send} className="mt-4 rounded-full bg-indigo px-5 py-2 text-paper">
        {t("lesson.check")}
      </button>
      {msg ? <p className="mt-3">{msg}</p> : null}
    </section>
  );
}
