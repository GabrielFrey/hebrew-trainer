"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BitiMascot } from "@/components/BitiMascot";
import { demoLogin } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"ru" | "en">("ru");
  const [motivation, setMotivation] = useState("aliyah");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const copy =
    lang === "ru"
      ? {
          title: "Добро пожаловать в Biti Ivrit",
          tag: "Современный иврит — от первой буквы до живой израильской речи.",
          name: "Как вас зовут?",
          why: "Зачем вы учите иврит?",
          go: "Начать с алефа",
          place: "Короткий тест уровня",
        }
      : {
          title: "Welcome to Biti Ivrit",
          tag: "Modern Hebrew — from the first letter to everyday Israeli life.",
          name: "What should we call you?",
          why: "Why are you learning?",
          go: "Start from Alef",
          place: "Short placement",
        };

  async function enter(to: string) {
    setBusy(true);
    setError(null);
    try {
      await demoLogin({
        ui_language: lang,
        display_name: name || (lang === "ru" ? "Ученик" : "Learner"),
        motivation,
      });
      router.push(to);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-4 py-10">
      <BitiMascot mood="happy" size={96} />
      <h1 className="text-4xl font-semibold">{copy.title}</h1>
      <p className="text-lg text-ink-soft">{copy.tag}</p>
      <fieldset className="space-y-2">
        <legend className="font-medium">Interface</legend>
        <div className="flex gap-2">
          {(["ru", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={`rounded-full px-4 py-2 ${lang === code ? "bg-indigo text-paper" : "bg-paper border border-line"}`}
            >
              {code === "ru" ? "Русский" : "English"}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block space-y-1">
        <span>{copy.name}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-line bg-paper px-3 py-2"
        />
      </label>
      <fieldset className="space-y-2">
        <legend>{copy.why}</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["aliyah", lang === "ru" ? "Репатриация" : "Aliyah"],
            ["work", lang === "ru" ? "Работа" : "Work"],
            ["travel", lang === "ru" ? "Поездки" : "Travel"],
            ["family", lang === "ru" ? "Семья" : "Family"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMotivation(id)}
              className={`rounded-2xl border px-3 py-2 text-start ${
                motivation === id ? "border-indigo bg-paper" : "border-line bg-paper"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      {error ? <p className="text-incorrect">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          disabled={busy}
          onClick={() => enter("/learn")}
          className="rounded-full bg-pomegranate px-5 py-3 text-paper disabled:opacity-50"
        >
          {copy.go}
        </button>
        <button disabled={busy} onClick={() => enter("/placement")} className="rounded-full border border-line bg-paper px-5 py-3">
          {copy.place}
        </button>
      </div>
      <p className="text-sm text-ink-soft">Demo sign-in is development-only. Production requires OIDC.</p>
    </div>
  );
}
