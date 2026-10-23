import { acceptedFor, gradeExercise, gradePlacement } from "@biti/grading";
import catalog from "@/content/published.json";
import verbsData from "@/content/verbs.json";
import alphabetData from "@/content/alphabet.json";
import { dueCards, offlineAlphabet, type AlphabetData, offlinePractice, scheduleCard, today, type SrsCard } from "./offline-content";
import type { Exercise, Lesson, PathNode, PathStage, User } from "./api";
import { makePath, type PathCatalog } from "./path-core";
import { newId, peekSession, saveSession, type LocalAttempt, type LocalSession } from "./session";

const core = makePath(catalog as unknown as PathCatalog);
const { PASS, isGate, unlocked } = core;
export const buildPath = core.buildPath;
export const applyPlacement = core.applyPlacement;
type CatalogLesson = (typeof catalog.lessons)[number];

function sourceLang(courseId?: string): string {
  const map: Record<string, string> = { "he-ru": "ru", "he-uk": "uk", "he-en": "en", "he-es": "es", "he-fr": "fr" };
  return map[courseId || "he-en"] || "en";
}

function lessonBySlug(slug: string): CatalogLesson | undefined {
  return catalog.lessons.find((row) => row.slug === slug);
}


function publicExercise(ex: Record<string, unknown>): Exercise {
  const clone = { ...ex };
  delete clone.accepted;
  delete clone.pairs;
  delete clone.pairs_by_lang;
  return clone as Exercise;
}

function publicLesson(spec: CatalogLesson, courseId?: string): Lesson {
  const src = sourceLang(courseId);
  const exercises = (spec.exercises as Record<string, unknown>[]).map((ex) => {
    const pub = publicExercise(ex);
    const byLang = ex.pairs_by_lang as Record<string, Record<string, string>> | undefined;
    if (byLang) {
      const pairs = byLang[src] || byLang.en || {};
      pub.left = Object.keys(pairs);
      pub.right = Object.values(pairs);
    }
    return pub;
  });
  const mandatory = (spec.exercises as Array<{ optional?: boolean; type?: string; requires_audio?: boolean }>).filter(
    (e) => !e.optional && e.type !== "speak" && !e.requires_audio,
  );
  const gate = isGate(spec.kind);
  const levelMeta = catalog.levels.find((row) => row.id === spec.level);
  const titles = catalog.stageTitles as Record<string, Record<string, string>>;
  return {
    slug: spec.slug,
    title: spec.title as Record<string, string>,
    objective: spec.objective as Record<string, string>,
    explanation: spec.explanation as Record<string, string>,
    vocabulary: spec.vocabulary as Lesson["vocabulary"],
    exercises,
    threshold: spec.threshold,
    level: spec.level,
    cefr: spec.cefr,
    track: spec.track,
    kind: spec.kind,
    test_out: gate,
    mistake_limit: gate ? Math.max(0, mandatory.length - Math.ceil(mandatory.length * PASS - 1e-9)) : null,
    stage: {
      id: spec.level,
      ulpan: levelMeta?.ulpan || spec.level,
      cefr: spec.cefr,
      title: titles[spec.level] || { en: spec.level },
    },
    audio: { capability: "unavailable" },
    speech: { capability: "unavailable" },
  };
}

export function localUser(body: {
  ui_language: string;
  display_name: string;
  motivation: string;
  course_id?: string;
}): User {
  return {
    id: newId("user"),
    display_name: body.display_name,
    role: "learner",
    ui_language: (body.ui_language as User["ui_language"]) || "en",
    timezone: "UTC",
    motivation: body.motivation,
    xp_total: 0,
    streak: 0,
    hearts: 5,
    league: "bronze",
    level: "starter",
    daily_goal_xp: 20,
    niqqud_default: true,
    translit_default: true,
    course_id: body.course_id || "he-en",
  };
}

export function createLocalSession(body: {
  ui_language: string;
  display_name: string;
  motivation: string;
  course_id?: string;
}): LocalSession {
  return {
    source: "local",
    token: `local:${newId("tok")}`,
    user: localUser(body),
    done: {},
    attempts: {},
    badges: [],
  };
}

function sessionOrThrow(): LocalSession {
  const session = peekSession();
  if (!session) throw new Error("offline_session_missing");
  return session;
}

