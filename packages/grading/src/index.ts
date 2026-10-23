/** On-device mirror of apps/api/biti/grading.py. Server remains authoritative when online. */

import { normalizeHebrew, type NormalizeMode } from "../../hebrew-text/src/index.ts";

export type DiffSpan = { start: number; end: number; expected: string; got: string };

export type GradeResult = {
  result: "correct" | "incorrect" | "almost" | "skipped";
  score: number;
  rule_ids: string[];
  diff: DiffSpan[];
  normalized_answer: string;
  hint_level_applied: number;
};

function result(
  kind: GradeResult["result"],
  score: number,
  rule_ids: string[],
  extra: Partial<GradeResult> = {},
): GradeResult {
  return {
    result: kind,
    score,
    rule_ids,
    diff: extra.diff || [],
    normalized_answer: extra.normalized_answer || "",
    hint_level_applied: extra.hint_level_applied || 0,
  };
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const ins = prev[j] + 1;
      const del = cur[j - 1] + 1;
      const sub = prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      cur.push(Math.min(ins, del, sub));
    }
    for (let j = 0; j < prev.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

function diffSpans(normIn: string, normExp: string): DiffSpan[] {
  if (normIn === normExp) return [];
  const limit = Math.min(normIn.length, normExp.length);
  let start = 0;
  while (start < limit && normIn[start] === normExp[start]) start += 1;
  let endIn = normIn.length;
  let endExp = normExp.length;
  while (endIn > start && endExp > start && normIn[endIn - 1] === normExp[endExp - 1]) {
    endIn -= 1;
    endExp -= 1;
  }
  return [{ start, end: endIn, expected: normExp.slice(start, endExp), got: normIn.slice(start, endIn) }];
}

export function acceptedFor(exercise: Record<string, unknown>, source = "en"): string[] {
  const raw = exercise.accepted;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const rec = raw as Record<string, unknown>;
    const values = rec[source] || rec.he || rec.en || [];
    return Array.isArray(values) ? values.map(String) : [];
  }
  if (Array.isArray(raw)) return raw.map(String);
  return [];
}

export function pairsFor(exercise: Record<string, unknown>, source = "en"): Record<string, string> {
  const byLang = exercise.pairs_by_lang;
  if (byLang && typeof byLang === "object") {
    const rec = byLang as Record<string, Record<string, string>>;
    if (rec[source]) return { ...rec[source] };
  }
  const raw = (exercise.pairs || {}) as Record<string, string>;
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [String(k), String(v)]));
}

export function gradeText(answer: string, accepted: string[], mode: NormalizeMode = "relaxed", almostDistance = 1): GradeResult {
  if (typeof answer !== "string") return result("incorrect", 0, ["invalid_type"]);
  if (answer.length > 500) return result("incorrect", 0, ["too_long"]);
  const norm = normalizeHebrew(answer, mode);
  if (!norm) return result("incorrect", 0, ["empty"], { normalized_answer: norm });
  const norms = accepted.map((a) => normalizeHebrew(a, mode));
  if (norms.includes(norm)) return result("correct", 1, ["exact_after_norm"], { normalized_answer: norm });
  const closest = norms.reduce((best, n) => (levenshtein(norm, n) < levenshtein(norm, best) ? n : best), norms[0] || "");
  const dist = levenshtein(norm, closest);
  if (dist <= almostDistance && Math.max(norm.length, closest.length) >= 3) {
    return result("almost", 0, ["near_miss"], { diff: diffSpans(norm, closest), normalized_answer: norm });
  }
  return result("incorrect", 0, ["mismatch"], { diff: diffSpans(norm, closest), normalized_answer: norm });
}

export function gradeChoice(answer: string, accepted: string[]): GradeResult {
  if (accepted.includes(answer)) return result("correct", 1, ["choice_exact"], { normalized_answer: answer });
  return result("incorrect", 0, ["choice_mismatch"], { normalized_answer: String(answer) });
}

