"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { l10nStatus, t, type UiLang } from "@biti/i18n";
import { BitiMascot } from "@/components/BitiMascot";
import { demoLogin } from "@/lib/api";

const LANGS: { code: UiLang; label: string; course: string }[] = [
  { code: "ru", label: "Русский", course: "he-ru" },
  { code: "en", label: "English", course: "he-en" },
  { code: "he", label: "עברית", course: "he-en" },
  { code: "uk", label: "Українська", course: "he-uk" },
  { code: "es", label: "Español", course: "he-es" },
  { code: "fr", label: "Français", course: "he-fr" },
];

const COURSE_IDS = ["he-ru", "he-uk", "he-en", "he-es", "he-fr"] as const;
const COURSE_KEYS = {
  "he-ru": "onboarding.courseHeRu",
  "he-uk": "onboarding.courseHeUk",
  "he-en": "onboarding.courseHeEn",
  "he-es": "onboarding.courseHeEs",
  "he-fr": "onboarding.courseHeFr",
} as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [lang, setLang] = useState<UiLang>("ru");
  const [course, setCourse] = useState("he-ru");
  const [motivation, setMotivation] = useState("aliyah");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function enter(to: string) {
    setBusy(true);
    setError(null);
    try {
      await demoLogin({
        ui_language: lang,
        display_name: name || t(lang, "onboarding.learner"),
        motivation,
        course_id: course,
      });
      router.push(to);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(lang, "onboarding.couldNotStart"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="onboarding" className="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-4 py-10">
      <BitiMascot mood="happy" size={96} lang={lang} />
      <h1 data-testid="onboarding-title" className="text-4xl font-semibold">
        {t(lang, "onboarding.title")}
      </h1>
      <p className="text-lg text-ink-soft">{t(lang, "brand.tagline")}</p>
      <fieldset className="space-y-2">
        <legend className="font-medium">{t(lang, "onboarding.language")}</legend>
        <div className="flex flex-wrap gap-2">
          {LANGS.map(({ code, label, course: cid }) => (
            <button
              key={code}
              type="button"
              data-testid={`lang-${code}`}
              onClick={() => {
                setLang(code);
                setCourse(cid);
              }}
              className={`rounded-full px-4 py-2 ${lang === code ? "bg-indigo text-paper" : "bg-paper border border-line"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="font-medium">{t(lang, "onboarding.course")}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {COURSE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              data-testid={`course-${id}`}
              onClick={() => setCourse(id)}
              className={`rounded-2xl border px-3 py-2 text-start ${course === id ? "border-indigo bg-paper" : "border-line bg-paper"}`}
            >
              {t(lang, COURSE_KEYS[id])}
            </button>
          ))}
        </div>
        <p className="text-sm text-ink-soft">
          {t(lang, "onboarding.reviewFlag")}{" "}
          {(["uk", "es", "fr"] as const).map((code) => `${code}: ${l10nStatus[code]}`).join(" · ")}
        </p>
      </fieldset>
      <label className="block space-y-1">
        <span>{t(lang, "onboarding.namePrompt")}</span>
        <input
          data-testid="onboarding-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-line bg-paper px-3 py-2"
        />
      </label>
      <fieldset className="space-y-2">
        <legend>{t(lang, "onboarding.motivation")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["aliyah", "work", "travel", "family"] as const).map((id) => (
            <button
              key={id}
              type="button"
              data-testid={`motivation-${id}`}
              onClick={() => setMotivation(id)}
              className={`rounded-2xl border px-3 py-2 text-start ${
                motivation === id ? "border-indigo bg-paper" : "border-line bg-paper"
              }`}
            >
              {t(lang, `onboarding.${id}`)}
            </button>
          ))}
        </div>
      </fieldset>
      {error ? <p className="text-incorrect">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          data-testid="start-alef"
          disabled={busy}
          onClick={() => enter("/learn")}
          className="rounded-full bg-pomegranate px-5 py-3 text-paper disabled:opacity-50"
        >
          {t(lang, "onboarding.skip")}
        </button>
        <button
          data-testid="start-placement"
          disabled={busy}
          onClick={() => enter("/placement")}
          className="rounded-full border border-line bg-paper px-5 py-3"
        >
          {t(lang, "onboarding.placement")}
        </button>
      </div>
      <p className="text-sm text-ink-soft">Demo sign-in is development-only. Production requires OIDC.</p>
    </div>
  );
}
