import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FormListPage } from "@/pages/FormListPage";
import { FormFillPage } from "@/pages/FormFillPage";
import { IntegrityPage } from "@/pages/IntegrityPage";
import "@/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <HelmetProvider>
        <BrowserRouter>
          <div className="app">
            <header className="app-header">
              <a href="/">Form Builder</a>
            </header>
            <main className="app-main">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<FormListPage />} />
                  <Route path="/forms/:id/integrity" element={<IntegrityPage />} />
                  <Route path="/forms/:id" element={<FormFillPage />} />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
        </BrowserRouter>
      </HelmetProvider>
    </AppProviders>
  </StrictMode>,
);
