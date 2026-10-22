export function isFilled(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function issuesForBilingual(
  item: { ru?: string; en?: string } | null | undefined,
  path: string
): string[] {
  const issues: string[] = [];
  if (!isFilled(item?.ru)) issues.push(`${path}.ru`);
  if (!isFilled(item?.en)) issues.push(`${path}.en`);
  return issues;
}

export function isEmptyExample(example: { ru?: string; en?: string; nikud?: string; hebrew?: string } | null | undefined): boolean {
  if (!example) return true;
  return ![example.ru, example.en, example.nikud, example.hebrew].some(isFilled);
}

export function issuesForWord(
  word: { id?: string; ru?: string; en?: string; example?: { ru?: string; en?: string; nikud?: string; hebrew?: string } },
  path: string
): string[] {
  const issues = issuesForBilingual(word, path);
  if (!isEmptyExample(word.example)) {
    issues.push(...issuesForBilingual(word.example, `${path}.example`));
  }
  return issues;
}

export function issuesForSlang(
  item: {
    ru?: string;
    en?: string;
    example?: { ru?: string; en?: string };
    usage?: { ru?: string; en?: string };
  },
  path: string
): string[] {
  return [...issuesForWord(item, path), ...issuesForBilingual(item.usage, `${path}.usage`)];
}
