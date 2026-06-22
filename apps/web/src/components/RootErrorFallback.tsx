import { userMessages } from "@/lib/user-messages";

type Props = {
  title?: string;
  onRetry?: () => void;
  detail?: string;
};

export function RootErrorFallback({ title = userMessages.server_error, onRetry, detail }: Props) {
  return (
    <div className="fatal-fallback" role="alert">
      <h1 className="fatal-fallback__title">Something went wrong</h1>
      <p className="fatal-fallback__message">{title}</p>
      {import.meta.env.DEV && detail ? (
        <pre className="fatal-fallback__detail">{detail}</pre>
      ) : null}
      {onRetry ? (
        <button type="button" className="button-primary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
