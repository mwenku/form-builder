import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@/components/StatusViews";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Unhandled UI error", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          code="server_error"
          onRetry={() => {
            this.setState({ hasError: false });
            window.location.assign("/");
          }}
        />
      );
    }
    return this.props.children;
  }
}
