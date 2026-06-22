import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { FormListPage } from "@/pages/FormListPage";
import { FormFillPage } from "@/pages/FormFillPage";
import { IntegrityPage } from "@/pages/IntegrityPage";

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

export function App() {
  return (
    <AppProviders>
      <HelmetProvider>
        <BrowserRouter>
          <div className="app">
            <header className="navbar">
              <div className="contained-width navbar__wrapper">
                <a href="/" className="navbar__brand" aria-label="Form Builder home">
                  <BrandMark />
                  <span className="navbar__title">Form Builder</span>
                </a>
              </div>
            </header>
            <main className="app-main contained-width">
              <Routes>
                <Route path="/" element={<FormListPage />} />
                <Route path="/forms/:id/integrity" element={<IntegrityPage />} />
                <Route path="/forms/:id" element={<FormFillPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </HelmetProvider>
    </AppProviders>
  );
}
