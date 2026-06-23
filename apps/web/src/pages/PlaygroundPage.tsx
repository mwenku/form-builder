import { Helmet } from "react-helmet-async";
import { Suspense, lazy, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormsQuery, useCreateFormMutation, usePublishFormVersionMutation } from "@/api/queries";
import { FormRenderer } from "@/components/FormRenderer";
import { PlaygroundUiEditor } from "@/components/PlaygroundUiEditor";
import { PageShell } from "@/components/PageShell";
import { ErrorState, SuccessState } from "@/components/StatusViews";
import {
  createEmptyField,
  draftsToConfig,
  schemaToDrafts,
  type PlaygroundFieldDraft,
} from "@/lib/playground-draft";
import type { JsonSchema, UISchema } from "@/lib/schema";
import {
  PLAYGROUND_TEMPLATES,
  formatJson,
  parseJsonInput,
  type PlaygroundTemplate,
} from "@/lib/playground-templates";

const JsonMonacoEditor = lazy(() =>
  import("@/components/JsonMonacoEditor").then((module) => ({
    default: module.JsonMonacoEditor,
  })),
);

type EditorMode = "json" | "ui";

type FormConfigValues = {
  schema: object;
  uiSchema: object;
};

const initialTemplate = PLAYGROUND_TEMPLATES[0];
const initialDrafts = schemaToDrafts(
  initialTemplate.schema as JsonSchema,
  initialTemplate.uiSchema as UISchema,
);

function configFromFields(fields: PlaygroundFieldDraft[]): FormConfigValues {
  return draftsToConfig(fields);
}

function configFromJsonText(
  schemaText: string,
  uiSchemaText: string,
): { ok: true; config: FormConfigValues } | { ok: false; error: string } {
  const schemaParse = parseJsonInput(schemaText);
  if (!schemaParse.ok) {
    return { ok: false, error: `Schema: ${schemaParse.error}` };
  }

  const uiSchemaParse = parseJsonInput(uiSchemaText);
  if (!uiSchemaParse.ok) {
    return { ok: false, error: `UI schema: ${uiSchemaParse.error}` };
  }

  return {
    ok: true,
    config: { schema: schemaParse.value, uiSchema: uiSchemaParse.value },
  };
}

