export function answersEntries(answers: unknown): [string, unknown][] {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return [];
  }
  return Object.entries(answers as Record<string, unknown>);
}
