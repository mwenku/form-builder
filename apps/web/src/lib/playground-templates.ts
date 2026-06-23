export type PlaygroundTemplate = {
  id: string;
  label: string;
  title: string;
  description: string;
  schema: object;
  uiSchema: object;
};

export const PLAYGROUND_TEMPLATES: PlaygroundTemplate[] = [
  {
    id: "contact",
    label: "Contact form",
    title: "My contact form",
    description: "Quick feedback form with email and phone.",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      required: ["name", "email", "phone"],
      additionalProperties: false,
      properties: {
        name: { type: "string", minLength: 1, maxLength: 120 },
        email: { type: "string", format: "email" },
        phone: { type: "string", pattern: "^\\+[1-9]\\d{6,14}$" },
        message: { type: "string", maxLength: 2000 },
      },
    },
    uiSchema: {
      order: ["name", "email", "phone", "message"],
      labels: {
        name: "Full name",
        email: "Email address",
        phone: "Phone number",
        message: "Message",
      },
      widgets: { phone: "phone", message: "textarea" },
      placeholders: {
        phone: "Enter your number without the leading zero",
        message: "How can we help?",
      },
    },
  },
  {
    id: "feedback",
    label: "Simple feedback",
    title: "Quick feedback",
    description: "One-question survey you can publish in seconds.",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      required: ["rating", "comments"],
      additionalProperties: false,
      properties: {
        rating: { type: "string", enum: ["great", "okay", "poor"] },
        comments: { type: "string", minLength: 1, maxLength: 500 },
      },
    },
    uiSchema: {
      order: ["rating", "comments"],
      labels: { rating: "Overall experience", comments: "Comments" },
      widgets: { comments: "textarea" },
      enumLabels: {
        rating: { great: "Great", okay: "Okay", poor: "Needs work" },
      },
    },
  },
];

export function formatJson(value: object): string {
  return JSON.stringify(value, null, 2);
}

export function parseJsonInput(
  text: string,
): { ok: true; value: object } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (trimmed === "") {
    return { ok: true, value: {} };
  }

  try {
    const value = JSON.parse(trimmed) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, error: "JSON must be an object." };
    }
    return { ok: true, value: value as object };
  } catch {
    return { ok: false, error: "Invalid JSON syntax." };
  }
}
