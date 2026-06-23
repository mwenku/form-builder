import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { FormListPage } from "@/pages/FormListPage";
import { FormFillPage } from "@/pages/FormFillPage";
import { IntegrityPage } from "@/pages/IntegrityPage";
import { PlaygroundPage } from "@/pages/PlaygroundPage";
import { SubmissionsPage } from "@/pages/SubmissionsPage";

function BrandMark() {
  return (
    <svg
      className="navbar__emblem"
      aria-hidden="true"
      viewBox="0 0 82 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M41 4a20 20 0 1 1 0 40 20 20 0 0 1 0-40Zm-14 20a14 14 0 1 0 28 0 14 14 0 0 0-28 0Zm28.5-16a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 20a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
      />
    </svg>
  );
}

function Navbar() {
  const location = useLocation();
  const playgroundActive = location.pathname.startsWith("/playground");

  return (
    <header className="navbar">
      <div className="navbar__wrapper">
        <Link to="/" className="navbar__brand" aria-label="Form Builder home">
          <BrandMark />
          <span className="navbar__title">Form Builder</span>
        </Link>
        <nav className="navbar__nav" aria-label="Main">
          <Link
            className={playgroundActive ? "navbar__link is-active" : "navbar__link"}
            to="/playground"
            aria-current={playgroundActive ? "page" : undefined}
          >
            Playground
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function App() {
  return (
    <AppProviders>
      <HelmetProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </HelmetProvider>
    </AppProviders>
  );
}

function AppLayout() {
  const location = useLocation();
  const isPlayground = location.pathname.startsWith("/playground");

  return (
    <div className={isPlayground ? "app app--playground" : "app"}>
      <Navbar />
      <main
        className={
          isPlayground
            ? "app-main app-main--ide contained-width contained-width--fluid"
            : "app-main contained-width"
        }
      >
        <Routes>
          <Route path="/" element={<FormListPage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/forms/:id/submissions" element={<SubmissionsPage />} />
          <Route path="/forms/:id/integrity" element={<IntegrityPage />} />
          <Route path="/forms/:id" element={<FormFillPage />} />
        </Routes>
      </main>
    </div>
  );
}
