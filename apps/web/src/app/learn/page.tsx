"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LearningPath } from "@/components/LearningPath";
import { api, type PathNode, type PathStage } from "@/lib/api";
import { loc, useT } from "@/lib/i18n";

export default function LearnPage() {
  return (
    <AppShell>
      <LearnInner />
    </AppShell>
  );
}

function LearnInner() {
  const { lang, t, tp } = useT();
  const [stages, setStages] = useState<PathStage[]>([]);
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ stages?: PathStage[]; nodes: PathNode[]; current_slug?: string }>("/curriculum/path")
      .then((d) => {
        setStages(d.stages || []);
        setNodes(d.nodes);
        setCurrentSlug(d.current_slug || null);
      })
      .catch((e) => setError(String(e.message)));
  }, []);

  if (error) return <p className="text-incorrect">{error}</p>;
  if (!nodes.length && !stages.length) return <p>{t("states.loading")}</p>;

  return (
    <section data-testid="learn-path">
      <h1 className="mb-2 text-3xl font-semibold">{t("nav.learn")}</h1>
      <p className="mb-6 text-ink-soft">{t("path.intro")}</p>
      {stages.length ? (
        <LearningPath stages={stages} currentSlug={currentSlug} lang={lang} t={t} tp={tp} />
      ) : (
        <ol className="grid gap-3 md:grid-cols-2">
          {nodes.map((node, i) => (
            <li key={node.slug}>
              <NodeRow node={node} index={i} lang={lang} t={t} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function NodeRow({
  node,
  index,
  lang,
  t,
}: {
  node: PathNode;
  index: number;
  lang: "en" | "ru" | "he" | "uk" | "es" | "fr";
  t: (k: string) => string;
}) {
  const open = node.unlocked || node.completed;
  return (
    <Link
      data-testid={`path-${node.slug}`}
      href={open ? `/learn/${node.slug}` : "#"}
      aria-disabled={open ? "false" : "true"}
      className={`block rounded-3xl border p-4 ${
        node.completed ? "border-olive bg-paper" : open ? "border-indigo bg-paper" : "border-line bg-sand-deep text-ink-soft"
      }`}
    >
      <p className="text-xs uppercase tracking-wide">
        {node.kind === "boss" || node.kind === "legendary" ? t("lesson.legendary") : node.track} · {node.level}
      </p>
      <p className="text-lg font-medium">
        {index + 1}. {loc(node.title, lang)}
      </p>
      {!open ? <p className="text-sm">{t("lesson.locked")}</p> : null}
    </Link>
  );
}
