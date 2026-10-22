"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HebrewText } from "@/components/HebrewText";
import { api } from "@/lib/api";

type Letter = { glyph: string; name: string; final?: string };

export default function AlphabetPage() {
  return (
    <AppShell>
      <AlphaInner />
    </AppShell>
  );
}

function AlphaInner() {
  const [print, setPrint] = useState<Letter[]>([]);
  const [look, setLook] = useState<string[][]>([]);
  const [note, setNote] = useState("");
  useEffect(() => {
    api<{ print: Letter[]; lookalikes: string[][]; cursive_note: string }>("/alphabet").then((d) => {
      setPrint(d.print);
      setLook(d.lookalikes);
      setNote(d.cursive_note);
    });
  }, []);
  return (
    <section>
      <h1 className="mb-4 text-3xl font-semibold">Alphabet</h1>
      <p className="mb-4 text-ink-soft">{note}</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {print.map((l) => (
          <div key={l.glyph} className="rounded-3xl bg-paper p-3 text-center">
            <HebrewText>{l.glyph}</HebrewText>
            {l.final ? (
              <p className="he text-2xl" lang="he" dir="rtl">
                {l.final}
              </p>
            ) : null}
            <p className="text-sm text-ink-soft">{l.name}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-8 text-xl font-medium">Lookalikes</h2>
      <ul className="mt-2 space-y-2">
        {look.map((g) => (
          <li key={g.join()} className="he rounded-2xl bg-paper px-4 py-2" lang="he" dir="rtl">
            {g.join(" · ")}
          </li>
        ))}
      </ul>
    </section>
  );
}
