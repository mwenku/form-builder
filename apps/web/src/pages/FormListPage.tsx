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
      <PageShell title="Forms" description={userMessagesStatic.formListIntro}>
        {isPending ? <LoadingState message="Loading forms…" /> : null}
        {isError ? (
          <ErrorState code={apiErrorCodeFromUnknown(error)} onRetry={() => refetch()} />
        ) : null}
        {!isPending && !isError && forms.length === 0 ? (
          <EmptyState message={userMessagesStatic.emptyForms} />
        ) : null}
        {!isPending && !isError && forms.length > 0 ? (
          <ul className="form-list">
            {forms.map((form) => (
              <li key={form.id} className="form-card">
                <div className="form-card-body">
                  <Link className="form-card-title" to={`/forms/${form.id}`}>
                    {form.title}
                  </Link>
                </div>
                <div className="form-card-actions">
                  <Link className="button-primary" to={`/forms/${form.id}`}>
                    Open form
                  </Link>
                  <Link className="text-link" to={`/forms/${form.id}/integrity`}>
                    View history
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
