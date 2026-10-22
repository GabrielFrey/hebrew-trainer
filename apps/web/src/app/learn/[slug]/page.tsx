"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BitiMascot } from "@/components/BitiMascot";
import { HebrewKeyboard } from "@/components/HebrewKeyboard";
import { HebrewText } from "@/components/HebrewText";
import { api, type Exercise, type Lesson } from "@/lib/api";
import { loc, useT } from "@/lib/i18n";

type Grade = { result: string; rule_ids: string[]; diff: Array<{ start: number; end: number; expected: string; got: string }> };

type CompleteResult = {
  accuracy: number;
  xp_awarded: number;
  passed: boolean;
  kind?: string;
  review?: Array<{ id: string; source_slug?: string; prompt?: Record<string, string>; he?: string }>;
  badge?: { stage_id: string; title: Record<string, string> } | null;
  next_stage_unlocked?: string | null;
};

export default function LessonPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="p-8 text-ink-soft">…</p>}>
        <Player />
      </Suspense>
    </AppShell>
  );
}

function Player() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useT();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [attempt, setAttempt] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [done, setDone] = useState<CompleteResult | null>(null);
  const [gateOpen, setGateOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [niqqud, setNiqqud] = useState(true);
  const [translit, setTranslit] = useState(true);
  const [explain, setExplain] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [combo, setCombo] = useState(0);

  useEffect(() => {
    const on = () => setOffline(!navigator.onLine);
    on();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<Lesson>(`/lessons/${slug}`);
        if (cancelled) return;
        setLesson(data);
        const gate = data.kind === "checkpoint" || data.kind === "boss" || data.kind === "legendary";
        setGateOpen(gate);
        if (!gate) {
          const started = await api<{ attempt_id: string }>(`/lessons/${slug}/start`, { method: "POST" });
          if (!cancelled) setAttempt(started.attempt_id);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function beginGate() {
    if (!slug) return;
    const started = await api<{ attempt_id: string }>(`/lessons/${slug}/start`, { method: "POST" });
    setAttempt(started.attempt_id);
    setGateOpen(false);
  }

  const exercises = useMemo(
    () => (lesson?.exercises || []).filter((e) => !(e.requires_audio && lesson?.audio.capability === "unavailable")),
    [lesson],
  );
  const current = exercises[idx];

  async function check() {
    if (!attempt || !current) return;
    const payload: Record<string, unknown> = { exercise_id: current.id, client_key: `${attempt}-${current.id}` };
    if (current.type === "match" || current.type === "match_tap") payload.pairs = pairs;
    else if (current.type === "order_rtl" || current.type === "tiles") payload.value = order;
    else payload.value = value;
    try {
      const res = await api<{ grade: Grade; combo?: number }>(`/attempts/${attempt}/submit`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setGrade(res.grade);
      setCombo(res.combo || 0);
    } catch (err) {
      queueOffline({ attempt_id: attempt, type: "submit", body: payload });
      setError(err instanceof Error ? err.message : "offline");
    }
  }

  async function next() {
    setGrade(null);
    setValue("");
    setPairs({});
    setOrder([]);
    setExplain(null);
    if (idx + 1 < exercises.length) {
      setIdx(idx + 1);
      return;
    }
    if (!attempt) return;
    const res = await api<CompleteResult>(`/attempts/${attempt}/complete`, {
      method: "POST",
    });
    setDone(res);
  }

  async function askExplain() {
    if (!attempt || !current) return;
    const res = await api<{ summary: string }>(`/tutor/explain`, {
      method: "POST",
      body: JSON.stringify({ attempt_id: attempt, exercise_id: current.id }),
    });
    setExplain(res.summary);
  }

  if (error && !lesson) return <p className="text-incorrect">{t("lesson.error")} {error}</p>;
  if (!lesson) return <p>{t("states.loading")}</p>;
  if (gateOpen && (lesson.kind === "checkpoint" || lesson.kind === "boss" || lesson.kind === "legendary")) {
    return (
      <div data-testid="checkpoint-start" className="rounded-3xl bg-paper p-6">
        <p className="text-5xl" aria-hidden="true">
          🏆
        </p>
        <p className="mt-2 text-xs uppercase tracking-wide text-ink-soft">
          {lesson.stage?.ulpan} · {lesson.cefr}
        </p>
        <h1 className="text-3xl font-semibold">{t("checkpoint.startTitle")}</h1>
        <p className="mt-2 text-ink-soft">{t("checkpoint.startBody")}</p>
        <p className="mt-3 font-medium">
          <span aria-hidden="true" className="me-1">
            ✓
          </span>
          {t("checkpoint.passNeed")}
        </p>
        <p className="font-medium">
          <span aria-hidden="true" className="me-1">
            ×
          </span>
          {t("checkpoint.mistakes")}
          {lesson.mistake_limit != null ? ` · ${lesson.mistake_limit}` : ""}
        </p>
        <p className="mt-2 text-sm text-ink-soft">{t("checkpoint.xpNote")}</p>
        <button
          type="button"
          data-testid="checkpoint-begin"
          onClick={beginGate}
          className="mt-5 rounded-full bg-pomegranate px-5 py-2 text-paper"
        >
          {t("checkpoint.begin")}
        </button>
      </div>
    );
  }
  if (!current) return <p>{t("states.loading")}</p>;
  if (done) {
    const gate = done.kind === "checkpoint" || lesson.kind === "checkpoint";
    if (gate && done.passed) {
      return (
        <div data-testid="checkpoint-pass" className="rounded-3xl border-2 border-correct bg-correct-bg p-6">
          <BitiMascot lang={lang} mood="happy" />
          <p data-testid="feedback-result" className="text-xl font-semibold text-correct">
            <span aria-hidden="true" className="me-2">
              ✓
            </span>
            {t("checkpoint.passed")}
          </p>
          <p data-testid="celebration">{t("checkpoint.badgeAwarded")}</p>
          {done.badge ? <p className="text-lg font-medium">{loc(done.badge.title, lang)}</p> : null}
          {done.next_stage_unlocked ? <p>{t("checkpoint.nextOpen")}</p> : null}
          <p>
            {t("lesson.scoreLine", { percent: Math.round(done.accuracy * 100), xp: done.xp_awarded })}
          </p>
          <p className="mt-2 text-sm">{t("checkpoint.xpNote")}</p>
        </div>
      );
    }
    if (gate && !done.passed) {
      return (
        <div data-testid="checkpoint-fail" className="rounded-3xl border-2 border-incorrect bg-incorrect-bg p-6">
          <BitiMascot lang={lang} mood="sad" />
          <p data-testid="feedback-result" className="text-xl font-semibold text-incorrect">
            <span aria-hidden="true" className="me-2">
              ×
            </span>
            {t("checkpoint.failed")}
          </p>
          <p>
            {t("lesson.accuracy", { percent: Math.round(done.accuracy * 100) })}
          </p>
          <h2 className="mt-4 font-medium">{t("checkpoint.reviewThese")}</h2>
          <ul data-testid="checkpoint-review" className="mt-2 space-y-2">
            {(done.review || []).map((item) => (
              <li key={item.id} className="rounded-2xl bg-paper px-3 py-2">
                <p>{item.prompt ? loc(item.prompt, lang) : item.id}</p>
                {item.he ? (
                  <p lang="he" dir="rtl" className="he">
                    {item.he}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <Link href={`/learn/${slug}`} className="mt-4 inline-block rounded-full bg-indigo px-5 py-2 text-paper">
            {t("checkpoint.tryAgain")}
          </Link>
        </div>
      );
    }
    return (
      <div data-testid="lesson-complete" className="rounded-3xl bg-paper p-6">
        <BitiMascot lang={lang} mood="happy" />
        <h1 className="text-3xl font-semibold">{t("lesson.finish")}</h1>
        <p data-testid="celebration">{t("lesson.celebrate")}</p>
        <p>{t("lesson.scoreLine", { percent: Math.round(done.accuracy * 100), xp: done.xp_awarded })}</p>
      </div>
    );
  }

  return (
    <article data-testid="lesson-player" className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="rounded-3xl bg-paper p-5 shadow-sm">
        <p className="text-sm text-ink-soft">
          {lesson.level} · {lesson.cefr} · {idx + 1}/{exercises.length}
          {combo > 1 ? (
            <span data-testid="combo" className="ms-2 rounded-full bg-gold/20 px-2 py-0.5">
              {t("lesson.combo")} ×{combo}
            </span>
          ) : null}
        </p>
        <h1 className="text-3xl font-semibold">{loc(lesson.title, lang)}</h1>
        <p className="mt-2 text-ink-soft">{loc(lesson.explanation, lang)}</p>
        <p data-testid="bidi-mix" className="mt-3 text-lg">
          <HebrewText testId="niqqud-sample" pointed="שָׁלוֹם" showNiqqud={niqqud}>
            שלום
          </HebrewText>{" "}
          Biti 42
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="toggle-niqqud"
            className="rounded-full border border-line px-3 py-1 text-sm"
            onClick={() => setNiqqud((v) => !v)}
          >
            {t("lesson.niqqud")}: {niqqud ? t("lesson.niqqudOn") : t("lesson.niqqudOff")}
          </button>
          <button
            type="button"
            data-testid="toggle-translit"
            className="rounded-full border border-line px-3 py-1 text-sm"
            onClick={() => setTranslit((v) => !v)}
          >
            {t("lesson.translit")}: {translit ? t("lesson.niqqudOn") : t("lesson.niqqudOff")}
          </button>
        </div>
        {lesson.audio.capability === "unavailable" ? (
          <p data-testid="audio-unavailable" className="mt-3 rounded-2xl bg-sand-deep px-3 py-2 text-sm">
            {t("lesson.audioUnavailable")}
          </p>
        ) : null}
        {offline ? <p className="mt-3 text-sm text-almost">{t("lesson.offline")}</p> : null}
        <hr className="my-5 border-line" />
        <p data-testid="exercise-prompt" className="mb-3 text-lg">
          {loc(current.prompt, lang)}
        </p>
        <ExerciseBody
          exercise={current}
          value={value}
          setValue={setValue}
          pairs={pairs}
          setPairs={setPairs}
          order={order}
          setOrder={setOrder}
          niqqud={niqqud}
        />
        {grade ? (
          <Feedback grade={grade} t={t} />
        ) : null}
        {explain ? <p className="mt-3 rounded-2xl bg-sand-deep p-3 text-sm">{explain}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" data-testid="check-answer" onClick={check} className="rounded-full bg-indigo px-5 py-2 text-paper">
            {t("lesson.check")}
          </button>
          {grade ? (
            <button type="button" data-testid="next-exercise" onClick={next} className="rounded-full bg-olive px-5 py-2 text-paper">
              {idx + 1 < exercises.length ? t("lesson.next") : t("lesson.finish")}
            </button>
          ) : null}
          {grade && grade.result !== "correct" ? (
            <button type="button" onClick={askExplain} className="rounded-full border border-line px-4 py-2">
              {t("lesson.explain")}
            </button>
          ) : null}
        </div>
      </div>
      <aside className="space-y-3">
        <BitiMascot lang={lang}
          mood={
            combo > 1 && grade?.result === "correct"
              ? "streak"
              : grade?.result === "correct"
                ? "happy"
                : grade?.result === "almost"
                  ? "think"
                  : grade
                    ? "sad"
                    : "idle"
          }
        />
        <div className="rounded-3xl bg-paper p-4">
          <h2 className="mb-2 font-medium">Vocabulary</h2>
          <ul className="space-y-2">
            {lesson.vocabulary.map((v) => (
              <li key={String(v.lemma)} className="border-b border-line pb-2">
                <HebrewText pointed={v.pointed} showNiqqud={niqqud}>
                  {String(v.lemma)}
                </HebrewText>
                {translit ? <p className="text-sm text-ink-soft">{String(v.translit || "")}</p> : null}
                <p className="text-sm">{String(v[lang] || v.en || v.ru || "")}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </article>
  );
}

function ExerciseBody({
  exercise,
  value,
  setValue,
  pairs,
  setPairs,
  order,
  setOrder,
  niqqud,
}: {
  exercise: Exercise;
  value: string;
  setValue: (v: string) => void;
  pairs: Record<string, string>;
  setPairs: (v: Record<string, string>) => void;
  order: string[];
  setOrder: (v: string[]) => void;
  niqqud: boolean;
}) {
  if (
    exercise.type === "mc" ||
    exercise.type === "identify_root" ||
    exercise.type === "identify_binyan" ||
    exercise.type === "listen_mc" ||
    exercise.type === "listen_tap" ||
    exercise.type === "drill"
  ) {
    return (
      <div className="grid gap-2">
        {(exercise.choices || []).map((c) => {
          const id = c.id;
          const label = c.he || c.en || c.ru || id;
          return (
            <button
              key={id}
              type="button"
              data-testid={`choice-${id}`}
              onClick={() => setValue(id)}
              className={`rounded-2xl border px-4 py-3 text-start ${value === id ? "border-indigo bg-sand" : "border-line"}`}
            >
              {c.he ? <HebrewText showNiqqud={niqqud}>{c.he}</HebrewText> : label}
            </button>
          );
        })}
      </div>
    );
  }
  if (exercise.type === "match_tap") {
    return <MatchTap exercise={exercise} pairs={pairs} setPairs={setPairs} />;
  }
  if (exercise.type === "match") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <ul className="space-y-2">
          {(exercise.left || []).map((item) => (
            <li key={item} className="rounded-xl bg-sand-deep px-3 py-2">
              <HebrewText>{item}</HebrewText>
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          {(exercise.left || []).map((item, i) => (
            <li key={item}>
              <input
                data-testid={`match-${item}`}
                className="w-full rounded-xl border border-line px-2 py-2"
                placeholder={exercise.right?.[i] || ""}
                value={pairs[item] || ""}
                onChange={(e) => setPairs({ ...pairs, [item]: e.target.value })}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (exercise.type === "order_rtl" || exercise.type === "tiles") {
    return (
      <div dir="rtl" className="space-y-3">
        <div className="flex min-h-12 flex-wrap gap-2 rounded-2xl border border-line p-2">
          {order.map((tok, i) => (
            <button key={`${tok}-${i}`} type="button" className="he rounded-xl bg-indigo px-3 py-1 text-paper" onClick={() => setOrder(order.filter((_, j) => j !== i))}>
              {tok}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(exercise.tokens || []).map((tok) => (
            <button key={tok} type="button" data-testid={`token-${tok}`} className="he rounded-xl border border-line px-3 py-1" onClick={() => setOrder([...order, tok])}>
              {tok}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (exercise.type === "trace") {
    return (
      <p className="rounded-2xl bg-sand-deep p-4 text-sm">
        Tracing canvas fallback: type the letter. A dedicated cursive OFL font is not vendored yet.
        <HebrewKeyboard value={value} onChange={setValue} />
      </p>
    );
  }
  if (exercise.type === "speak") {
    return (
      <p data-testid="speech-unavailable" className="rounded-2xl bg-sand-deep p-3">
        Speaking is unavailable without a speech provider.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="sr-only">Hebrew answer</span>
        <input
          data-testid="hebrew-input"
          dir="rtl"
          lang="he"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="he w-full rounded-2xl border-2 border-line bg-sand px-3 py-2"
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Hebrew answer"
        />
      </label>
      <HebrewKeyboard value={value} onChange={setValue} niqqud={niqqud} />
    </div>
  );
}

function MatchTap({
  exercise,
  pairs,
  setPairs,
}: {
  exercise: Exercise;
  pairs: Record<string, string>;
  setPairs: (v: Record<string, string>) => void;
}) {
  const [pick, setPick] = useState<string | null>(null);
  const left = exercise.left || [];
  const right = exercise.right || [];
  return (
    <div className="grid grid-cols-2 gap-3" data-testid="match-tap">
      <ul className="space-y-2">
        {left.map((item) => (
          <li key={item}>
            <button
              type="button"
              data-testid={`match-left-${item}`}
              onClick={() => setPick(item)}
              className={`he w-full rounded-xl border px-3 py-2 ${pick === item ? "border-indigo" : "border-line"}`}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
      <ul className="space-y-2">
        {right.map((label) => (
          <li key={label}>
            <button
              type="button"
              data-testid={`match-right-${label}`}
              onClick={() => {
                if (!pick) return;
                setPairs({ ...pairs, [pick]: label });
                setPick(null);
              }}
              className={`w-full rounded-xl border border-line px-3 py-2 text-start ${
                Object.values(pairs).includes(label) ? "bg-sand" : ""
              }`}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Feedback({ grade, t }: { grade: Grade; t: (k: string) => string }) {
  const kind = grade.result === "correct" ? "correct" : grade.result === "almost" ? "almost" : "incorrect";
  const icon = kind === "correct" ? "✓" : kind === "almost" ? "~" : "×";
  const sheet =
    kind === "correct"
      ? "bg-correct-bg border-correct text-correct"
      : kind === "almost"
        ? "bg-almost-bg border-almost text-almost"
        : "bg-incorrect-bg border-incorrect text-incorrect";
  const label = kind === "correct" ? t("lesson.correct") : kind === "almost" ? t("lesson.almost") : t("lesson.incorrect");
  return (
    <div data-testid="feedback" role="status" className={`mt-4 rounded-2xl border-2 p-3 ${sheet}`}>
      <p data-testid="feedback-result" className="font-medium">
        <span aria-hidden="true" className="me-2 text-xl">
          {icon}
        </span>
        {label}
      </p>
      {grade.diff?.length ? (
        <p className="text-sm">
          {grade.diff.map((d) => (
            <span data-testid="diff-span" key={`${d.start}-${d.end}`}>
              <bdi>{d.got || "∅"}</bdi> → <bdi>{d.expected}</bdi>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

function queueOffline(event: Record<string, unknown>) {
  const key = "biti-offline-queue";
  const cur = JSON.parse(localStorage.getItem(key) || "[]");
  cur.push(event);
  localStorage.setItem(key, JSON.stringify(cur));
}
