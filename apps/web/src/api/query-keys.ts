export const queryKeys = {
  forms: ["forms"] as const,
  form: (id: string) => ["forms", id] as const,
  integrity: (id: string) => ["forms", id, "integrity"] as const,
};