export function gradeOrder(answer: unknown, accepted: string[], mode: NormalizeMode = "relaxed"): GradeResult {
  if (!Array.isArray(answer)) return result("incorrect", 0, ["invalid_type"]);
  const normA = answer.map((x) => normalizeHebrew(String(x), mode));
  const normB = accepted.map((x) => normalizeHebrew(x, mode));
  if (normA.join("\0") === normB.join("\0")) {
    return result("correct", 1, ["order_exact"], { normalized_answer: normA.join(" ") });
  }
  if ([...normA].sort().join("\0") === [...normB].sort().join("\0")) {
    return result("almost", 0, ["order_wrong_but_same_tokens"], { normalized_answer: normA.join(" ") });
  }
  return result("incorrect", 0, ["order_mismatch"], { normalized_answer: normA.join(" ") });
}

export function gradeExercise(
  exercise: Record<string, unknown>,
  payload: { value?: unknown; pairs?: Record<string, string> },
  sourceLang = "en",
): GradeResult {
  const kind = String(exercise.type || "");
  const mode = (exercise.mode as NormalizeMode) || "relaxed";
  const accepted = acceptedFor(exercise, sourceLang);
  if (["mc", "listen_mc", "identify_root", "identify_binyan", "listen_tap", "drill"].includes(kind)) {
    return gradeChoice(String(payload.value ?? ""), accepted.map(String));
  }
  if (kind === "match" || kind === "match_tap") {
    const got = payload.pairs || {};
    const exp = pairsFor(exercise, sourceLang);
    const same = Object.keys(exp).length === Object.keys(got).length && Object.keys(exp).every((k) => got[k] === exp[k]);
    return same ? result("correct", 1, ["match_exact"]) : result("incorrect", 0, ["match_mismatch"]);
  }
  if (kind === "order_rtl" || kind === "tiles") {
    return gradeOrder(payload.value || [], accepted, mode);
  }
  if (kind === "speak") return result("incorrect", 0, ["speech_unavailable"]);
  if ((kind === "listen" || kind === "listen_type") && exercise.requires_audio) {
    return result("incorrect", 0, ["audio_unavailable"]);
  }
  return gradeText(String(payload.value ?? ""), accepted, mode);
}

export const PLACEMENT_ORDER = ["starter", "beginner", "elementary", "intermediate"] as const;

/**
 * Graded placement. With a per-item `levels` map, stages are checked in order: a stage is passed
 * when at least `passRatio` of its items are correct; the learner lands on the stage after the last
 * consecutively passed one (capped at `maxLevel`). Without a map, the legacy 3-item rule applies.
 */
export function gradePlacement(
  answers: Record<string, string>,
  accepted: Record<string, string[]>,
  opts: { levels?: Record<string, string>; passRatio?: number; maxLevel?: string } = {},
): { score: number; level: string; skipped: boolean; passed: string[] } {
  let score = 0;
  const right: Record<string, boolean> = {};
  for (const [id, forms] of Object.entries(accepted)) {
    right[id] = gradeText(answers[id] || "", forms).result === "correct";
    if (right[id]) score += 1;
  }
  if (!opts.levels) return { score, level: score <= 1 ? "starter" : "beginner", skipped: false, passed: [] };
  const ratio = opts.passRatio ?? 0.75;
  const order: string[] = [...PLACEMENT_ORDER];
  const cap = Math.max(0, order.indexOf(opts.maxLevel || "intermediate"));
  const passed: string[] = [];
  for (const stage of order) {
    const ids = Object.keys(accepted).filter((id) => opts.levels![id] === stage);
    if (!ids.length) break;
    const ok = ids.filter((id) => right[id]).length;
    if (ok + 1e-9 < Math.ceil(ids.length * ratio - 1e-9)) break;
    passed.push(stage);
  }
  const level = order[Math.min(passed.length, cap)];
  return { score, level, skipped: false, passed };
}
