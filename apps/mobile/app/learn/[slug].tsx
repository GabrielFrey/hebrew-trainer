import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { BitiMascot } from "@/components/BitiMascot";
import { HebrewKeyboard } from "@/components/HebrewKeyboard";
import { HebrewText } from "@/components/HebrewText";
import { Shell } from "@/components/Shell";
import { api, type Exercise, type Lesson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loc, t, type UiLang } from "@/lib/i18n";
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

export default function LessonScreen() {
  return (
    <Shell>
      <Player />
    </Shell>
  );
}

function Player() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { lang } = useAuth();
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
      const res = await api<{ grade: Grade }>(`/attempts/${attempt}/submit`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setGrade(res.grade);
      setOffline(false);
    } catch (err) {
      await enqueueSubmit(attempt, payload);
      setOffline(true);
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
      <Text style={{ color: palette.incorrect }}>
        {t(lang, "lesson.error")} {error}
      </Text>
    );
  }
  if (!lesson) return <Text>{t(lang, "states.loading")}</Text>;
  if (gateOpen && (lesson.kind === "checkpoint" || lesson.kind === "boss" || lesson.kind === "legendary")) {
    return (
      <View testID="checkpoint-start" style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 20, gap: 8 }}>
        <Text style={{ fontSize: 40 }}>🏆</Text>
        <Text style={{ color: palette.inkSoft, textTransform: "uppercase" }}>
          {lesson.stage?.ulpan} · {lesson.cefr}
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
          onPress={beginGate}
          style={{ backgroundColor: palette.pomegranate, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18, alignSelf: "flex-start" }}
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

  return (
    <View testID="lesson-player" style={{ gap: 12 }}>
      <View style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 16, gap: 10 }}>
        <Text style={{ color: palette.inkSoft, fontSize: 13 }}>
          {lesson.level} · {lesson.cefr} · {idx + 1}/{exercises.length}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: "700", color: palette.ink }}>{loc(lesson.title, lang)}</Text>
        <Text style={{ color: palette.inkSoft }}>{loc(lesson.explanation, lang)}</Text>
        <View testID="bidi-mix" style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <HebrewText testID="niqqud-sample" pointed="שָׁלוֹם" showNiqqud={niqqud}>
            שלום
          </HebrewText>
          <Text style={{ color: palette.ink }}>Biti 42</Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Pressable testID="toggle-niqqud" onPress={() => setNiqqud((v) => !v)} style={chip(palette)}>
            <Text style={{ color: palette.ink }}>
              {t(lang, "lesson.niqqud")}: {niqqud ? t(lang, "lesson.niqqudOn") : t(lang, "lesson.niqqudOff")}
            </Text>
          </Pressable>
          <Pressable testID="toggle-translit" onPress={() => setTranslit((v) => !v)} style={chip(palette)}>
            <Text style={{ color: palette.ink }}>
              {t(lang, "lesson.translit")}: {translit ? t(lang, "lesson.niqqudOn") : t(lang, "lesson.niqqudOff")}
            </Text>
          </Pressable>
        </View>
        {lesson.audio.capability === "unavailable" ? (
          <Text testID="audio-unavailable" style={{ backgroundColor: palette.sandDeep, borderRadius: 16, padding: 10 }}>
            {t(lang, "lesson.audioUnavailable")}
          </Text>
        ) : null}
        {offline ? <Text style={{ color: palette.almost }}>{t(lang, "lesson.offline")}</Text> : null}
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
        {grade ? <Feedback grade={grade} label={gradeLabel(grade.result, lang)} /> : null}
        {explain ? <Text style={{ backgroundColor: palette.sandDeep, padding: 10, borderRadius: 16 }}>{explain}</Text> : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Pressable testID="check-answer" accessibilityRole="button" onPress={check} style={{ backgroundColor: palette.indigo, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 }}>
            <Text style={{ color: palette.paper }}>{t(lang, "lesson.check")}</Text>
          </Pressable>
          {grade ? (
            <Pressable testID="next-exercise" accessibilityRole="button" onPress={next} style={{ backgroundColor: palette.olive, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 }}>
              <Text style={{ color: palette.paper }}>{idx + 1 < exercises.length ? t(lang, "lesson.next") : t(lang, "lesson.finish")}</Text>
            </Pressable>
          ) : null}
          {grade && grade.result !== "correct" ? (
            <Pressable onPress={askExplain} style={{ borderWidth: 1, borderColor: palette.line, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 }}>
              <Text style={{ color: palette.ink }}>{t(lang, "lesson.explain")}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={{ backgroundColor: palette.paper, borderRadius: 24, padding: 16, gap: 8 }}>
        <BitiMascot lang={lang}
          mood={
            grade?.result === "correct" ? "happy" : grade?.result === "almost" ? "think" : grade ? "sad" : "idle"
          }
        />
        <Text style={{ fontWeight: "600", color: palette.ink }}>Vocabulary</Text>
        {lesson.vocabulary.map((v) => (
          <View key={String(v.lemma)} style={{ borderBottomWidth: 1, borderBottomColor: palette.line, paddingBottom: 8 }}>
            <HebrewText pointed={v.pointed} showNiqqud={niqqud}>
              {String(v.lemma)}
            </HebrewText>
            {translit ? <Text style={{ color: palette.inkSoft }}>{String(v.translit || "")}</Text> : null}
            <Text style={{ color: palette.ink }}>{String(v[lang] || v.en || v.ru || "")}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function chip(palette: { line: string; paper: string }) {
  return { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 };
}

function gradeLabel(result: string, lang: UiLang) {
  if (result === "correct") return t(lang, "lesson.correct");
  if (result === "almost") return t(lang, "lesson.almost");
  return t(lang, "lesson.incorrect");
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
  if (exercise.type === "mc" || exercise.type === "identify_root" || exercise.type === "identify_binyan" || exercise.type === "listen_mc") {
    return (
      <View style={{ gap: 8 }}>
        {(exercise.choices || []).map((c) => {
          const id = c.id;
          const label = c.he || c.en || c.ru || id;
          const selected = value === id;
          return (
            <Pressable
              key={id}
              testID={`choice-${id}`}
              accessibilityRole="button"
              onPress={() => setValue(id)}
              style={{
                borderWidth: 1,
                borderColor: selected ? palette.indigo : palette.line,
                backgroundColor: selected ? palette.sand : palette.paper,
                borderRadius: 16,
                padding: 12,
              }}
            >
              {c.he ? <HebrewText showNiqqud={niqqud}>{c.he}</HebrewText> : <Text style={{ color: palette.ink }}>{label}</Text>}
            </Pressable>
          );
        })}
      </View>
    );
  }
  if (exercise.type === "match" || exercise.type === "match_tap") {
    return (
      <View style={{ gap: 8 }}>
        {(exercise.left || []).map((item, i) => (
          <View key={item} style={{ gap: 4 }}>
            <HebrewText>{item}</HebrewText>
            <TextInput
              testID={`match-${item}`}
              accessibilityLabel={exercise.right?.[i] || item}
              value={pairs[item] || ""}
              onChangeText={(v) => setPairs({ ...pairs, [item]: v })}
              placeholder={exercise.right?.[i] || ""}
              style={{ borderWidth: 1, borderColor: palette.line, borderRadius: 12, padding: 10, color: palette.ink }}
            />
          </View>
        ))}
      </View>
    );
  }
  if (exercise.type === "order_rtl" || exercise.type === "tiles") {
    return (
      <View {...({ dir: "rtl" } as object)} style={{ gap: 10 }}>
        <View style={{ minHeight: 48, flexDirection: "row", flexWrap: "wrap", gap: 8, borderWidth: 1, borderColor: palette.line, borderRadius: 16, padding: 8 }}>
          {order.map((tok, i) => (
            <Pressable key={`${tok}-${i}`} onPress={() => setOrder(order.filter((_, j) => j !== i))} style={{ backgroundColor: palette.indigo, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: palette.paper }} {...({ lang: "he" } as object)}>
                {tok}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(exercise.tokens || []).map((tok) => (
            <Pressable key={tok} testID={`token-${tok}`} onPress={() => setOrder([...order, tok])} style={{ borderWidth: 1, borderColor: palette.line, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text {...({ lang: "he" } as object)}>{tok}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }
  if (exercise.type === "trace") {
    return (
      <View style={{ backgroundColor: palette.sandDeep, borderRadius: 16, padding: 12, gap: 8 }}>
        <Text>Tracing canvas fallback: type the letter. A dedicated cursive OFL font is not vendored yet.</Text>
        <HebrewKeyboard value={value} onChange={setValue} />
      </View>
    );
  }
  if (exercise.type === "speak") {
    return (
      <Text testID="speech-unavailable" style={{ backgroundColor: palette.sandDeep, borderRadius: 16, padding: 12 }}>
        Speaking is unavailable without a speech provider.
      </Text>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      <TextInput
        testID="hebrew-input"
        accessibilityLabel="Hebrew answer"
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

function Feedback({ grade, label }: { grade: Grade; label: string }) {
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
    </View>
  );
}
