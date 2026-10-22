/** Pure path + placement logic (no React Native imports) so it runs under node:test. */
import type { PathNode, PathStage, User } from "./api";
import type { LocalSession } from "./session";

export type PathCatalog = {
  gateKinds: string[];
  lessons: Array<{ slug: string; title: Record<string, string>; track: string; level: string; kind: string; prerequisites: string[] }>;
  levels: Array<{ id: string; ulpan: string; cefr: string }>;
  stageTitles: unknown;
  checkpointSlugs: unknown;
};

export function makePath(catalog: PathCatalog) {
const GATE = new Set(catalog.gateKinds);
const PASS = 0.8;

type CatalogLesson = PathCatalog["lessons"][number];

function isGate(kind?: string): boolean {
  return GATE.has(kind || "lesson");
}

function lessonBySlug(slug: string): CatalogLesson | undefined {
  return catalog.lessons.find((row) => row.slug === slug);
}

function stageOpen(stageId: string, done: Record<string, number>): boolean {
  const ids = catalog.levels.map((row) => row.id);
  const idx = ids.indexOf(stageId);
  if (idx <= 0) return true;
  const prev = ids[idx - 1];
  const gate = (catalog.checkpointSlugs as Record<string, string>)[prev];
  if (!gate) return false;
  return (done[gate] || 0) + 1e-9 >= PASS;
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
    };
  });
  const trail = stages.flatMap((s) => [...s.nodes, s.checkpoint]);
  const current =
    trail.find((n) => n.status !== "planned" && n.unlocked && !n.completed)?.slug ||
    [...trail].reverse().find((n) => n.completed)?.slug ||
    trail.find((n) => n.status !== "planned")?.slug ||
    null;
  return { nodes, stages, current_slug: current };
}

/**
 * Deterministic test-out: every stage before `level` is marked passed (lessons + gate, badge),
 * so the path's current node lands on the first lesson of the placed stage.
 */
function applyPlacement(session: LocalSession, level: string) {
  const ids = catalog.levels.map((row) => row.id);
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
  const meta = catalog.levels[idx];
  session.user = { ...session.user, level: meta.id as User["level"] };
  return { id: meta.id, ulpan: meta.ulpan, cefr: meta.cefr, title: titles[meta.id] || { en: meta.ulpan } };
}

  return { PASS, isGate, lessonBySlug, stageOpen, unlocked, buildPath, applyPlacement };
}
