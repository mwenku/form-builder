import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import { RootErrorFallback } from "@/components/RootErrorFallback";
import { registerGlobalErrorHandlers } from "@/lib/report-error";
import "@/styles.css";

registerGlobalErrorHandlers();

function renderFatal(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  if (import.meta.env.DEV) {
    console.error("Fatal bootstrap error", error);
  }

  const root = document.getElementById("root");
  if (!root) {
    return;
  }

  createRoot(root).render(
    <div className="app">
      <header className="navbar">
        <div className="contained-width navbar__wrapper">
          <span className="navbar__title">Form Builder</span>
        </div>
      </header>
      <main className="app-main contained-width">
        <RootErrorFallback detail={detail} onRetry={() => window.location.reload()} />
      </main>
    </div>,
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found");
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  renderFatal(error);
}
