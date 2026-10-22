export function BitiMascot({
  mood = "idle",
  size = 88,
}: {
  mood?: "idle" | "happy" | "think" | "sad";
  size?: number;
}) {
  const window = mood === "happy" ? "#F4D35E" : mood === "sad" ? "#C23B3B" : mood === "think" ? "#9AABD4" : "#F6E7C1";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Biti, a small house mascot"
    >
      <title>Biti</title>
      <path d="M16 54 L60 18 L104 54 V104 H16 Z" fill="#2C3D6B" />
      <path d="M28 52 L60 26 L92 52 V96 H28 Z" fill="#F6F1E8" />
      <rect x="46" y="58" width="28" height="28" rx="6" fill={window} />
      <circle cx="54" cy="70" r="3.2" fill="#1C1917" />
      <circle cx="66" cy="70" r="3.2" fill="#1C1917" />
      <path d="M54 80 Q60 84 66 80" fill="none" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M44 18 L52 14 L56 28 L48 32 Z" fill="#C23B3B" />
    </svg>
  );
}
