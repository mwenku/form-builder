import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { FormRenderer } from "@/components/FormRenderer";
import { PageShell } from "@/components/PageShell";
import { ErrorState, LoadingState, SuccessState } from "@/components/StatusViews";
import { useFormFill } from "@/hooks/use-form-fill";
import { apiErrorCodeFromUnknown } from "@/lib/api-error";
import type { JsonSchema, UISchema } from "@/lib/schema";
import { userMessagesStatic } from "@/lib/user-messages";

export function FormFillPage() {
  const { id = "" } = useParams();
  const { ui, formQuery, submitMutation, setFieldValue, handleSubmit, retryLoad } = useFormFill(id);
  const { data: form, isPending, isError, error } = formQuery;

  if (isPending) {
    return <LoadingState message="Loading form…" />;
  }

  if (isError) {
    return (
      <PageShell title="Form unavailable" backTo={{ label: "← All forms", href: "/" }}>
        <ErrorState code={apiErrorCodeFromUnknown(error)} onRetry={() => retryLoad()} />
      </PageShell>
    );
  }

  if (!form) {
    return (
      <PageShell title="Form unavailable" backTo={{ label: "← All forms", href: "/" }}>
        <ErrorState code="not_found" onRetry={() => retryLoad()} />
      </PageShell>
    );
  }

  const schema = form.schema as JsonSchema;
  const uiSchema = form.uiSchema as UISchema;

  return (
    <>
      <Helmet>
        <title>{form.title}</title>
        <meta name="description" content={form.description} />
        <meta property="og:title" content={form.title} />
        <meta property="og:description" content={form.description} />
      </Helmet>
      <PageShell
        title={form.title}
        description={form.description}
        backTo={{ label: "← All forms", href: "/" }}
      >
        <div className="fill-card">
          {ui.submitted ? <SuccessState message={userMessagesStatic.submitSuccess} /> : null}
          <form onSubmit={(event) => handleSubmit(event, form)} className="fill-form" noValidate>
            <FormRenderer
              schema={schema}
              uiSchema={uiSchema}
              values={ui.values}
              errors={ui.fieldErrors}
              onChange={setFieldValue}
            />
            {ui.fieldErrors._form ? <ErrorState message={ui.fieldErrors._form} /> : null}
            {ui.submitErrorCode ? <ErrorState code={ui.submitErrorCode} /> : null}
            <div className="form-actions">
              <button type="submit" className="button-primary" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </PageShell>
    </>
  );
}
