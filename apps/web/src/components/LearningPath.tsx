"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BitiMascot } from "@/components/BitiMascot";
import type { PathNode, PathStage, UiLang } from "@/lib/api";
import { loc } from "@/lib/i18n";

type NodeState = "locked" | "available" | "current" | "completed";

function nodeState(node: PathNode, currentSlug: string | null): NodeState {
  if (node.completed) return "completed";
  if (!node.unlocked || node.status === "planned") return "locked";
  if (node.slug === currentSlug) return "current";
  return "available";
}

function trailD(points: Array<{ x: number; y: number }>): string {
  if (!points.length) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const nx = -(b.y - a.y) * 0.18;
    const ny = (b.x - a.x) * 0.12;
    d += ` Q ${cx + nx} ${cy + ny} ${b.x} ${b.y}`;
  }
  return d;
}

export function LearningPath({
  stages,
  currentSlug,
  lang,
  t,
}: {
  stages: PathStage[];
  currentSlug: string | null;
  lang: UiLang;
  t: (k: string) => string;
}) {
  const rtl = lang === "he";
  const scroller = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const node = scroller.current?.querySelector("[data-path-current='true']");
    node?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentSlug, stages]);

  return (
    <div ref={scroller} data-testid="path-trail" dir={rtl ? "rtl" : "ltr"} className="relative">
      {stages.map((stage) => (
        <StageBlock
          key={stage.id}
          stage={stage}
          currentSlug={currentSlug}
          lang={lang}
          t={t}
          rtl={rtl}
          width={width}
        />
      ))}
    </div>
  );
}

function StageBlock({
  stage,
  currentSlug,
  lang,
  t,
  rtl,
  width,
}: {
  stage: PathStage;
  currentSlug: string | null;
  lang: UiLang;
  t: (k: string) => string;
  rtl: boolean;
  width: number;
}) {
  const items = useMemo(() => {
    const list: PathNode[] = [...stage.nodes];
    if (stage.checkpoint) list.push(stage.checkpoint);
    return list;
  }, [stage]);
  const step = 118;
  const height = Math.max(step, items.length * step + (stage.planned_count ? 56 : 12));
  const points = items.map((_, i) => {
    const y = 58 + i * step;
    const amp = Math.min(108, width * 0.26);
    const wave = Math.sin(i * 0.95 + 0.4) * amp;
    const x = width / 2 + wave * (rtl ? -1 : 1);
    return { x, y };
  });
  const done = stage.progress.completed;
  const total = Math.max(1, stage.progress.published);
  const pct = Math.round((done / total) * 100);

  return (
    <section data-testid={`stage-${stage.id}`} className="mb-10">
      <header
        data-testid={`stage-header-${stage.id}`}
        className="relative overflow-hidden rounded-3xl border border-line bg-paper px-5 py-4"
      >
        <div className="pointer-events-none absolute inset-y-0 end-0 w-24 bg-indigo/10" aria-hidden="true" />
        <p className="text-xs uppercase tracking-wide text-ink-soft">
          {stage.ulpan} · {stage.cefr}
        </p>
        <h2 className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-semibold">
          <span>{loc(stage.title, lang)}</span>
          <span lang="he" dir="rtl" className="text-xl text-ink-soft">
            {stage.title.he}
          </span>
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {done}/{stage.progress.published} · {pct}%
          {stage.badge ? (
            <span className="ms-2 inline-flex items-center gap-1 text-gold">
              <span aria-hidden="true">♛</span>
              {t("path.badge")}
            </span>
          ) : null}
        </p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-sand-deep"
          role="progressbar"
          aria-label={`${loc(stage.title, lang)} ${done}/${stage.progress.published}`}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-olive" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <div className="relative mt-4" style={{ minHeight: height }}>
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <path
            d={trailD(points)}
            fill="none"
            stroke="currentColor"
            className="text-line"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={stage.open ? "0" : "10 12"}
          />
        </svg>
        {items.map((node, i) => (
          <div
            key={node.slug}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: points[i].x, top: points[i].y }}
          >
            <PathNodeBubble node={node} currentSlug={currentSlug} lang={lang} t={t} />
          </div>
        ))}
        {stage.planned_count > 0 ? (
          <p className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center text-xs text-ink-soft" data-testid={`stage-planned-${stage.id}`}>
            ··· {stage.planned_count} {t("path.morePlanned")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function PathNodeBubble({
  node,
  currentSlug,
  lang,
  t,
}: {
  node: PathNode;
  currentSlug: string | null;
  lang: UiLang;
  t: (k: string) => string;
}) {
  const state = nodeState(node, currentSlug);
  const gate = node.kind === "checkpoint" || node.kind === "boss" || node.kind === "legendary";
  const open = state !== "locked";
  const href = open && node.status !== "planned" ? `/learn/${node.slug}` : "#";
  const word =
    state === "completed"
      ? t("path.completed")
      : state === "current"
        ? t("path.current")
        : state === "available"
          ? gate
            ? t("path.testOut")
            : t("path.available")
          : node.status === "planned"
            ? t("path.planned")
            : t("path.locked");
  const icon = state === "completed" ? "♛" : gate ? "🏆" : state === "locked" ? "🔒" : "●";
  const ring =
    state === "completed"
      ? "border-gold bg-paper"
      : state === "current"
        ? "border-indigo bg-paper ring-4 ring-indigo/30"
        : state === "available"
          ? gate
            ? "border-pomegranate bg-paper"
            : "border-indigo bg-paper"
          : "border-line bg-sand-deep text-ink-soft";
  const size = gate ? "h-20 w-20 text-lg" : "h-16 w-16 text-sm";

  return (
    <div className="flex w-28 flex-col items-center" data-path-current={state === "current" ? "true" : "false"}>
      {state === "current" ? (
        <div data-testid="biti-on-current" className="-mb-2">
          <BitiMascot size={52} mood="idle" />
        </div>
      ) : (
        <div className="h-6" aria-hidden="true" />
      )}
      <Link
        data-testid={`path-${node.slug}`}
        href={href}
        aria-disabled={open ? "false" : "true"}
        aria-current={state === "current" ? "step" : undefined}
        title={loc(node.title, lang)}
        className={`grid ${size} place-items-center rounded-full border-4 font-semibold ${ring}`}
      >
        <span aria-hidden="true">{gate && state !== "completed" ? "🏆" : icon === "●" ? loc(node.title, lang).slice(0, 1) : icon}</span>
        <span className="sr-only">
          {loc(node.title, lang)} {word}
        </span>
      </Link>
      <p className="mt-1 max-w-[7.5rem] text-center text-xs leading-tight">
        <span aria-hidden="true" className="me-1">
          {icon}
        </span>
        {word}
      </p>
    </div>
  );
}
