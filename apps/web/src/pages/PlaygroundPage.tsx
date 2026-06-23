import { Helmet } from "react-helmet-async";
import { Suspense, lazy, useState } from "react";
import { Link } from "react-router-dom";
import {
  useArchiveFormMutation,
  useCreateFormMutation,
  useDeleteFormMutation,
  useFormsQuery,
  usePublishFormVersionMutation,
  useRestoreFormMutation,
} from "@/api/queries";
import { FormRenderer } from "@/components/FormRenderer";
import { PlaygroundFormPanel } from "@/components/PlaygroundFormPanel";
import { PlaygroundSidebar, type PlaygroundMode } from "@/components/PlaygroundSidebar";
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
import { PublishError, formatPublishErrors } from "@/lib/publish-error";
import { userMessages } from "@/lib/user-messages";

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
  const [showArchived, setShowArchived] = useState(false);
  const {
    data: forms = [],
    isPending: formsPending,
    isError: formsError,
    refetch,
  } = useFormsQuery(showArchived);
  const createForm = useCreateFormMutation();
  const publishVersion = usePublishFormVersionMutation();
  const archiveForm = useArchiveFormMutation();
  const restoreForm = useRestoreFormMutation();
  const deleteForm = useDeleteFormMutation();

  const [mode, setMode] = useState<PlaygroundMode>("create");
  const [selectedFormId, setSelectedFormId] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode>("json");
  const [title, setTitle] = useState(initialTemplate.title);
  const [description, setDescription] = useState(initialTemplate.description);
  const [schemaText, setSchemaText] = useState(formatJson(initialTemplate.schema));
  const [uiSchemaText, setUiSchemaText] = useState(formatJson(initialTemplate.uiSchema));
  const [fields, setFields] = useState<PlaygroundFieldDraft[]>(
    initialDrafts.ok ? initialDrafts.drafts : [],
  );
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});
  const [publishMessage, setPublishMessage] = useState("");
  const [publishError, setPublishError] = useState("");
  const [uiModeError, setUiModeError] = useState("");
  const [manageError, setManageError] = useState("");
  const [manageMessage, setManageMessage] = useState("");

  const selectedForm = forms.find((form) => form.id === selectedFormId);
  const isDesigning = mode === "create" || mode === "edit";
  const publishTargetFormId = mode === "edit" ? selectedFormId : "";

  function clearManageFeedback() {
    setManageError("");
    setManageMessage("");
  }

  function selectNewForm() {
    setMode("create");
    setSelectedFormId("");
    clearManageFeedback();
    setPublishMessage("");
    setPublishError("");
  }

  function selectFormToView(formId: string) {
    setMode("view");
    setSelectedFormId(formId);
    clearManageFeedback();
    setPublishMessage("");
    setPublishError("");
  }

  function startDesignVersion() {
    if (!selectedForm) {
      return;
    }
    setMode("edit");
    setTitle(selectedForm.title);
    clearManageFeedback();
    setPublishMessage("");
    setPublishError("");
  }

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
    setMode("create");
    setSelectedFormId("");
    setTitle(template.title);
    setDescription(template.description);
    setSchemaText(formatJson(template.schema));
    setUiSchemaText(formatJson(template.uiSchema));
    setPreviewValues({});
    setPublishMessage("");
    setPublishError("");
    setUiModeError("");
    clearManageFeedback();

    const drafts = schemaToDrafts(template.schema as JsonSchema, template.uiSchema as UISchema);
    if (drafts.ok) {
      setFields(drafts.drafts);
    }
  }

  function switchEditorMode(nextMode: EditorMode) {
    if (nextMode === editorMode) {
      return;
    }

    if (nextMode === "json") {
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
    clearManageFeedback();

    if (selectedForm?.archived) {
      setPublishError("Restore this form before publishing a new version.");
      return;
    }

    const resolved = resolveConfig();
    if (!resolved.ok) {
      setPublishError("Fix JSON errors before publishing.");
      return;
    }

    const { schema, uiSchema } = resolved.config;

    try {
      if (publishTargetFormId) {
        const form = await publishVersion.mutateAsync({
          formId: publishTargetFormId,
          schema,
          uiSchema,
        });
        setSelectedFormId(form.id);
        setMode("view");
        setManageMessage(`Published version ${form.version}.`);
        return;
      }

      const form = await createForm.mutateAsync({
        title,
        description,
        schema,
        uiSchema,
      });
      setSelectedFormId(form.id);
      setMode("view");
      setManageMessage("Form published. Responses will appear below.");
    } catch (error) {
      if (error instanceof PublishError) {
        setPublishError(formatPublishErrors(error.errors));
        return;
      }
      setPublishError(userMessages.submit_failed);
    }
  }

  const schema = activeConfig ? (activeConfig.schema as JsonSchema) : null;
  const uiSchema = activeConfig ? (activeConfig.uiSchema as UISchema) : null;
  const publishLabel = publishTargetFormId ? "Publish new version" : "Publish form";
  const isPublishing = createForm.isPending || publishVersion.isPending;
  const isManaging = archiveForm.isPending || restoreForm.isPending || deleteForm.isPending;
  const publishDisabled = isPublishing || Boolean(selectedForm?.archived);

  async function handleArchive() {
    if (!selectedForm) {
      return;
    }
    clearManageFeedback();
    if (
      !window.confirm(
        `Archive "${selectedForm.title}"? It will be hidden from the form list and cannot receive new responses.`,
      )
    ) {
      return;
    }
    try {
      await archiveForm.mutateAsync(selectedForm.id);
      setManageMessage(`"${selectedForm.title}" archived.`);
    } catch {
      setManageError("Could not archive this form. Please try again.");
    }
  }

  async function handleRestore() {
    if (!selectedForm) {
      return;
    }
    clearManageFeedback();
    try {
      await restoreForm.mutateAsync(selectedForm.id);
      setManageMessage(`"${selectedForm.title}" restored.`);
    } catch {
      setManageError("Could not restore this form. Please try again.");
    }
  }

  async function handleDelete() {
    if (!selectedForm) {
      return;
    }
    clearManageFeedback();
    if (
      !window.confirm(
        `Permanently delete "${selectedForm.title}" and all its versions and responses? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await deleteForm.mutateAsync(selectedForm.id);
      setSelectedFormId("");
      setMode("create");
      setPublishMessage(`"${selectedForm.title}" deleted.`);
    } catch {
      setManageError("Could not delete this form. Please try again.");
    }
  }

  const designHeading =
    mode === "edit" && selectedForm ? `New version · ${selectedForm.title}` : "Design form";

  return (
    <>
      <Helmet>
        <title>Playground</title>
        <meta name="description" content="Design and publish forms without editing SQL." />
      </Helmet>
      <PageShell
        title="Playground"
        description="Design forms, publish versions, and review responses, all in one place."
        backTo={{ label: "← All forms", href: "/" }}
        layout="ide"
      >
        <div className="playground">
          <div className="playground-shell">
            <PlaygroundSidebar
              forms={forms}
              isPending={formsPending}
              isError={formsError}
              onRetry={() => refetch()}
              showArchived={showArchived}
              onShowArchivedChange={setShowArchived}
              mode={mode}
              selectedFormId={selectedFormId}
              onSelectNew={selectNewForm}
              onSelectForm={selectFormToView}
            />

            <div className="playground-main">
              {mode === "view" && selectedForm ? (
                <PlaygroundFormPanel
                  form={selectedForm}
                  onDesignVersion={startDesignVersion}
                  isManaging={isManaging}
                  manageError={manageError}
                  manageMessage={manageMessage}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                />
              ) : null}

              {isDesigning ? (
                <div className="playground-workspace">
                  <section
                    className={`playground-panel playground-editor playground-editor--${editorMode}`}
                    aria-label="Form definition"
                  >
                    <div className="playground-editor__chrome">
                      <div className="playground-design-header">
                        <div>
                          <h2 className="playground-design-heading">{designHeading}</h2>
                          {mode === "edit" && selectedForm ? (
                            <button
                              type="button"
                              className="text-link playground-design-back"
                              onClick={() => selectFormToView(selectedForm.id)}
                            >
                              ← Back to responses
                            </button>
                          ) : null}
                        </div>
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
                            <div
                              className="playground-mode-toggle"
                              role="group"
                              aria-label="Editor mode"
                            >
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
                      </div>
                    </div>

                    <div className="playground-editor__scroll">
                      <div className="playground-meta">
                        <label className="field">
                          <span className="field-label">Title</span>
                          <input
                            type="text"
                            value={title}
                            disabled={Boolean(publishTargetFormId)}
                            onChange={(event) => setTitle(event.target.value)}
                          />
                        </label>

                        <label className="field">
                          <span className="field-label">Description</span>
                          <input
                            type="text"
                            value={description}
                            disabled={Boolean(publishTargetFormId)}
                            onChange={(event) => setDescription(event.target.value)}
                          />
                        </label>
                      </div>

                      <div className="playground-editor-body">
                        {editorMode === "ui" ? (
                          <PlaygroundUiEditor
                            fields={fields}
                            onChange={handleFieldsChange}
                            onAddField={addField}
                          />
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
                        {publishError ? (
                          <ErrorState code="submit_failed" message={publishError} />
                        ) : null}
                        {publishMessage ? <SuccessState message={publishMessage} /> : null}
                      </div>
                    </div>

                    <div className="playground-publish-bar playground-publish-bar--inline">
                      <button
                        type="button"
                        className="button-primary"
                        disabled={publishDisabled}
                        onClick={handlePublish}
                      >
                        {isPublishing ? "Publishing…" : publishLabel}
                      </button>
                      {mode === "create" ? (
                        <Link className="text-link" to="/">
                          Back to forms
                        </Link>
                      ) : null}
                    </div>
                  </section>

                  <aside
                    className="playground-panel playground-preview fill-card"
                    aria-label="Live preview"
                  >
                    <div className="playground-preview-header">
                      <h2 className="playground-preview-title">Live preview</h2>
                      <p className="meta">Updates as you edit; publish to save.</p>
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
              ) : null}
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}
