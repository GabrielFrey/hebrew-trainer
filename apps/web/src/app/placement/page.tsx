"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { HebrewKeyboard } from "@/components/HebrewKeyboard";
import { api } from "@/lib/api";
import { loc, useT } from "@/lib/i18n";

export default function PlacementPage() {
  return (
    <AppShell>
      <PlaceInner />
    </AppShell>
  );
}

function PlaceInner() {
  const { lang } = useT();
  const router = useRouter();
  const [items, setItems] = useState<Array<{ id: string; prompt: Record<string, string> }>>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  useEffect(() => {
    api<{ items: Array<{ id: string; prompt: Record<string, string> }> }>("/placement").then((d) => setItems(d.items));
  }, []);
  async function submit() {
    await api("/placement", { method: "POST", body: JSON.stringify({ answers }) });
    router.push("/learn");
  }
  return (
    <section className="rounded-3xl bg-paper p-6">
      <h1 className="text-3xl font-semibold">Placement</h1>
      <p className="text-ink-soft">Skippable. Type Hebrew — transliteration is not graded.</p>
      {items.map((item) => (
        <div key={item.id} className="mt-6">
          <p>{loc(item.prompt, lang)}</p>
          <HebrewKeyboard value={answers[item.id] || ""} onChange={(v) => setAnswers({ ...answers, [item.id]: v })} />
        </div>
      ))}
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={submit} className="rounded-full bg-indigo px-5 py-2 text-paper">
          Submit
        </button>
        <button type="button" onClick={() => router.push("/learn")} className="rounded-full border border-line px-5 py-2">
          Skip
        </button>
      </div>
    </section>
  );
}
