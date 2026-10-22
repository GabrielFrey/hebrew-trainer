"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function ConversationPage() {
  return (
    <AppShell>
      <TalkInner />
    </AppShell>
  );
}

function TalkInner() {
  const { t } = useT();
  const [status, setStatus] = useState<{ capability: string; reason?: string } | null>(null);
  const [text, setText] = useState("");
  const [log, setLog] = useState<string[]>([]);
  useEffect(() => {
    api<{ capability: string; reason?: string }>("/tutor/status").then(setStatus);
  }, []);
  async function send() {
    const res = await api<{ reply?: string; capability: string }>("/tutor/chat", {
      method: "POST",
      body: JSON.stringify({ attempt_id: "-", exercise_id: "-", message: text }),
    });
    setLog((l) => [...l, `${t("conversation.you")}: ${text}`, `${t("conversation.biti")}: ${res.reply || res.capability}`]);
    setText("");
  }
  return (
    <section className="rounded-3xl bg-paper p-6">
      <h1 className="text-3xl font-semibold">{t("nav.talk")}</h1>
      {status?.capability !== "ready" ? (
        <p className="mt-3 rounded-2xl bg-sand-deep p-3">
          {t("states.unavailable")} {status?.reason || t("lesson.speechUnavailable")} {t("checkpoint.xpNote")}
        </p>
      ) : null}
      <div className="mt-4 space-y-2">
        {log.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mt-4 w-full rounded-2xl border border-line p-3"
        rows={3}
        placeholder="שלום, מה שמך?"
        dir="auto"
      />
      <button type="button" onClick={send} className="mt-3 rounded-full bg-indigo px-5 py-2 text-paper">
        Send
      </button>
    </section>
  );
}
