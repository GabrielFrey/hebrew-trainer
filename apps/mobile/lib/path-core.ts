/** Pure path + placement logic (no React Native imports) so it runs under node:test. */
import type { PathNode, PathStage, User } from "./api";
import type { LocalSession } from "./session";

export type PathCatalog = {
  gateKinds: string[];
  lessons: Array<{ slug: string; title: Record<string, string>; track: string; level: string; kind: string; prerequisites: string[] }>;
  /** `opensAfter` names the stage whose gate opens this one (default: the previous main stage). Sections are side tracks. */
  levels: Array<{ id: string; ulpan: string; cefr: string; opensAfter?: string; section?: boolean }>;
  stageTitles: unknown;
  checkpointSlugs: unknown;
};

export function makePath(catalog: PathCatalog) {
const GATE = new Set(catalog.gateKinds);
const PASS = 0.8;

type CatalogLesson = PathCatalog["lessons"][number];
const bySlug = new Map(catalog.lessons.map((row) => [row.slug, row]));

function isGate(kind?: string): boolean {
  return GATE.has(kind || "lesson");
}

function lessonBySlug(slug: string): CatalogLesson | undefined {
  return bySlug.get(slug);
}

function opener(stageId: string): string | null {
  const idx = catalog.levels.findIndex((row) => row.id === stageId);
  if (idx <= 0) return null;
  const level = catalog.levels[idx];
  if (level.opensAfter) return level.opensAfter;
  for (let i = idx - 1; i >= 0; i--) if (!catalog.levels[i].section) return catalog.levels[i].id;
  return null;
}

function stageOpen(stageId: string, done: Record<string, number>): boolean {
  const idx = catalog.levels.findIndex((row) => row.id === stageId);
  if (idx <= 0) return true;
  const prev = opener(stageId);
  const gate = prev ? (catalog.checkpointSlugs as Record<string, string>)[prev] : undefined;
  if (!gate) return false;
  return (done[gate] || 0) + 1e-9 >= PASS;
}

/** Stages whose gate-keeper is `stageId` (what passing its gate opens). */
function opensNext(stageId: string): string[] {
  return catalog.levels.filter((row) => opener(row.id) === stageId).map((row) => row.id);
}

function unlocked(slug: string, done: Record<string, number>): boolean {
  const spec = lessonBySlug(slug);
  if (!spec) return false;
  if (!stageOpen(spec.level, done)) return false;
  if (isGate(spec.kind)) return true;
  for (const prereq of spec.prerequisites || []) {
    if (prereq in done) continue;
    const prev = lessonBySlug(prereq);
    if (prev && prev.level !== spec.level && stageOpen(spec.level, done)) continue;
    return false;
  }
  return true;
}


function buildPath(session: LocalSession): { nodes: PathNode[]; stages: PathStage[]; current_slug: string | null } {
  const { done } = session;
  const titles = catalog.stageTitles as Record<string, Record<string, string>>;
  const nodes: PathNode[] = catalog.lessons.map((spec) => ({
    slug: spec.slug,
    title: spec.title,
    track: spec.track,
    level: spec.level,
    kind: spec.kind,
    unlocked: unlocked(spec.slug, done),
    completed: (done[spec.slug] || 0) + 1e-9 >= PASS,
    accuracy: done[spec.slug],
    prerequisites: spec.prerequisites,
    status: "published",
  }));
  const stages: PathStage[] = catalog.levels.map((level) => {
    const published = nodes.filter((n) => n.level === level.id);
    const lessons = published.filter((n) => !isGate(n.kind));
    const checkpoint = published.find((n) => isGate(n.kind)) || {
      slug: (catalog.checkpointSlugs as Record<string, string>)[level.id] || `${level.id}-gate`,
      title: titles[level.id] || { en: level.id },
      track: "script",
      level: level.id,
      kind: "checkpoint",
      unlocked: false,
      completed: false,
      prerequisites: [],
      status: "planned",
    };
    const publishedTotal = lessons.length + (checkpoint.status === "published" ? 1 : 0);
    const completedN = lessons.filter((n) => n.completed).length + (checkpoint.completed ? 1 : 0);
    const opensAfter = opener(level.id);
    return {
      id: level.id,
      ulpan: level.ulpan,
      cefr: level.cefr,
      title: titles[level.id] || { en: level.id },
      progress: { completed: completedN, published: publishedTotal },
      planned_count: 0,
      open: stageOpen(level.id, done),
      badge: session.badges.includes(level.id),
      nodes: lessons,
      checkpoint,
      ...(level.section ? { section: true } : {}),
      ...(opensAfter ? { opens_after: opensAfter } : {}),
    };
  });
  const trailOf = (list: PathStage[]) => list.flatMap((s) => [...s.nodes, s.checkpoint]);
  const main = trailOf(stages.filter((s) => !s.section));
  const all = trailOf(stages);
  const current =
    main.find((n) => n.status !== "planned" && n.unlocked && !n.completed)?.slug ||
    all.find((n) => n.status !== "planned" && n.unlocked && !n.completed)?.slug ||
    [...main].reverse().find((n) => n.completed)?.slug ||
    main.find((n) => n.status !== "planned")?.slug ||
    null;
  return { nodes, stages, current_slug: current };
}

/**
 * Deterministic test-out: every main stage before `level` is marked passed (lessons + gate, badge),
 * so the path's current node lands on the first lesson of the placed stage. Sections stay untouched.
 */
function applyPlacement(session: LocalSession, level: string) {
  const main = catalog.levels.filter((row) => !row.section);
  const ids = main.map((row) => row.id);
  const idx = Math.max(0, ids.indexOf(level));
  const titles = catalog.stageTitles as Record<string, Record<string, string>>;
  const gates = catalog.checkpointSlugs as Record<string, string>;
  for (const stageId of ids.slice(0, idx)) {
    for (const spec of catalog.lessons) {
      if (spec.level === stageId && !((session.done[spec.slug] || 0) >= PASS)) session.done[spec.slug] = 1;
    }
    if (gates[stageId] && !((session.done[gates[stageId]] || 0) >= PASS)) session.done[gates[stageId]] = 1;
    if (!session.badges.includes(stageId)) session.badges.push(stageId);
  }
  const meta = main[idx];
  session.user = { ...session.user, level: meta.id as User["level"] };
  return { id: meta.id, ulpan: meta.ulpan, cefr: meta.cefr, title: titles[meta.id] || { en: meta.ulpan } };
}

  return { PASS, isGate, lessonBySlug, stageOpen, opensNext, unlocked, buildPath, applyPlacement };
}
