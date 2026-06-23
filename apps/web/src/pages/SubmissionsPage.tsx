import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { useSubmissionsQuery } from "@/api/queries";
import { PageShell } from "@/components/PageShell";
import { formatSubmissionFieldKey, SubmissionCard } from "@/components/SubmissionCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusViews";
import { apiErrorCodeFromUnknown } from "@/lib/api-error";

export function SubmissionsPage() {
  const { id = "" } = useParams();
  const { data: view, isPending, isError, error, refetch } = useSubmissionsQuery(id);

  return (
    <>
      <Helmet>
        <title>{view ? `${view.title} — Submissions` : "Submissions"}</title>
        <meta name="description" content="View all responses submitted for this form." />
      </Helmet>
      <PageShell
        title="Submissions"
        description="All responses submitted for this form, newest first."
        backTo={{ label: "← All forms", href: "/" }}
        layout="wide"
      >
        {view ? (
          <p className="page-subnav">
            <Link to={`/forms/${view.formId}`}>Open form</Link>
            {" · "}
            <Link to={`/forms/${view.formId}/integrity`}>Version history</Link>
          </p>
        ) : null}
        {isPending ? <LoadingState message="Loading submissions…" /> : null}
        {isError ? (
          <ErrorState code={apiErrorCodeFromUnknown(error)} onRetry={() => refetch()} />
        ) : null}
        {view ? (
          <div className="submissions-page">
            <h2 className="integrity-title">{view.title}</h2>
            <p className="meta">
              {view.submissions.length} response{view.submissions.length === 1 ? "" : "s"}
            </p>
            {view.submissions.length === 0 ? (
              <EmptyState message="No responses yet. Share the form link to collect answers." />
            ) : (
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
            )}
          </div>
        ) : null}
      </PageShell>
    </>
  );
}