export function canServeLocally(path: string, method: string): boolean {
  const m = method.toUpperCase();
  if (m === "POST" && path === "/auth/demo") return true;
  if (m === "GET" && path === "/auth/me") return true;
  if (path === "/placement") return true;
  if (m === "GET" && path === "/curriculum/path") return true;
  if (m === "GET" && path.startsWith("/lessons/") && !path.endsWith("/start")) return true;
  if (m === "POST" && /\/lessons\/[^/]+\/start$/.test(path)) return true;
  if (m === "POST" && /\/attempts\/[^/]+\/(submit|complete)$/.test(path)) return true;
  if (m === "POST" && path === "/tutor/explain") return true;
  if (m === "GET" && (path === "/alphabet" || path === "/verbs" || path === "/practice" || path === "/srs/due")) return true;
  if (m === "POST" && /^\/srs\/[^/]+\/review$/.test(path)) return true;
  return false;
}

export async function localHandle<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const body = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

  if (method === "POST" && path === "/auth/demo") {
    const session = createLocalSession({
      ui_language: String(body.ui_language || "en"),
      display_name: String(body.display_name || "Learner"),
      motivation: String(body.motivation || "aliyah"),
      course_id: body.course_id ? String(body.course_id) : undefined,
    });
    await saveSession(session);
    return { access_token: session.token, user: session.user } as T;
  }

  if (method === "GET" && path === "/auth/me") {
    return sessionOrThrow().user as T;
  }

  if (method === "GET" && path === "/placement") {
    return { skippable: true, items: catalog.placement.items } as T;
  }

  if (method === "POST" && path === "/placement") {
    const session = sessionOrThrow();
    const answers = (body.answers as Record<string, string>) || {};
    const result = gradePlacement(answers, catalog.placement.accepted, {
      levels: catalog.placement.levels,
      passRatio: catalog.placement.passRatio,
      maxLevel: catalog.placement.maxLevel,
    });
    const placed = applyPlacement(session, result.level);
    await saveSession(session);
    return { ...result, total: Object.keys(catalog.placement.accepted).length, stage: placed } as T;
  }

  if (method === "GET" && path === "/curriculum/path") {
    return buildPath(sessionOrThrow()) as T;
  }

  const lessonGet = path.match(/^\/lessons\/([^/]+)$/);
  if (method === "GET" && lessonGet) {
    const spec = lessonBySlug(decodeURIComponent(lessonGet[1]));
    if (!spec) throw new Error("not_found");
    return publicLesson(spec, sessionOrThrow().user.course_id) as T;
  }

  const start = path.match(/^\/lessons\/([^/]+)\/start$/);
  if (method === "POST" && start) {
    const slug = decodeURIComponent(start[1]);
    const spec = lessonBySlug(slug);
    if (!spec) throw new Error("not_found");
    const session = sessionOrThrow();
    if (!unlocked(slug, session.done) && !(slug in session.done)) throw new Error("locked");
    const attempt: LocalAttempt = { id: newId("att"), slug, results: {}, combo: 0, hint_level: 0 };
    session.attempts[attempt.id] = attempt;
    await saveSession(session);
    return { attempt_id: attempt.id, version_id: spec.slug } as T;
  }

  const submit = path.match(/^\/attempts\/([^/]+)\/submit$/);
  if (method === "POST" && submit) {
    const session = sessionOrThrow();
    const attempt = session.attempts[submit[1]];
    if (!attempt) throw new Error("attempt_missing");
    const spec = lessonBySlug(attempt.slug);
    if (!spec) throw new Error("version_missing");
    const exercise = (spec.exercises as Record<string, unknown>[]).find((e) => e.id === body.exercise_id);
    if (!exercise) throw new Error("exercise_missing");
    const existing = attempt.results[String(body.exercise_id)];
    if (existing) return { grade: existing, replayed: true, hearts: session.user.hearts } as T;
    let grade;
    if (exercise.type === "speak" || exercise.requires_audio) {
      grade = { result: "skipped", score: 0, rule_ids: ["optional_unavailable"], diff: [] };
    } else {
      grade = gradeExercise(exercise, { value: body.value, pairs: body.pairs as Record<string, string> }, sourceLang(session.user.course_id));
      if (grade.result !== "correct") {
        const acc = acceptedFor(exercise, sourceLang(session.user.course_id));
        if (acc.length && exercise.type === "type_he") {
          const id = `${attempt.slug}:${String(body.exercise_id)}`;
          session.srs = session.srs || {};
          session.srs[id] = { id, kind: "exercise", prompt: { id, he: acc[0], ...((exercise.prompt as object) || {}) }, accepted: acc, step: 0, due_day: today() };
        }
        session.user = { ...session.user, hearts: Math.max(0, session.user.hearts - 1) };
        attempt.combo = 0;
      } else {
        attempt.combo += 1;
      }
    }
    attempt.results[String(body.exercise_id)] = grade;
    await saveSession(session);
    return { grade, replayed: false, hearts: session.user.hearts, combo: attempt.combo } as T;
  }

  const complete = path.match(/^\/attempts\/([^/]+)\/complete$/);
  if (method === "POST" && complete) {
    const session = sessionOrThrow();
    const attempt = session.attempts[complete[1]];
    if (!attempt) throw new Error("attempt_missing");
    const spec = lessonBySlug(attempt.slug);
    if (!spec) throw new Error("version_missing");
    const mandatory = (spec.exercises as Array<{ id: string; optional?: boolean; type?: string; requires_audio?: boolean; xp?: number }>).filter(
      (e) => !e.optional && e.type !== "speak" && !e.requires_audio,
    );
    const grades = mandatory.map((e) => attempt.results[e.id]);
    if (grades.some((g) => !g)) throw new Error("incomplete");
    const correct = grades.filter((g) => g.result === "correct").length;
    const accuracy = correct / Math.max(1, grades.length);
    session.done[attempt.slug] = Math.max(session.done[attempt.slug] || 0, accuracy);
    const passed = accuracy + 1e-9 >= (spec.threshold || PASS);
    let xp = 0;
    let badge: { stage_id: string; title: Record<string, string> } | null = null;
    let nextStage: string | null = null;
    const review: Array<{ id: string; prompt?: Record<string, string>; he?: string }> = [];
    if (passed) {
      xp = correct * 10;
      session.user = { ...session.user, xp_total: session.user.xp_total + xp };
      if (isGate(spec.kind)) {
        if (!session.badges.includes(spec.level)) session.badges.push(spec.level);
        const titles = catalog.stageTitles as Record<string, Record<string, string>>;
        badge = { stage_id: spec.level, title: titles[spec.level] || { en: spec.level } };
        const ids = catalog.levels.map((row) => row.id);
        const idx = ids.indexOf(spec.level);
        nextStage = idx >= 0 && idx + 1 < ids.length ? ids[idx + 1] : null;
      }
    } else if (isGate(spec.kind)) {
      for (const e of mandatory) {
        if (attempt.results[e.id]?.result === "correct") continue;
        const acc = acceptedFor(e as unknown as Record<string, unknown>, sourceLang(session.user.course_id));
        review.push({ id: e.id, prompt: (e as { prompt?: Record<string, string> }).prompt, he: acc[0] });
      }
    }
    await saveSession(session);
    return {
      accuracy,
      xp_awarded: xp,
      passed,
      kind: spec.kind,
      review,
      badge,
      next_stage_unlocked: nextStage,
    } as T;
  }

  if (method === "GET" && path === "/alphabet") return offlineAlphabet(alphabetData as AlphabetData) as T;
  if (method === "GET" && path === "/verbs") return verbsData as T;
  if (method === "GET" && path === "/practice") {
    const session = sessionOrThrow();
    return offlinePractice(session.done, session.srs || {}, session.user.hearts) as T;
  }
  if (method === "GET" && path === "/srs/due") {
    const cards: SrsCard[] = dueCards(sessionOrThrow().srs || {});
    return { today: today(), cards: cards.map(({ accepted: _a, ...rest }) => rest) } as T;
  }
  const srsReview = path.match(/^\/srs\/([^/]+)\/review$/);
  if (method === "POST" && srsReview) {
    const session = sessionOrThrow();
    const id = decodeURIComponent(srsReview[1]);
    const card = session.srs?.[id];
    if (!card) throw new Error("card_missing");
    const grade = gradeExercise({ type: "type_he", accepted: card.accepted, mode: "relaxed" }, { value: body.value }, "en");
    const correct = grade.result === "correct";
    const next = scheduleCard(card, correct);
    session.srs = { ...session.srs, [id]: next };
    if (correct) session.user = { ...session.user, xp_total: session.user.xp_total + 5 };
    await saveSession(session);
    return { grade, next_due: next.due_day, step: next.step, intervals: [1, 3, 7, 14, 30] } as T;
  }

  if (method === "POST" && path === "/tutor/explain") {
    return { summary: "The tutor is unavailable offline." } as T;
  }

  throw new Error("offline_unsupported");
}

export function firstPublishedSlug(): string {
  return catalog.lessons[0]?.slug || "script-alef-he";
}

export { catalog };
