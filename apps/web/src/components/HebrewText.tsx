export function HebrewText({
  children,
  pointed,
  showNiqqud = true,
  className = "",
}: {
  children: string;
  pointed?: string | null;
  showNiqqud?: boolean;
  className?: string;
}) {
  const text = showNiqqud && pointed ? pointed : children;
  return (
    <span lang="he" dir="rtl" className={`he ${className}`}>
      <bdi>{text}</bdi>
    </span>
  );
}
