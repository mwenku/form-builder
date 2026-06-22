type ErrorContext = {
  source: string;
  queryKey?: unknown;
};

export function reportError(error: unknown, context: ErrorContext) {
  if (import.meta.env.DEV) {
    console.error(`[${context.source}]`, error, context);
  }
}

export function registerGlobalErrorHandlers() {
  window.addEventListener("error", (event) => {
    reportError(event.error ?? event.message, { source: "window" });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason, { source: "unhandledrejection" });
  });
}
