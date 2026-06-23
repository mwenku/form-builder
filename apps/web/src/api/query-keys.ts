export const queryKeys = {
  forms: (includeArchived: boolean) => ["forms", { includeArchived }] as const,
  form: (id: string) => ["forms", id] as const,
  integrity: (id: string) => ["forms", id, "integrity"] as const,
  submissions: (id: string) => ["forms", id, "submissions"] as const,
};
