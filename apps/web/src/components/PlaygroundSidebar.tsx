import type { FormSummary } from "@/generated/api-types";
import { FormShareLink } from "@/components/FormShareLink";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusViews";

export type PlaygroundMode = "create" | "view" | "edit";

type Props = {
  forms: FormSummary[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
  mode: PlaygroundMode;
  selectedFormId: string;
  onSelectNew: () => void;
  onSelectForm: (formId: string) => void;
};

function formMeta(form: FormSummary): string {
  const responses = form.submissionCount === 1 ? "1 response" : `${form.submissionCount} responses`;
  return `v${form.latestVersion} · ${responses}`;
}

function SidebarItem({
  selected,
  onClick,
  title,
  meta,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  meta?: string;
  badge?: string;
}) {
  return (
    <li>
      <button
        type="button"
        className={selected ? "playground-sidebar-item is-selected" : "playground-sidebar-item"}
        aria-current={selected ? "true" : undefined}
        onClick={onClick}
      >
        <span className="playground-sidebar-item__title">{title}</span>
        {meta ? <span className="playground-sidebar-item__meta">{meta}</span> : null}
        {badge ? (
          <span className="form-card-badge playground-sidebar-item__badge">{badge}</span>
        ) : null}
      </button>
    </li>
  );
}

export function PlaygroundSidebar({
  forms,
  isPending,
  isError,
  onRetry,
  showArchived,
  onShowArchivedChange,
  mode,
  selectedFormId,
  onSelectNew,
  onSelectForm,
}: Props) {
  const activeForms = forms.filter((form) => !form.archived);
  const archivedForms = forms.filter((form) => form.archived);
  const newFormSelected = mode === "create";
  const selectedForm = forms.find((form) => form.id === selectedFormId);

  return (
    <nav className="playground-sidebar" aria-label="Your forms">
      <div className="playground-sidebar__header">
        <h2 className="playground-sidebar__heading">Your forms</h2>
        <label className="form-list-toggle checkbox-field">
          <label>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => onShowArchivedChange(event.target.checked)}
            />
            <span>Archived</span>
          </label>
        </label>
      </div>

      {isPending ? <LoadingState message="Loading forms…" /> : null}
      {isError ? <ErrorState onRetry={onRetry} /> : null}

      {!isPending && !isError ? (
        <>
          <button
            type="button"
            className={
              newFormSelected ? "playground-sidebar-new is-selected" : "playground-sidebar-new"
            }
            aria-current={newFormSelected ? "true" : undefined}
            onClick={onSelectNew}
          >
            <span className="playground-sidebar-new__icon" aria-hidden="true">
              +
            </span>
            <span className="playground-sidebar-new__text">
              <span className="playground-sidebar-new__title">New form</span>
              <span className="playground-sidebar-new__meta">Design and publish</span>
            </span>
          </button>

          {activeForms.length > 0 || (showArchived && archivedForms.length > 0) ? (
            <div className="playground-sidebar__scroll">
              <p className="playground-sidebar__section-label">Published forms</p>
              <ul className="playground-sidebar__list">
                {activeForms.map((form) => (
                  <SidebarItem
                    key={form.id}
                    selected={selectedFormId === form.id}
                    onClick={() => onSelectForm(form.id)}
                    title={form.title}
                    meta={formMeta(form)}
                  />
                ))}
                {showArchived && archivedForms.length > 0 ? (
                  <>
                    <li className="playground-sidebar__divider" aria-hidden="true" />
                    {archivedForms.map((form) => (
                      <SidebarItem
                        key={form.id}
                        selected={selectedFormId === form.id}
                        onClick={() => onSelectForm(form.id)}
                        title={form.title}
                        meta={formMeta(form)}
                        badge="Archived"
                      />
                    ))}
                  </>
                ) : null}
              </ul>
            </div>
          ) : null}

          {selectedForm && !selectedForm.archived ? (
            <FormShareLink formId={selectedForm.id} />
          ) : null}
        </>
      ) : null}

      {!isPending && !isError && activeForms.length === 0 && !showArchived ? (
        <p className="meta playground-sidebar__hint">Publish your first form to manage it here.</p>
      ) : null}

      {showArchived && !isPending && !isError && archivedForms.length === 0 ? (
        <EmptyState message="No archived forms." />
      ) : null}
    </nav>
  );
}
