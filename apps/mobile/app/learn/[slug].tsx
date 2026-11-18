import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { BitiMascot } from "@/components/BitiMascot";
import { HebrewKeyboard } from "@/components/HebrewKeyboard";
import { HandwritingCanvas } from "@/components/HandwritingCanvas";
import { HebrewText } from "@/components/HebrewText";
import { LessonHud } from "@/components/LessonHud";
import { Shell } from "@/components/Shell";
import { api, connectionState, userFacingError, type Exercise, type Lesson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loc, t, type UiLang } from "@/lib/i18n";
import { glyphForChar, recognise, type Stroke } from "@/lib/handwriting";
import { enqueueSubmit } from "@/lib/offline";
import { usePalette } from "@/lib/theme";

type Grade = {
  result: string;
  rule_ids: string[];
  diff: Array<{ start: number; end: number; expected: string; got: string }>;
};

type CompleteResult = {
  accuracy: number;
  xp_awarded: number;
  passed?: boolean;
  kind?: string;
  review?: Array<{ id: string; source_slug?: string; prompt?: Record<string, string>; he?: string }>;
  badge?: { stage_id: string; title: Record<string, string> } | null;
  next_stage_unlocked?: string | null;
};

const COURSE_LANG: Record<string, string> = { "he-ru": "ru", "he-uk": "uk", "he-en": "en", "he-es": "es", "he-fr": "fr" };

export default function LessonScreen() {
  return (
    <Shell>
      <Player />
    </Shell>
  );
}

