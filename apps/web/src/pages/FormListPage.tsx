import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useFormsQuery } from "@/api/queries";
import { PageShell } from "@/components/PageShell";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusViews";
import { apiErrorCodeFromUnknown } from "@/lib/api-error";
import { userMessagesStatic } from "@/lib/user-messages";

export function FormListPage() {
  const { data: forms = [], isPending, isError, error, refetch } = useFormsQuery();

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
            to design, publish, archive, or delete forms. Tr try the{" "}
            <a
              href="https://form-builder-app-lmqi0t-feee02-51-81-223-183.traefik.me/playground"
              rel="noreferrer"
              target="_blank"
            >
              live deployed demo
            </a>
            .
          </p>
        </div>
        {isPending ? <LoadingState message="Loading forms…" /> : null}
        {isError ? (
          <ErrorState code={apiErrorCodeFromUnknown(error)} onRetry={() => refetch()} />
        ) : null}
        {!isPending && !isError && forms.length === 0 ? (
          <EmptyState message={userMessagesStatic.emptyForms} />
        ) : null}
        {!isPending && !isError && forms.length > 0 ? (
          <ul className="form-list form-list--grid">
            {forms.map((form) => (
              <li key={form.id} className="form-card">
                <div className="form-card-body">
                  <Link className="form-card-title" to={`/forms/${form.id}`}>
                    {form.title}
                  </Link>
                  <p className="meta form-card-meta">
                    v{form.latestVersion} · {form.submissionCount} response
                    {form.submissionCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="form-card-actions">
                  <Link className="button-primary" to={`/forms/${form.id}`}>
                    Open form
                  </Link>
                  <Link className="text-link" to={`/forms/${form.id}/integrity`}>
                    Version history
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </PageShell>
    </>
  );
}
