import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useArchiveFormMutation,
  useDeleteFormMutation,
  useFormsQuery,
  useRestoreFormMutation,
} from "@/api/queries";
import { PageShell } from "@/components/PageShell";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusViews";
import { apiErrorCodeFromUnknown } from "@/lib/api-error";
import { userMessagesStatic } from "@/lib/user-messages";

export function FormListPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: forms = [], isPending, isError, error, refetch } = useFormsQuery(showArchived);
  const archiveForm = useArchiveFormMutation();
  const restoreForm = useRestoreFormMutation();
  const deleteForm = useDeleteFormMutation();
  const [actionError, setActionError] = useState("");

  async function handleArchive(formId: string, title: string) {
    setActionError("");
    if (
      !window.confirm(
        `Archive "${title}"? It will be hidden from the form list and cannot receive new responses.`,
      )
    ) {
      return;
    }
    try {
      await archiveForm.mutateAsync(formId);
    } catch {
      setActionError("Could not archive this form. Please try again.");
    }
  }

  async function handleRestore(formId: string) {
    setActionError("");
    try {
      await restoreForm.mutateAsync(formId);
    } catch {
      setActionError("Could not restore this form. Please try again.");
    }
  }

  async function handleDelete(formId: string, title: string) {
    setActionError("");
    if (
      !window.confirm(
        `Permanently delete "${title}" and all its versions and responses? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await deleteForm.mutateAsync(formId);
    } catch {
      setActionError("Could not delete this form. Please try again.");
    }
  }

  const isManaging = archiveForm.isPending || restoreForm.isPending || deleteForm.isPending;

  return (
    <>
      <Helmet>
        <title>Forms</title>
        <meta name="description" content="Browse and complete available forms." />
        <meta property="og:title" content="Forms" />
        <meta property="og:description" content="Browse and complete available forms." />
      </Helmet>
      <PageShell title="Forms" description={userMessagesStatic.formListIntro} layout="wide">
        <div className="reviewer-banner" role="note">
          <p>
            <strong>Reviewer quick start:</strong> open the <Link to="/playground">Playground</Link>{" "}
            to design and publish a form from JSON — no SQL needed. Or try the{" "}
            <a
              href="https://form-builder-app-lmqi0t-feee02-51-81-223-183.traefik.me/playground"
              rel="noreferrer"
              target="_blank"
            >
              live demo
            </a>
            .
          </p>
        </div>

        <div className="form-list-toolbar">
          <label className="form-list-toggle checkbox-field">
            <label>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
              />
              <span>Show archived</span>
            </label>
          </label>
        </div>

        {actionError ? <ErrorState message={actionError} /> : null}
        {isPending ? <LoadingState message="Loading forms…" /> : null}
        {isError ? (
          <ErrorState code={apiErrorCodeFromUnknown(error)} onRetry={() => refetch()} />
        ) : null}
        {!isPending && !isError && forms.length === 0 ? (
          <EmptyState
            message={showArchived ? "No archived forms." : userMessagesStatic.emptyForms}
          />
        ) : null}
        {!isPending && !isError && forms.length > 0 ? (
          <ul className="form-list form-list--grid">
            {forms.map((form) => (
              <li
                key={form.id}
                className={form.archived ? "form-card form-card--archived" : "form-card"}
              >
                <div className="form-card-body">
                  {form.archived ? <span className="form-card-badge">Archived</span> : null}
                  <Link className="form-card-title" to={`/forms/${form.id}`}>
                    {form.title}
                  </Link>
                  <p className="meta form-card-meta">
                    v{form.latestVersion} · {form.submissionCount} response
                    {form.submissionCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="form-card-actions">
                  {!form.archived ? (
                    <Link className="button-primary" to={`/forms/${form.id}`}>
                      Open form
                    </Link>
                  ) : null}
                  <Link className="text-link" to={`/forms/${form.id}/submissions`}>
                    View submissions
                  </Link>
                  <Link className="text-link" to={`/forms/${form.id}/integrity`}>
                    Version history
                  </Link>
                  {form.archived ? (
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={isManaging}
                      onClick={() => handleRestore(form.id)}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={isManaging}
                      onClick={() => handleArchive(form.id, form.title)}
                    >
                      Archive
                    </button>
                  )}
                  <button
                    type="button"
                    className="button-secondary button-danger"
                    disabled={isManaging}
                    onClick={() => handleDelete(form.id, form.title)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </PageShell>
    </>
  );
}
