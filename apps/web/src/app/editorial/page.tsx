"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, demoLogin } from "@/lib/api";

type Draft = { id: string; kind: string; status: string; flags: string[]; payload: Record<string, string> };

export default function EditorialPage() {
  return (
    <AppShell>
      <EditInner />
    </AppShell>
  );
}

function EditInner() {
  const [queue, setQueue] = useState<Draft[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  async function asEditor() {
    await demoLogin({ ui_language: "en", display_name: "Editor", motivation: "work", role: "editor" });
    await api("/pipeline/run", { method: "POST" });
    const rows = await api<Draft[]>("/editorial/queue");
    setQueue(rows);
  }
  useEffect(() => {
    api<Draft[]>("/editorial/queue")
      .then(setQueue)
      .catch(() => setMsg("Sign in as editor to review drafts."));
  }, []);
  async function act(id: string, action: string) {
    try {
      const res = await api<{ status: string }>(`/editorial/${id}`, {
        method: "POST",
        body: JSON.stringify({ action, native_speaker: true, comment: "native review" }),
      });
      setMsg(`${id} → ${res.status}`);
      setQueue(await api<Draft[]>("/editorial/queue"));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "blocked");
    }
  }
  return (
    <section className="rounded-3xl bg-paper p-6">
      <h1 className="text-3xl font-semibold">Editorial</h1>
      <p className="text-ink-soft">Native-speaker approval is required. Unlicensed or flagged drafts cannot publish.</p>
      <button type="button" onClick={asEditor} className="mt-3 rounded-full border border-line px-4 py-2">
        Demo as editor + run pipeline
      </button>
      {msg ? <p className="mt-3 text-sm">{msg}</p> : null}
      <ul className="mt-4 space-y-3">
        {queue.map((d) => (
          <li key={d.id} className="rounded-2xl border border-line p-3">
            <p className="font-medium">
              {d.payload.lemma || d.kind} · {d.status}
            </p>
            <p className="text-sm text-ink-soft">{d.payload.gloss}</p>
            <p className="text-xs">flags: {(d.flags || []).join(", ") || "none"}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className="rounded-full bg-olive px-3 py-1 text-paper" onClick={() => act(d.id, "publish")}>
                Approve
              </button>
              <button type="button" className="rounded-full bg-pomegranate px-3 py-1 text-paper" onClick={() => act(d.id, "reject")}>
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
