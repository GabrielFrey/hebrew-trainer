"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, type PathNode } from "@/lib/api";
import { loc, useT } from "@/lib/i18n";

export default function LearnPage() {
  return (
    <AppShell>
      <LearnInner />
    </AppShell>
  );
}

function LearnInner() {
  const { lang, t } = useT();
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ nodes: PathNode[] }>("/curriculum/path")
      .then((d) => setNodes(d.nodes))
      .catch((e) => setError(String(e.message)));
  }, []);

  if (error) return <p className="text-incorrect">{error}</p>;
  if (!nodes.length) return <p>{t("states.loading")}</p>;

  return (
    <section>
      <h1 className="mb-4 text-3xl font-semibold">{t("nav.learn")}</h1>
      <ol className="grid gap-3 md:grid-cols-2">
        {nodes.map((node, i) => (
          <li key={node.slug}>
            <Link
              href={node.unlocked || node.completed ? `/learn/${node.slug}` : "#"}
              aria-disabled={!node.unlocked && !node.completed}
              className={`block rounded-3xl border p-4 ${
                node.completed
                  ? "border-olive bg-paper"
                  : node.unlocked
                    ? "border-indigo bg-paper"
                    : "border-line bg-sand-deep text-ink-soft"
              }`}
            >
              <p className="text-xs uppercase tracking-wide">
                {node.kind === "boss" ? "Boss" : node.track} · {node.level}
              </p>
              <p className="text-lg font-medium">
                {i + 1}. {loc(node.title, lang)}
              </p>
              {!node.unlocked && !node.completed ? <p className="text-sm">{t("lesson.locked")}</p> : null}
              {node.completed ? <p className="text-sm text-correct">✓ {Math.round((node.accuracy || 0) * 100)}%</p> : null}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
