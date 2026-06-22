import { Component, type ErrorInfo, type ReactNode } from "react";
import { RootErrorFallback } from "@/components/RootErrorFallback";
import { reportError } from "@/lib/report-error";

type Props = {
  children: ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { source: "error-boundary" });
    if (import.meta.env.DEV) {
      console.error(info.componentStack);
    }
  }

  handleRetry = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return <RootErrorFallback onRetry={this.handleRetry} detail={this.state.error?.message} />;
    }
    return this.props.children;
  }
}
