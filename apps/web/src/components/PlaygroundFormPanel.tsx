import { Link } from "react-router-dom";
import { useSubmissionsQuery } from "@/api/queries";
import { formatSubmissionFieldKey, SubmissionCard } from "@/components/SubmissionCard";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "@/components/StatusViews";
import type { FormSummary } from "@/generated/api-types";
import { apiErrorCodeFromUnknown } from "@/lib/api-error";

type Props = {
  form: FormSummary;
  onDesignVersion: () => void;
  isManaging: boolean;
  manageError: string;
  manageMessage: string;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
};

export function PlaygroundFormPanel({
  form,
  onDesignVersion,
  isManaging,
  manageError,
  manageMessage,
  onArchive,
  onRestore,
  onDelete,
}: Props) {
  const { data: view, isPending, isError, error, refetch } = useSubmissionsQuery(form.id);

  return (
    <section className="playground-panel playground-form-panel" aria-label={form.title}>
      <header className="playground-form-panel__header">
        <div className="playground-form-panel__intro">
          {form.archived ? <span className="form-card-badge">Archived</span> : null}
          <h2 className="playground-form-panel__title">{form.title}</h2>
          <p className="meta playground-form-panel__stats">
            Version {form.latestVersion} · {form.submissionCount} response
            {form.submissionCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="playground-form-panel__toolbar">
          {!form.archived ? (
            <>
              <Link className="button-primary" to={`/forms/${form.id}`}>
                Open form
              </Link>
              <button type="button" className="button-secondary" onClick={onDesignVersion}>
                Design new version
              </button>
            </>
          ) : (
            <button
              type="button"
              className="button-secondary"
              disabled={isManaging}
              onClick={onRestore}
            >
              Restore
            </button>
          )}
          <Link className="text-link" to={`/forms/${form.id}/integrity`}>
            Version history
          </Link>
          {!form.archived ? (
            <button
              type="button"
              className="button-secondary"
              disabled={isManaging}
              onClick={onArchive}
            >
              Archive
            </button>
          ) : null}
          <button
            type="button"
            className="button-secondary button-danger"
            disabled={isManaging}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
        {manageError ? <ErrorState message={manageError} /> : null}
        {manageMessage ? <SuccessState message={manageMessage} /> : null}
      </header>

      <div className="playground-form-panel__submissions">
        <h3 className="playground-form-panel__subheading">Responses</h3>
        {isPending ? <LoadingState message="Loading responses…" /> : null}
        {isError ? (
          <ErrorState code={apiErrorCodeFromUnknown(error)} onRetry={() => refetch()} />
        ) : null}
        {view && view.submissions.length === 0 ? (
          <EmptyState message="No responses yet. Open the form and submit answers to see them here." />
        ) : null}
        {view && view.submissions.length > 0 ? (
          <ul className="submission-list">
            {view.submissions.map((submission, index) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                index={index}
                formatFieldKey={formatSubmissionFieldKey}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
