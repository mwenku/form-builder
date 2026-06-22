import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { useIntegrityQuery } from "@/api/queries";
import { PageShell } from "@/components/PageShell";
import { ErrorState, LoadingState } from "@/components/StatusViews";
import { apiErrorCodeFromUnknown } from "@/lib/api-error";
import { formatAnswerValue, formatSubmittedAt, answersEntries } from "@/lib/format";
import { userMessagesStatic } from "@/lib/user-messages";

function formatFieldKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function IntegrityPage() {
  const { id = "" } = useParams();
  const { data: view, isPending, isError, error, refetch } = useIntegrityQuery(id);

  return (
    <>
      <Helmet>
        <title>{view ? `${view.title} — History` : "Form history"}</title>
        <meta name="description" content="View form versions and submitted responses." />
      </Helmet>
      <PageShell
        title="Form history"
        description={userMessagesStatic.integrityIntro}
        backTo={{ label: "← All forms", href: "/" }}
      >
        {view ? (
          <p className="page-subnav">
            <Link to={`/forms/${view.formId}`}>Open latest version</Link>
          </p>
        ) : null}
        {isPending ? <LoadingState message="Loading history…" /> : null}
        {isError ? (
          <ErrorState code={apiErrorCodeFromUnknown(error)} onRetry={() => refetch()} />
        ) : null}
        {view ? (
          <div className="integrity">
            <h2 className="integrity-title">{view.title}</h2>
            <section className="integrity-section" aria-label="Published versions">
              <h3>Published versions</h3>
              <ol className="version-list">
                {view.versions.map((version) => (
                  <li key={version.version}>
                    <span className="version-label">Version {version.version}</span>
                    <span className="meta">Published {formatSubmittedAt(version.createdAt)}</span>
                  </li>
                ))}
              </ol>
            </section>
            {view.byVersion.map((group) => (
              <section
                key={group.version}
                className="submission-group"
                aria-label={`Version ${group.version} responses`}
              >
                <h3>
                  Version {group.version}
                  <span className="meta">
                    {" "}
                    · {group.submissions.length} response{group.submissions.length === 1 ? "" : "s"}
                  </span>
                </h3>
                {group.submissions.length === 0 ? (
                  <p className="meta">No responses for this version yet.</p>
                ) : (
                  <ul className="submission-list">
                    {group.submissions.map((submission, index) => (
                      <li key={submission.id} className="submission-card">
                        <p className="submission-meta">
                          Response {index + 1} · {formatSubmittedAt(submission.createdAt)}
                        </p>
                        <dl className="answer-list">
                          {answersEntries(submission.answers).map(([key, value]) => (
                            <div key={key} className="answer-row">
                              <dt>{formatFieldKey(key)}</dt>
                              <dd>{formatAnswerValue(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        ) : null}
      </PageShell>
    </>
  );
}
