export type BitiMood = "idle" | "happy" | "think" | "sad" | "streak";

const LABELS: Record<BitiMood, string> = {
  idle: "Biti, a small robot mascot, waiting",
  happy: "Biti celebrating a correct answer",
  think: "Biti thinking about an almost-correct answer",
  sad: "Biti encouraging you after a mistake",
  streak: "Biti celebrating a streak",
};

export function BitiMascot({
  mood = "idle",
  size = 88,
}: {
  mood?: BitiMood;
  size?: number;
}) {
  const smile =
    mood === "happy" || mood === "streak"
      ? "M46 78 Q60 92 74 78"
      : mood === "sad"
        ? "M48 86 Q60 76 72 86"
        : mood === "think"
          ? "M50 82 Q64 86 74 80"
          : "M48 80 Q60 88 72 80";
  const pupilY = mood === "think" ? 56 : 58;
  const antennaEnd = mood === "sad" ? { x: 48, y: 10 } : { x: 60, y: 8 };
  const ball = mood === "sad" ? { cx: 46, cy: 8 } : { cx: 60, cy: 6 };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={LABELS[mood]}
    >
      <title>Biti</title>
      <circle cx="32" cy="52" r="10" fill="#1B3A5F" />
      <circle cx="88" cy="52" r="10" fill="#1B3A5F" />
      <ellipse cx="60" cy="92" rx="28" ry="20" fill="#F6F0E4" />
      <path d="M34 86 Q28 100 38 108" fill="#1B3A5F" />
      <path d="M86 86 Q92 100 82 108" fill="#1B3A5F" />
      <circle cx="60" cy="52" r="34" fill="#F6F0E4" />
      <line x1="60" y1="22" x2={antennaEnd.x} y2={antennaEnd.y} stroke="#1B3A5F" strokeWidth="4" strokeLinecap="round" />
      <circle cx={ball.cx} cy={ball.cy} r="6" fill={mood === "streak" ? "#FCD34D" : "#B45309"} />
      {mood === "streak" ? (
        <>
          <path d="M18 28 L22 36 L30 32 L22 40 L18 48 L14 40 L6 32 L14 36 Z" fill="#FCD34D" />
          <path d="M96 22 L99 28 L106 26 L100 32 L98 40 L94 32 L88 26 L94 28 Z" fill="#FCD34D" />
        </>
      ) : null}
      <circle cx="46" cy="56" r="11" fill="#FFFFFF" />
      <circle cx="74" cy="56" r="11" fill="#FFFFFF" />
      <circle cx="48" cy={pupilY} r="5.5" fill="#142033" />
      <circle cx="76" cy={pupilY} r="5.5" fill="#142033" />
      <circle cx="50" cy={pupilY - 2} r="1.6" fill="#FFFFFF" />
      <circle cx="78" cy={pupilY - 2} r="1.6" fill="#FFFFFF" />
      <path d={smile} fill="none" stroke="#142033" strokeWidth="3.2" strokeLinecap="round" />
      {mood === "happy" ? (
        <path d="M86 44 L90 36 L94 44" fill="none" stroke="#0C5F58" strokeWidth="3" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}