export function PlaygroundPage() {
  const navigate = useNavigate();
  const { data: forms = [] } = useFormsQuery();
  const createForm = useCreateFormMutation();
  const publishVersion = usePublishFormVersionMutation();

  const [editorMode, setEditorMode] = useState<EditorMode>("ui");
  const [title, setTitle] = useState(initialTemplate.title);
  const [description, setDescription] = useState(initialTemplate.description);
  const [schemaText, setSchemaText] = useState(formatJson(initialTemplate.schema));
  const [uiSchemaText, setUiSchemaText] = useState(formatJson(initialTemplate.uiSchema));
  const [fields, setFields] = useState<PlaygroundFieldDraft[]>(
    initialDrafts.ok ? initialDrafts.drafts : [],
  );
  const [existingFormId, setExistingFormId] = useState("");
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});
  const [publishMessage, setPublishMessage] = useState("");
  const [publishError, setPublishError] = useState("");
  const [uiModeError, setUiModeError] = useState("");

  function syncJsonFromFields(nextFields: PlaygroundFieldDraft[]) {
    const { schema, uiSchema } = draftsToConfig(nextFields);
    setSchemaText(formatJson(schema));
    setUiSchemaText(formatJson(uiSchema));
  }

  function handleFieldsChange(nextFields: PlaygroundFieldDraft[]) {
    setFields(nextFields);
    syncJsonFromFields(nextFields);
    setUiModeError("");
  }

  function addField() {
    handleFieldsChange([...fields, createEmptyField(fields.length + 1)]);
  }

  function loadTemplate(template: PlaygroundTemplate) {
    setTitle(template.title);
    setDescription(template.description);
    setSchemaText(formatJson(template.schema));
    setUiSchemaText(formatJson(template.uiSchema));
    setPreviewValues({});
    setPublishMessage("");
    setPublishError("");
    setUiModeError("");

    const drafts = schemaToDrafts(template.schema as JsonSchema, template.uiSchema as UISchema);
    if (drafts.ok) {
      setFields(drafts.drafts);
    }
  }

  function switchEditorMode(mode: EditorMode) {
    if (mode === editorMode) {
      return;
    }

    if (mode === "json") {
      syncJsonFromFields(fields);
      setUiModeError("");
      setEditorMode("json");
      return;
    }

    const parsed = configFromJsonText(schemaText, uiSchemaText);
    if (!parsed.ok) {
      if (fields.length > 0) {
        syncJsonFromFields(fields);
        setUiModeError("");
        setEditorMode("ui");
        return;
      }
      setUiModeError(parsed.error);
      return;
    }

    const drafts = schemaToDrafts(
      parsed.config.schema as JsonSchema,
      parsed.config.uiSchema as UISchema,
    );
    if (!drafts.ok) {
      if (fields.length > 0) {
        syncJsonFromFields(fields);
        setUiModeError("");
        setEditorMode("ui");
        return;
      }
      setUiModeError(drafts.reason);
      return;
    }

    setFields(drafts.drafts);
    setUiModeError("");
    setEditorMode("ui");
  }

  function resolveConfig(): { ok: true; config: FormConfigValues } | { ok: false; error: string } {
    if (editorMode === "ui") {
      return { ok: true, config: configFromFields(fields) };
    }
    return configFromJsonText(schemaText, uiSchemaText);
  }

  const resolvedConfig = resolveConfig();
  const activeConfig = resolvedConfig.ok ? resolvedConfig.config : null;
  const parseError = editorMode === "json" && !resolvedConfig.ok ? resolvedConfig.error : "";

  async function handlePublish() {
    setPublishMessage("");
    setPublishError("");

    const resolved = resolveConfig();
    if (!resolved.ok) {
      setPublishError("Fix JSON errors before publishing.");
      return;
    }

    const { schema, uiSchema } = resolved.config;

    try {
      if (existingFormId) {
        const form = await publishVersion.mutateAsync({
          formId: existingFormId,
          schema,
          uiSchema,
        });
        setPublishMessage(`Published version ${form.version}. Open the form to try it.`);
        navigate(`/forms/${form.id}`);
        return;
      }

      const form = await createForm.mutateAsync({
        title,
        description,
        schema,
        uiSchema,
      });
      setPublishMessage("Form published. Opening fill view…");
      navigate(`/forms/${form.id}`);
    } catch {
      setPublishError("Could not publish. Check your JSON schema and try again.");
    }
  }

  const schema = activeConfig ? (activeConfig.schema as JsonSchema) : null;
  const uiSchema = activeConfig ? (activeConfig.uiSchema as UISchema) : null;
  const publishLabel = existingFormId ? "Publish new version" : "Publish new form";
  const isPublishing = createForm.isPending || publishVersion.isPending;

  return (
    <>
      <Helmet>
        <title>Playground</title>
        <meta name="description" content="Design and publish forms without editing SQL." />
      </Helmet>
      <PageShell
        title="Playground"
        description="Load a template, edit fields in the UI or JSON, preview live, then publish — no SQL or migrations needed."
        backTo={{ label: "← All forms", href: "/" }}
        layout="wide"
      >
        <div className="reviewer-steps">
          <p>
            <strong>Try it:</strong> load a template → edit in <strong>UI</strong> or{" "}
            <strong>JSON</strong> → preview → publish → submit answers → check <em>View history</em>{" "}
            on the form list.
          </p>
        </div>

        <div className="playground">
          <div className="playground-workspace">
            <section className="playground-panel playground-editor" aria-label="Form definition">
              <div className="playground-sticky-top">
                <div className="playground-controls">
                  <div className="playground-controls__row">
                    <div className="playground-toolbar" role="group" aria-label="Templates">
                      {PLAYGROUND_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          className="button-secondary"
                          onClick={() => loadTemplate(template)}
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>
                    <div className="playground-mode-toggle" role="group" aria-label="Editor mode">
                      <button
                        type="button"
                        className={
                          editorMode === "ui"
                            ? "playground-mode-toggle__option is-active"
                            : "playground-mode-toggle__option"
                        }
                        aria-pressed={editorMode === "ui"}
                        onClick={() => switchEditorMode("ui")}
                      >
                        UI
                      </button>
                      <button
                        type="button"
                        className={
                          editorMode === "json"
                            ? "playground-mode-toggle__option is-active"
                            : "playground-mode-toggle__option"
                        }
                        aria-pressed={editorMode === "json"}
                        onClick={() => switchEditorMode("json")}
                      >
                        JSON
                      </button>
                    </div>
                  </div>
                </div>

                {editorMode === "ui" ? (
                  <div className="playground-ui-sticky">
                    <button type="button" className="button-primary" onClick={addField}>
                      Add field
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="playground-meta">
                <label className="field">
                  <span className="field-label">Title</span>
                  <input
                    type="text"
                    value={title}
                    disabled={Boolean(existingFormId)}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>

                <label className="field">
                  <span className="field-label">Description</span>
                  <input
                    type="text"
                    value={description}
                    disabled={Boolean(existingFormId)}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>

                <label className="field playground-meta__span">
                  <span className="field-label">Publish as new version of</span>
                  <select
                    value={existingFormId}
                    onChange={(event) => setExistingFormId(event.target.value)}
                  >
                    <option value="">New form</option>
                    {forms.map((form) => (
                      <option key={form.id} value={form.id}>
                        {form.title} (v{form.latestVersion})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="playground-editor-body">
                {editorMode === "ui" ? (
                  <PlaygroundUiEditor fields={fields} onChange={handleFieldsChange} />
                ) : (
                  <Suspense fallback={<p className="meta">Loading JSON editor…</p>}>
                    <div className="playground-json-grid">
                      <JsonMonacoEditor
                        id="playground-schema"
                        label="schema (JSON)"
                        value={schemaText}
                        onChange={setSchemaText}
                      />
                      <JsonMonacoEditor
                        id="playground-ui-schema"
                        label="ui_schema (JSON)"
                        value={uiSchemaText}
                        onChange={setUiSchemaText}
                      />
                    </div>
                  </Suspense>
                )}
              </div>

              <div className="playground-feedback">
                {uiModeError ? <ErrorState message={uiModeError} /> : null}
                {parseError ? <ErrorState message={parseError} /> : null}
                {publishError ? <ErrorState code="submit_failed" message={publishError} /> : null}
                {publishMessage ? <SuccessState message={publishMessage} /> : null}
              </div>

              <div className="playground-publish-bar playground-publish-bar--inline">
                <button
                  type="button"
                  className="button-primary"
                  disabled={isPublishing}
                  onClick={handlePublish}
                >
                  {isPublishing ? "Publishing…" : publishLabel}
                </button>
                <Link className="text-link" to="/">
                  Back to forms
                </Link>
              </div>
            </section>

            <aside
              className="playground-panel playground-preview fill-card"
              aria-label="Live preview"
            >
              <div className="playground-preview-header">
                <h2 className="playground-preview-title">Live preview</h2>
                <p className="meta">Updates as you edit — publish to save.</p>
              </div>
              <div className="playground-preview-body">
                {schema && uiSchema ? (
                  <FormRenderer
                    schema={schema}
                    uiSchema={uiSchema}
                    values={previewValues}
                    errors={{}}
                    onChange={(field, value) =>
                      setPreviewValues((previous) => ({ ...previous, [field]: value }))
                    }
                  />
                ) : (
                  <p className="meta">Fix the form definition to see the preview.</p>
                )}
              </div>
            </aside>
          </div>

          <div className="playground-publish-bar playground-publish-bar--sticky">
            <button
              type="button"
              className="button-primary playground-publish-bar__button"
              disabled={isPublishing}
              onClick={handlePublish}
            >
              {isPublishing ? "Publishing…" : publishLabel}
            </button>
          </div>
        </div>
      </PageShell>
    </>
  );
}
