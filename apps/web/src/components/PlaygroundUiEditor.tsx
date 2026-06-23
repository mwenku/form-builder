import type { EnumOptionDraft, FieldWidget, PlaygroundFieldDraft } from "@/lib/playground-draft";

type Props = {
  fields: PlaygroundFieldDraft[];
  onChange: (fields: PlaygroundFieldDraft[]) => void;
};

const widgetOptions: { value: FieldWidget; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "textarea", label: "Long text" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes / no" },
  { value: "select", label: "Dropdown" },
];

function supportsPlaceholder(widget: FieldWidget): boolean {
  return widget !== "boolean" && widget !== "select";
}

export function PlaygroundUiEditor({ fields, onChange }: Props) {
  function updateField(index: number, patch: Partial<PlaygroundFieldDraft>) {
    const next = fields.map((field, fieldIndex) => {
      if (fieldIndex !== index) {
        return field;
      }
      const updated = { ...field, ...patch };
      if (patch.key !== undefined && patch.key !== field.key) {
        updated.id = patch.key;
      }
      if (patch.widget === "select" && !updated.enumOptions?.length) {
        updated.enumOptions = [
          { value: "option_a", label: "Option A" },
          { value: "option_b", label: "Option B" },
        ];
      }
      if (patch.widget !== undefined && !supportsPlaceholder(patch.widget)) {
        updated.placeholder = undefined;
      }
      return updated;
    });
    onChange(next);
  }

  function removeField(index: number) {
    onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
  }

  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) {
      return;
    }
    const next = [...fields];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  return (
    <div className="playground-ui-editor">
      {fields.length === 0 ? (
        <p className="meta">No fields yet. Use Add field above to get started.</p>
      ) : null}

      <ul className="playground-field-list">
        {fields.map((field, index) => (
          <li key={field.id} className="playground-field-card">
            <div className="playground-field-card__header">
              <div className="playground-field-card__title">
                <span className="playground-field-card__index">
                  {field.label || `Field ${index + 1}`}
                </span>
                <span className="meta playground-field-card__key">{field.key}</span>
              </div>
              <div className="playground-field-card__actions">
                <button
                  type="button"
                  className="button-secondary button-compact"
                  disabled={index === 0}
                  aria-label={`Move field ${index + 1} up`}
                  onClick={() => moveField(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="button-secondary button-compact"
                  disabled={index === fields.length - 1}
                  aria-label={`Move field ${index + 1} down`}
                  onClick={() => moveField(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="button-secondary button-compact"
                  aria-label={`Remove field ${index + 1}`}
                  onClick={() => removeField(index)}
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="playground-field-grid">
              <label className="field">
                <span className="field-label">Label</span>
                <input
                  type="text"
                  value={field.label}
                  onChange={(event) => updateField(index, { label: event.target.value })}
                />
              </label>

              <label className="field">
                <span className="field-label">Field key</span>
                <input
                  type="text"
                  value={field.key}
                  onChange={(event) => updateField(index, { key: event.target.value.trim() })}
                />
              </label>

              <label className="field">
                <span className="field-label">Type</span>
                <select
                  value={field.widget}
                  onChange={(event) =>
                    updateField(index, { widget: event.target.value as FieldWidget })
                  }
                >
                  {widgetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field checkbox-field">
                <label>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) => updateField(index, { required: event.target.checked })}
                  />
                  <span>Required</span>
                </label>
              </label>
            </div>

            {supportsPlaceholder(field.widget) ? (
              <label className="field">
                <span className="field-label">Placeholder</span>
                <input
                  type="text"
                  value={field.placeholder ?? ""}
                  onChange={(event) =>
                    updateField(index, { placeholder: event.target.value || undefined })
                  }
                />
              </label>
            ) : null}

            {field.widget === "text" || field.widget === "textarea" ? (
              <label className="field">
                <span className="field-label">Max length</span>
                <input
                  type="number"
                  min={1}
                  value={field.maxLength ?? ""}
                  onChange={(event) =>
                    updateField(index, {
                      maxLength: event.target.value === "" ? undefined : Number(event.target.value),
                    })
                  }
                />
              </label>
            ) : null}

            {field.widget === "select" ? (
              <EnumOptionsEditor
                options={field.enumOptions ?? []}
                onChange={(enumOptions) => updateField(index, { enumOptions })}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

type EnumProps = {
  options: EnumOptionDraft[];
  onChange: (options: EnumOptionDraft[]) => void;
};

function EnumOptionsEditor({ options, onChange }: EnumProps) {
  function updateOption(index: number, patch: Partial<EnumOptionDraft>) {
    onChange(
      options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    );
  }

  function addOption() {
    const nextIndex = options.length + 1;
    onChange([...options, { value: `option_${nextIndex}`, label: `Option ${nextIndex}` }]);
  }

  function removeOption(index: number) {
    onChange(options.filter((_, optionIndex) => optionIndex !== index));
  }

  return (
    <fieldset className="playground-enum-editor">
      <legend className="field-label">Dropdown options</legend>
      <ul className="playground-enum-list">
        {options.map((option, index) => (
          <li key={`${option.value}-${index}`} className="playground-enum-row">
            <input
              type="text"
              aria-label={`Option ${index + 1} value`}
              value={option.value}
              onChange={(event) => updateOption(index, { value: event.target.value.trim() })}
            />
            <input
              type="text"
              aria-label={`Option ${index + 1} label`}
              value={option.label}
              onChange={(event) => updateOption(index, { label: event.target.value })}
            />
            <button
              type="button"
              className="button-secondary button-compact"
              disabled={options.length <= 1}
              onClick={() => removeOption(index)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="button-secondary button-compact" onClick={addOption}>
        Add option
      </button>
    </fieldset>
  );
}
