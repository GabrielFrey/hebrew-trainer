"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, type PathNode, type PathUnit } from "@/lib/api";
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
  const [units, setUnits] = useState<PathUnit[]>([]);
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ units?: PathUnit[]; nodes: PathNode[] }>("/curriculum/path")
      .then((d) => {
        setUnits(d.units || []);
        setNodes(d.nodes);
      })
      .catch((e) => setError(String(e.message)));
  }, []);

  if (error) return <p className="text-incorrect">{error}</p>;
  if (!nodes.length) return <p>{t("states.loading")}</p>;

  return (
    <section data-testid="learn-path">
      <h1 className="mb-2 text-3xl font-semibold">{t("nav.learn")}</h1>
      <p className="mb-6 text-ink-soft">Short lessons. Follow Biti along the path. Legendary chests are checkpoints, not another brand.</p>
      {units.length ? (
        <ol className="space-y-10">
          {units.map((unit) => (
            <li key={unit.id} className="rounded-3xl bg-paper p-5">
              <p className="text-xs uppercase tracking-wide text-ink-soft">
                {unit.level} · {unit.track}
              </p>
              <h2 className="mb-4 text-2xl font-semibold">{loc(unit.title, lang)}</h2>
              {unit.skills.map((skill) => (
                <div key={skill.id} className="mb-6">
                  <h3 className="mb-3 font-medium">{loc(skill.title, lang)}</h3>
                  <ol className="flex flex-wrap items-center gap-3">
                    {skill.nodes.map((node) => (
                      <li key={node.slug}>
                        <NodeBubble node={node} lang={lang} t={t} />
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </li>
          ))}
        </ol>
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

function NodeBubble({
  node,
  lang,
  t,
}: {
  node: PathNode;
  lang: "en" | "ru" | "he" | "uk" | "es" | "fr";
  t: (k: string) => string;
}) {
  const open = (node.unlocked || node.completed) && node.status !== "planned";
  const legendary = node.kind === "boss" || node.kind === "legendary";
  return (
    <Link
      data-testid={`path-${node.slug}`}
      href={open ? `/learn/${node.slug}` : "#"}
      aria-disabled={!open}
      title={loc(node.title, lang)}
      className={`grid h-16 w-16 place-items-center rounded-full border-4 text-sm font-semibold ${
        node.completed
          ? "border-gold bg-paper"
          : open
            ? legendary
              ? "border-pomegranate bg-paper"
              : "border-indigo bg-paper"
            : "border-line bg-sand-deep text-ink-soft"
      }`}
    >
      {legendary ? "★" : node.completed ? "✓" : node.status === "planned" ? "·" : loc(node.title, lang).slice(0, 1)}
      <span className="sr-only">
        {loc(node.title, lang)} {node.status === "planned" ? t("lesson.planned") : !open ? t("lesson.locked") : ""}
      </span>
    </Link>
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
      aria-disabled={!open}
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
