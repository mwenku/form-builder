export function formatSubmittedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

export function answersEntries(answers: unknown): [string, unknown][] {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return [];
  }
  return Object.entries(answers as Record<string, unknown>);
}
