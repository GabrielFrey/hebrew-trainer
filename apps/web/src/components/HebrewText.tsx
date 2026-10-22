export function HebrewText({
  children,
  pointed,
  showNiqqud = true,
  className = "",
  testId,
}: {
  children: string;
  pointed?: string | null;
  showNiqqud?: boolean;
  className?: string;
  testId?: string;
}) {
  const text = showNiqqud && pointed ? pointed : children;
  return (
    <span data-testid={testId} lang="he" dir="rtl" className={`he ${className}`}>
      <bdi>{text}</bdi>
    </span>
  );
}
