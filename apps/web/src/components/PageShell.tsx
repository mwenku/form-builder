import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  title: string;
  description?: string;
  backTo?: { label: string; href: string };
  children: ReactNode;
};

export function PageShell({ title, description, backTo, children }: Props) {
  return (
    <section className="page-shell">
      {backTo ? (
        <nav className="page-nav" aria-label="Breadcrumb">
          <Link to={backTo.href}>{backTo.label}</Link>
        </nav>
      ) : null}
      <header className="page-header">
        <h1>{title}</h1>
        {description ? <p className="lede">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
