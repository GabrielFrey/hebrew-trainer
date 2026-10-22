"use client";

import { useT } from "@/lib/i18n";

const ROWS = [
  ["ק", "ר", "א", "ט", "ו", "ן", "ם", "פ"],
  ["ש", "ד", "ג", "כ", "ע", "י", "ח", "ל", "ך", "ף"],
  ["ז", "ס", "ב", "ה", "נ", "מ", "צ", "ת", "ץ"],
];

const NIQQUD = [
  { mark: "\u05B0", name: "shva" },
  { mark: "\u05B8", name: "qamats" },
  { mark: "\u05B7", name: "patah" },
  { mark: "\u05B5", name: "tsere" },
  { mark: "\u05B6", name: "segol" },
  { mark: "\u05B4", name: "hiriq" },
  { mark: "\u05B9", name: "holam" },
  { mark: "\u05BB", name: "qubuts" },
  { mark: "\u05BC", name: "dagesh" },
];

export function HebrewKeyboard({
  value,
  onChange,
  niqqud = false,
  disabled = false,
}: {
  value: string;
  onChange: (next: string) => void;
  niqqud?: boolean;
  disabled?: boolean;
}) {
  const { t } = useT();
  return (
    <div data-testid="hebrew-keyboard" className="space-y-2" dir="rtl">
      <div data-testid="keyboard-preview" className="min-h-14 rounded-2xl border-2 border-line bg-paper px-4 py-2 he text-right">
        {value || "…"}
      </div>
      {ROWS.map((row) => (
        <div key={row.join("")} className="flex flex-wrap justify-center gap-1.5">
          {row.map((ch) => (
            <button
              key={ch}
              type="button"
              data-testid={`key-${ch}`}
              lang="he"
              disabled={disabled}
              aria-label={ch}
              onClick={() => onChange(value + ch)}
              className="min-h-11 min-w-11 rounded-xl border border-line bg-paper he text-[1.35rem] hover:bg-sand-deep disabled:opacity-40"
            >
              {ch}
            </button>
          ))}
        </div>
      ))}
      {niqqud ? (
        <div className="flex flex-wrap justify-center gap-1.5">
          {NIQQUD.map((n) => (
            <button
              key={n.name}
              type="button"
              data-testid={`key-niqqud-${n.name}`}
              lang="he"
              disabled={disabled}
              aria-label={n.name}
              onClick={() => onChange(value + n.mark)}
              className="rounded-xl border border-line bg-sand-deep px-2 py-1 text-sm"
            >
              א{n.mark}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          data-testid="key-space"
          className="flex-1 rounded-xl border border-line bg-paper py-2"
          onClick={() => onChange(value + " ")}
        >
          {t("keyboard.space")}
        </button>
        <button type="button" data-testid="key-backspace" className="rounded-xl border border-line bg-sand-deep px-4" aria-label={t("keyboard.backspace")} onClick={() => onChange(value.slice(0, -1))}>
          ⌫
        </button>
        <button type="button" data-testid="key-clear" className="rounded-xl border border-line bg-sand-deep px-4" onClick={() => onChange("")}>
          {t("keyboard.clear")}
        </button>
      </div>
    </div>
  );
}
