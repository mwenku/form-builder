import { userMessages, type UserErrorCode } from "@/lib/user-messages";

type LoadingProps = {
  message?: string;
};

export function LoadingState({ message = "Loading…" }: LoadingProps) {
  return (
    <div className="state state-loading" role="status" aria-live="polite">
      <span className="state-spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

type ErrorProps = {
  code?: UserErrorCode;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ code, message, onRetry }: ErrorProps) {
  const text = message ?? (code ? userMessages[code] : userMessages.load_failed);

  return (
    <div className="state state-error" role="alert">
      <p className="state-text">{text}</p>
      {onRetry ? (
        <button type="button" className="button-secondary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

type SuccessProps = {
  message: string;
};

export function SuccessState({ message }: SuccessProps) {
  return (
    <div className="state state-success" role="status" aria-live="polite">
      <p className="state-text">{message}</p>
    </div>
  );
}

type EmptyProps = {
  message: string;
};

export function EmptyState({ message }: EmptyProps) {
  return (
    <div className="state state-empty" role="status">
      <p className="state-text">{message}</p>
    </div>
  );
}