function Player() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { lang, user } = useAuth();
  const palette = usePalette();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [attempt, setAttempt] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [done, setDone] = useState<CompleteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(true);
  const [niqqud, setNiqqud] = useState(true);
  const [translit, setTranslit] = useState(true);
  const [explain, setExplain] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [hearts, setHearts] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [expected, setExpected] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

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
        if (!cancelled) setError(userFacingError(err, lang));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, nonce, lang]);

  const exercises = useMemo(
    () => (lesson?.exercises || []).filter((e) => !(e.requires_audio && lesson?.audio.capability === "unavailable")),
    [lesson],
  );
  const current = exercises[idx];
  const courseLang = COURSE_LANG[user?.course_id || ""] || "en";
  const glossFallback = Boolean(lesson?.l10n_fallback?.includes(courseLang));

  async function check() {
    if (!attempt || !current) return;
    const payload: Record<string, unknown> = { exercise_id: current.id, client_key: `${attempt}-${current.id}` };
    if (current.type === "match" || current.type === "match_tap") payload.pairs = pairs;
    else if (current.type === "order_rtl" || current.type === "tiles") payload.value = order;
    else payload.value = value;
    try {
      const res = await api<{ grade: Grade; hearts?: number; combo?: number; expected?: string | null }>(`/attempts/${attempt}/submit`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setGrade(res.grade);
      if (typeof res.hearts === "number") setHearts(res.hearts);
      setCombo(res.combo || 0);
      setExpected(res.expected || null);
      setOffline(false);
    } catch {
      await enqueueSubmit(attempt, payload);
      setOffline(true);
    }
  }

  async function next() {
    setGrade(null);
    setExpected(null);
    setValue("");
    setPairs({});
    setOrder([]);
    setExplain(null);
    if (idx + 1 < exercises.length) {
      setIdx(idx + 1);
      return;
    }
    if (!attempt) return;
    const res = await api<CompleteResult>(`/attempts/${attempt}/complete`, { method: "POST" });
    setDone(res);
  }

  async function beginGate() {
    if (!slug) return;
    const started = await api<{ attempt_id: string }>(`/lessons/${slug}/start`, { method: "POST" });
    setAttempt(started.attempt_id);
    setGateOpen(false);
  }

  async function askExplain() {
    if (!attempt || !current) return;
    const res = await api<{ summary: string }>("/tutor/explain", {
      method: "POST",
      body: JSON.stringify({ attempt_id: attempt, exercise_id: current.id }),
    });
    setExplain(res.summary);
  }

  if (error && !lesson) {
    return (
      <View style={{ gap: 12 }}>
        <Text testID="lesson-error" style={{ color: palette.incorrect }}>
          {error}
        </Text>
        <Pressable
          testID="lesson-retry"
          accessibilityRole="button"
          accessibilityLabel={t(lang, "states.retry")}
          onPress={() => {
            setError(null);
            setNonce((n) => n + 1);
          }}
          style={pill(palette, false)}
        >
          <Text style={{ color: palette.ink, textAlign: "center" }}>{t(lang, "states.retry")}</Text>
        </Pressable>
      </View>
    );
  }
  if (!lesson) return <Text>{t(lang, "states.loading")}</Text>;
  const stageTitle = lesson.stage ? loc(lesson.stage.title, lang) : lesson.level;
  if (gateOpen && (lesson.kind === "checkpoint" || lesson.kind === "boss" || lesson.kind === "legendary")) {
    return (
      <View testID="checkpoint-start" style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 8 }}>
        <Text style={{ fontSize: 40 }}>🏆</Text>
        <Text style={{ color: palette.inkSoft, textTransform: "uppercase" }}>
          {stageTitle} · {lesson.cefr}
        </Text>
        <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>{t(lang, "checkpoint.startTitle")}</Text>
        <Text style={{ color: palette.inkSoft }}>{t(lang, "checkpoint.startBody")}</Text>
        <Text style={{ color: palette.ink }}>✓ {t(lang, "checkpoint.passNeed")}</Text>
        <Text style={{ color: palette.ink }}>
          × {t(lang, "checkpoint.mistakes")}
          {lesson.mistake_limit != null ? ` · ${lesson.mistake_limit}` : ""}
        </Text>
        <Pressable
          testID="checkpoint-begin"
          accessibilityRole="button"
          accessibilityLabel={t(lang, "checkpoint.begin")}
          onPress={beginGate}
          style={[pill(palette, true), { backgroundColor: palette.pomegranate, alignSelf: "flex-start" }]}
        >
          <Text style={{ color: palette.paper, fontWeight: "600" }}>{t(lang, "checkpoint.begin")}</Text>
        </Pressable>
      </View>
    );
  }
  if (!current) return <Text>{t(lang, "states.loading")}</Text>;
  if (done) {
    const gate = done.kind === "checkpoint" || lesson.kind === "checkpoint";
    if (gate && done.passed) {
      return (
        <View testID="checkpoint-pass" style={{ backgroundColor: palette.correctBg, borderRadius: 24, padding: 20, gap: 8, borderWidth: 2, borderColor: palette.correct }}>
          <BitiMascot lang={lang} mood="happy" />
          <Text testID="feedback-result" style={{ fontSize: 22, fontWeight: "700", color: palette.correct }}>
            ✓ {t(lang, "checkpoint.passed")}
          </Text>
          <Text>{t(lang, "checkpoint.badgeAwarded")}</Text>
          {done.badge ? <Text style={{ fontSize: 18, fontWeight: "600" }}>{loc(done.badge.title, lang)}</Text> : null}
          {done.next_stage_unlocked ? <Text>{t(lang, "checkpoint.nextOpen")}</Text> : null}
          <Text>
            {t(lang, "lesson.scoreLine", { percent: Math.round(done.accuracy * 100), xp: done.xp_awarded })}
          </Text>
        </View>
      );
    }
    if (gate && !done.passed) {
      return (
        <View testID="checkpoint-fail" style={{ backgroundColor: palette.incorrectBg, borderRadius: 24, padding: 20, gap: 8, borderWidth: 2, borderColor: palette.incorrect }}>
          <BitiMascot lang={lang} mood="sad" />
          <Text testID="feedback-result" style={{ fontSize: 22, fontWeight: "700", color: palette.incorrect }}>
            × {t(lang, "checkpoint.failed")}
          </Text>
          <Text>{t(lang, "lesson.accuracy", { percent: Math.round(done.accuracy * 100) })}</Text>
          <Text style={{ fontWeight: "600" }}>{t(lang, "checkpoint.reviewThese")}</Text>
          <View testID="checkpoint-review">
            {(done.review || []).map((item) => (
              <View key={item.id} style={{ backgroundColor: palette.paper, borderRadius: 16, padding: 10, marginBottom: 8 }}>
                <Text>{item.prompt ? loc(item.prompt, lang) : item.id}</Text>
                {item.he ? <Text {...({ lang: "he" } as object)}>{item.he}</Text> : null}
              </View>
            ))}
          </View>
        </View>
      );
    }
    return (
      <View testID="lesson-complete" style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 8 }}>
        <BitiMascot lang={lang} mood="happy" />
        <Text style={{ fontSize: 28, fontWeight: "700", color: palette.ink }}>{t(lang, "lesson.finish")}</Text>
        <Text style={{ color: palette.ink }}>
          {t(lang, "lesson.scoreLine", { percent: Math.round(done.accuracy * 100), xp: done.xp_awarded })}
        </Text>
      </View>
    );
  }

  const tutorOffline = offline || connectionState() === "offline";

  return (
    <View testID="lesson-player" style={{ gap: 12 }}>
      <View style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 16, gap: 10 }}>
        <LessonHud lang={lang} index={idx + (grade ? 1 : 0)} total={exercises.length} hearts={hearts} combo={combo} />
        <Text style={{ color: palette.inkSoft, fontSize: 13 }}>
          {stageTitle} · {lesson.cefr}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: "700", color: palette.ink }}>{loc(lesson.title, lang)}</Text>
        <Text style={{ color: palette.inkSoft }}>{loc(lesson.explanation, lang)}</Text>
        {glossFallback ? (
          <Text testID="l10n-fallback" style={{ color: palette.inkSoft }}>
            {t(lang, "lesson.enFallback")}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Pressable
            testID="toggle-niqqud"
            accessibilityRole="button"
            accessibilityLabel={t(lang, "lesson.niqqud")}
            onPress={() => setNiqqud((v) => !v)}
            style={chip(palette)}
          >
            <Text style={{ color: palette.ink }}>
              {t(lang, "lesson.niqqud")}: {niqqud ? t(lang, "lesson.niqqudOn") : t(lang, "lesson.niqqudOff")}
            </Text>
          </Pressable>
          <Pressable
            testID="toggle-translit"
            accessibilityRole="button"
            accessibilityLabel={t(lang, "lesson.translit")}
            onPress={() => setTranslit((v) => !v)}
            style={chip(palette)}
          >
            <Text style={{ color: palette.ink }}>
              {t(lang, "lesson.translit")}: {translit ? t(lang, "lesson.niqqudOn") : t(lang, "lesson.niqqudOff")}
            </Text>
          </Pressable>
        </View>
        {offline ? <Text style={{ color: palette.almost }}>{t(lang, "lesson.offline")}</Text> : null}
        {current.context?.length ? (
          <View style={{ gap: 8 }}>
            {current.context.map((line, i) => (
              <View key={`${line.he}-${i}`} style={{ gap: 2 }}>
                {line.speaker ? (
                  <Text style={{ color: palette.inkSoft }}>{t(lang, "lesson.speaker", { name: line.speaker })}</Text>
                ) : null}
                <HebrewText showNiqqud={niqqud}>{line.he}</HebrewText>
                {grade && line.tr ? <Text style={{ color: palette.ink }}>{loc(line.tr, lang)}</Text> : null}
                {line.source ? (
                  <Text style={{ color: palette.inkSoft }}>
                    {t(lang, "lesson.source")}: {loc(line.source, lang)}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
        <Text testID="exercise-prompt" style={{ fontSize: 18, color: palette.ink }}>
          {loc(current.prompt, lang)}
        </Text>
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
        {grade ? <Feedback grade={grade} label={gradeLabel(grade.result, lang)} expected={expected} lang={lang} niqqud={niqqud} /> : null}
        {explain ? <Text style={{ backgroundColor: palette.sandDeep, padding: 10, borderRadius: 16 }}>{explain}</Text> : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Pressable
            testID="check-answer"
            accessibilityRole="button"
            accessibilityLabel={t(lang, "lesson.check")}
            onPress={check}
            style={[pill(palette, true), { backgroundColor: palette.indigo }]}
          >
            <Text style={{ color: palette.paper }}>{t(lang, "lesson.check")}</Text>
          </Pressable>
          {grade ? (
            <Pressable
              testID="next-exercise"
              accessibilityRole="button"
              accessibilityLabel={idx + 1 < exercises.length ? t(lang, "lesson.next") : t(lang, "lesson.finish")}
              onPress={next}
              style={[pill(palette, true), { backgroundColor: palette.olive }]}
            >
              <Text style={{ color: palette.paper }}>{idx + 1 < exercises.length ? t(lang, "lesson.next") : t(lang, "lesson.finish")}</Text>
            </Pressable>
          ) : null}
          {grade && grade.result !== "correct" && !tutorOffline ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(lang, "lesson.explain")}
              onPress={askExplain}
              style={pill(palette, false)}
            >
              <Text style={{ color: palette.ink }}>{t(lang, "lesson.explain")}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <VocabPanel
        lesson={lesson}
        lang={lang}
        niqqud={niqqud}
        translit={translit}
        mood={grade?.result === "correct" ? "happy" : grade?.result === "almost" ? "think" : grade ? "sad" : "idle"}
      />
    </View>
  );
}

function VocabPanel({
  lesson,
  lang,
  niqqud,
  translit,
  mood,
}: {
  lesson: Lesson;
  lang: UiLang;
  niqqud: boolean;
  translit: boolean;
  mood: "happy" | "think" | "sad" | "idle";
}) {
  const palette = usePalette();
  const kind = lesson.vocabulary[0]?.kind;
  const heading = kind === "line" ? t(lang, "lesson.lines") : kind === "verse" ? t(lang, "lesson.verses") : t(lang, "lesson.vocabulary");
  return (
    <View style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 16, gap: 8 }}>
      <BitiMascot lang={lang} mood={mood} />
      <Text style={{ fontWeight: "600", color: palette.ink }}>{heading}</Text>
      {lesson.vocabulary.map((v, i) => {
        const gloss = String((lang === "ru" ? v.ru : v[lang]) || v.en || v.ru || "");
        const exampleHe = v.example_he || "";
        const exampleGloss = lang === "ru" ? v.example_ru || v.example_en || "" : v.example_en || v.example_ru || "";
        const usage = lang === "ru" ? v.usage_ru || v.usage_en || "" : v.usage_en || v.usage_ru || "";
        const literal = lang === "ru" ? v.literal_ru || v.literal_en || "" : v.literal_en || v.literal_ru || "";
        const citation = v[`source_${lang}`] || v.source_en || "";
        const ref = v[`ref_${lang}`] || v.ref_en || "";
        return (
          <View key={`${v.lemma}-${i}`} style={{ borderBottomWidth: 1, borderBottomColor: palette.line, paddingBottom: 8, gap: 2 }}>
            <HebrewText pointed={v.pointed} showNiqqud={niqqud}>
              {String(v.lemma || "")}
            </HebrewText>
            {translit && v.translit ? <Text style={{ color: palette.inkSoft }}>{v.translit}</Text> : null}
            {gloss ? <Text style={{ color: palette.ink }}>{gloss}</Text> : null}
            {exampleHe ? (
              <View style={{ gap: 2 }}>
                <Text style={{ color: palette.inkSoft }}>{t(lang, "lesson.example")}</Text>
                <HebrewText showNiqqud={niqqud}>{exampleHe}</HebrewText>
                {exampleGloss ? <Text style={{ color: palette.ink }}>{exampleGloss}</Text> : null}
              </View>
            ) : null}
            {usage ? (
              <Text style={{ color: palette.inkSoft }}>
                {t(lang, "lesson.usage")}: {usage}
              </Text>
            ) : null}
            {literal ? (
              <Text style={{ color: palette.inkSoft }}>
                {t(lang, "lesson.literal")}: {literal}
              </Text>
            ) : null}
            {ref || citation ? (
              <Text style={{ color: palette.inkSoft }}>
                {t(lang, "lesson.source")}
                {ref ? `: ${ref}` : ""}
                {citation ? ` · ${citation}` : ""}
              </Text>
            ) : null}
            {v.review === "1" ? <Text style={{ color: palette.almost }}>{t(lang, "lesson.needsReview")}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function chip(palette: { line: string; paper: string }) {
  return {
    minHeight: 44,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  };
}

function pill(palette: { line: string }, filled: boolean) {
  return {
    minHeight: 44,
    justifyContent: "center" as const,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: filled ? 0 : 1,
    borderColor: palette.line,
  };
}

function gradeLabel(result: string, lang: UiLang) {
  if (result === "correct") return t(lang, "lesson.correct");
  if (result === "almost") return t(lang, "lesson.almost");
  return t(lang, "lesson.incorrect");
}

function shuffleStable(items: string[], seed: string): string[] {
  const out = [...items];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
    const j = h % (i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  if (out.length > 1 && out.every((item, i) => item === items[i])) {
    const first = out.shift();
    if (first) out.push(first);
  }
  return out;
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
  const palette = usePalette();
  const { lang } = useAuth();
  if (exercise.type === "mc" || exercise.type === "identify_root" || exercise.type === "identify_binyan" || exercise.type === "listen_mc") {
    return (
      <View style={{ gap: 8 }}>
        {(exercise.choices || []).map((c) => {
          const id = c.id;
          const text = c[lang] || c.en || c.ru || "";
          const selected = value === id;
          return (
            <Pressable
              key={id}
              testID={`choice-${id}`}
              accessibilityRole="button"
              accessibilityLabel={c.he || text || id}
              accessibilityState={{ selected }}
              onPress={() => setValue(id)}
              style={{
                minHeight: 44,
                justifyContent: "center",
                borderWidth: 1,
                borderColor: selected ? palette.indigo : palette.line,
                backgroundColor: selected ? palette.sand : palette.paper,
                borderRadius: 16,
                padding: 12,
              }}
            >
              {c.he ? <HebrewText pointed={c.pointed} showNiqqud={niqqud}>{c.he}</HebrewText> : <Text style={{ color: palette.ink }}>{text || id}</Text>}
            </Pressable>
          );
        })}
      </View>
    );
  }
  if (exercise.type === "match" || exercise.type === "match_tap") {
    return <MatchTap exercise={exercise} pairs={pairs} setPairs={setPairs} niqqud={niqqud} />;
  }
  if (exercise.type === "order_rtl" || exercise.type === "tiles") {
    return (
      <View {...({ dir: "rtl" } as object)} style={{ gap: 10 }}>
        <View style={{ minHeight: 48, flexDirection: "row", flexWrap: "wrap", gap: 8, borderWidth: 1, borderColor: palette.line, borderRadius: 16, padding: 8 }}>
          {order.map((tok, i) => (
            <Pressable
              key={`${tok}-${i}`}
              accessibilityRole="button"
              accessibilityLabel={tok}
              onPress={() => setOrder(order.filter((_, j) => j !== i))}
              style={{ minHeight: 44, justifyContent: "center", backgroundColor: palette.indigo, borderRadius: 12, paddingHorizontal: 10 }}
            >
              <Text style={{ color: palette.paper }} {...({ lang: "he" } as object)}>
                {tok}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(exercise.tokens || []).map((tok) => (
            <Pressable
              key={tok}
              testID={`token-${tok}`}
              accessibilityRole="button"
              accessibilityLabel={tok}
              onPress={() => setOrder([...order, tok])}
              style={{ minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: palette.line, borderRadius: 12, paddingHorizontal: 10 }}
            >
              <Text {...({ lang: "he" } as object)}>{tok}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }
  if (exercise.type === "trace") {
    return <TracePad exercise={exercise} value={value} setValue={setValue} />;
  }
  if (exercise.type === "speak") {
    return (
      <Text testID="speech-unavailable" style={{ backgroundColor: palette.sandDeep, borderRadius: 16, padding: 12 }}>
        {t(lang, "lesson.speechUnavailable")}
      </Text>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      <TextInput
        testID="hebrew-input"
        accessibilityLabel={loc(exercise.prompt, lang)}
        accessibilityLanguage="he"
        value={value}
        onChangeText={setValue}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          borderWidth: 2,
          borderColor: palette.line,
          backgroundColor: palette.sand,
          borderRadius: 16,
          padding: 12,
          fontSize: 28,
          lineHeight: 46,
          textAlign: "right",
          writingDirection: "rtl",
          color: palette.ink,
        }}
        {...({ lang: "he", dir: "rtl" } as object)}
      />
      <HebrewKeyboard value={value} onChange={setValue} niqqud={niqqud} />
    </View>
  );
}

function MatchTap({
  exercise,
  pairs,
  setPairs,
  niqqud,
}: {
  exercise: Exercise;
  pairs: Record<string, string>;
  setPairs: (v: Record<string, string>) => void;
  niqqud: boolean;
}) {
  const palette = usePalette();
  const { lang } = useAuth();
  const [picked, setPicked] = useState<string | null>(null);
  const left = exercise.left || [];
  const right = useMemo(() => shuffleStable(exercise.right || [], exercise.id), [exercise.id, exercise.right]);
  const used = new Set(Object.values(pairs));
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: palette.inkSoft }}>{t(lang, "lesson.matchHint")}</Text>
      <View style={{ gap: 8 }}>
        {left.map((item) => {
          const selected = picked === item;
          const paired = pairs[item];
          return (
            <Pressable
              key={item}
              testID={`match-${item}`}
              accessibilityRole="button"
              accessibilityLabel={paired ? `${item} ${paired}` : item}
              accessibilityState={{ selected }}
              onPress={() => {
                if (paired) {
                  const next = { ...pairs };
                  delete next[item];
                  setPairs(next);
                  setPicked(null);
                  return;
                }
                setPicked(item);
              }}
              style={{
                minHeight: 44,
                justifyContent: "center",
                borderWidth: 1,
                borderColor: selected ? palette.indigo : palette.line,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: selected ? palette.sand : palette.paper,
              }}
            >
              <HebrewText showNiqqud={niqqud}>{item}</HebrewText>
              {paired ? <Text style={{ color: palette.inkSoft }}>{paired}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {right.map((gloss, i) => {
          const taken = used.has(gloss);
          return (
            <Pressable
              key={`${gloss}-${i}`}
              accessibilityRole="button"
              accessibilityLabel={gloss}
              accessibilityState={{ disabled: !picked || taken }}
              disabled={!picked || taken}
              onPress={() => {
                if (!picked) return;
                const next = { ...pairs };
                next[picked] = gloss;
                setPairs(next);
                setPicked(null);
              }}
              style={{
                minHeight: 44,
                justifyContent: "center",
                opacity: taken ? 0.4 : 1,
                borderWidth: 1,
                borderColor: palette.line,
                borderRadius: 12,
                paddingHorizontal: 12,
                backgroundColor: palette.paper,
              }}
            >
              <Text style={{ color: palette.ink }}>{gloss}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Handwriting pad with on-device recognition (ported from main), keyboard as fallback. */
function TracePad({ exercise, value, setValue }: { exercise: Exercise; value: string; setValue: (v: string) => void }) {
  const palette = usePalette();
  const { lang } = useAuth();
  const [keyboard, setKeyboard] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [reset, setReset] = useState(0);
  const target = typeof (exercise as { glyph?: unknown }).glyph === "string" ? String((exercise as { glyph?: string }).glyph) : "";
  const glyph = target ? glyphForChar(target) : undefined;
  const onStrokes = (strokes: Stroke[]) => {
    if (!glyph) return;
    const r = recognise(strokes, glyph.id);
    if (r.verdict === "match") {
      setValue(glyph.char);
      setNote(t(lang, "lesson.writeMatch"));
    } else if (r.verdict === "mismatch" && r.best) {
      setValue(r.best.char);
      setNote(t(lang, "lesson.writeWrong", { char: r.best.char }));
    } else {
      setValue("");
      setNote(t(lang, "lesson.writeUnsure"));
    }
  };
  if (!glyph || keyboard) {
    return (
      <View style={{ backgroundColor: palette.sandDeep, borderRadius: 16, padding: 12, gap: 8 }}>
        <HebrewKeyboard value={value} onChange={setValue} />
      </View>
    );
  }
  return (
    <View testID="trace-pad" style={{ gap: 8 }}>
      <Text style={{ color: palette.inkSoft, textAlign: "center", fontSize: 48 }} {...({ lang: "he" } as object)}>
        {glyph.char}
      </Text>
      <HandwritingCanvas onChange={onStrokes} hint={t(lang, "lesson.writeHint")} resetKey={`${exercise.id}-${reset}`} />
      {note ? (
        <Text testID="trace-note" style={{ color: value === glyph.char ? palette.correct : palette.almost, textAlign: "center" }}>
          {note}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
        <Pressable
          testID="trace-clear"
          accessibilityRole="button"
          accessibilityLabel={t(lang, "lesson.clear")}
          onPress={() => {
            setReset((n) => n + 1);
            setValue("");
            setNote(null);
          }}
          style={chip(palette)}
        >
          <Text style={{ color: palette.ink }}>{t(lang, "lesson.clear")}</Text>
        </Pressable>
        <Pressable
          testID="trace-keyboard"
          accessibilityRole="button"
          accessibilityLabel={t(lang, "lesson.useKeyboard")}
          onPress={() => setKeyboard(true)}
          style={chip(palette)}
        >
          <Text style={{ color: palette.ink }}>{t(lang, "lesson.useKeyboard")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Feedback({
  grade,
  label,
  expected,
  lang,
  niqqud,
}: {
  grade: Grade;
  label: string;
  expected?: string | null;
  lang: UiLang;
  niqqud: boolean;
}) {
  const palette = usePalette();
  const kind = grade.result === "correct" ? "correct" : grade.result === "almost" ? "almost" : "incorrect";
  const icon = kind === "correct" ? "✓" : kind === "almost" ? "~" : "×";
  const tone = palette[kind === "correct" ? "correct" : kind === "almost" ? "almost" : "incorrect"];
  const bg = palette[kind === "correct" ? "correctBg" : kind === "almost" ? "almostBg" : "incorrectBg"];
  return (
    <View
      testID="feedback"
      accessibilityRole="text"
      style={{ borderWidth: 2, borderColor: tone, backgroundColor: bg, borderRadius: 16, padding: 12 }}
    >
      <Text testID="feedback-result" style={{ color: tone, fontWeight: "600" }}>
        {icon} {label}
      </Text>
      {grade.diff?.length
        ? grade.diff.map((d) => (
            <Text key={`${d.start}-${d.end}`} testID="diff-span" style={{ color: palette.ink }}>
              {d.got || "∅"} → {d.expected}
            </Text>
          ))
        : null}
      {kind !== "correct" && expected ? (
        <View testID="feedback-answer" style={{ marginTop: 8, backgroundColor: palette.paper, borderRadius: 12, padding: 10, alignItems: "center", gap: 2 }}>
          <Text style={{ color: palette.inkSoft, fontSize: 13 }}>{t(lang, "lesson.correctAnswer")}</Text>
          {/[\u0590-\u05FF]/.test(expected) ? (
            <HebrewText showNiqqud={niqqud}>{expected}</HebrewText>
          ) : (
            <Text style={{ color: palette.ink, fontSize: 18, fontWeight: "600" }}>{expected}</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
