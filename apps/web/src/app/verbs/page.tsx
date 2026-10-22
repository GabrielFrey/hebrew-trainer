"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HebrewText } from "@/components/HebrewText";
import { api } from "@/lib/api";

type Paradigm = {
  root: string;
  binyan: string;
  gloss: Record<string, string>;
  infinitive: string;
  infinitive_pointed: string;
  present: Record<string, { plain: string; pointed: string }>;
};

export default function VerbsPage() {
  return (
    <AppShell>
      <VerbsInner />
    </AppShell>
  );
}

function VerbsInner() {
  const [items, setItems] = useState<Paradigm[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    api<{ paradigms: Paradigm[] }>("/verbs").then((d) => setItems(d.paradigms));
  }, []);
  return (
    <section data-testid="verbs">
      <h1 className="mb-2 text-3xl font-semibold">Verb explorer</h1>
      <p className="mb-4 text-ink-soft">Root → binyan → present table. Seven binyanim represented.</p>
      <div className="grid gap-3">
        {items.map((p) => {
          const key = `${p.root}-${p.binyan}`;
          return (
            <article key={key} className="rounded-3xl bg-paper p-4">
              <button type="button" className="flex w-full items-baseline justify-between" onClick={() => setOpen(open === key ? null : key)}>
                <span className="he" lang="he" dir="rtl">
                  {p.root}
                </span>
                <span className="text-sm text-ink-soft">{p.binyan}</span>
              </button>
              <p>{p.gloss.en}</p>
              {open === key ? (
                <table className="mt-3 w-full text-start">
                  <tbody>
                    {Object.entries(p.present).map(([slot, forms]) => (
                      <tr key={slot} className="border-t border-line">
                        <td className="py-2 pe-3 text-sm text-ink-soft">{slot}</td>
                        <td>
                          <HebrewText pointed={forms.pointed}>{forms.plain}</HebrewText>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-line">
                      <td className="py-2 text-sm">inf.</td>
                      <td>
                        <HebrewText pointed={p.infinitive_pointed}>{p.infinitive}</HebrewText>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
