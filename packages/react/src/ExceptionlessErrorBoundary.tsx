import { Component, type ErrorInfo as ReactErrorInfo, type PropsWithChildren, type ReactNode } from "react";
import { Exceptionless } from "@exceptionless/browser";

const ReactComponentStackContextKey = "@@_ComponentStack";

interface ErrorBoundaryProps {
  fallback?: ReactNode;
}

interface ErrorState {
  hasError: boolean;
}

export class ExceptionlessErrorBoundary extends Component<PropsWithChildren<ErrorBoundaryProps>, ErrorState> {
  constructor(props: Readonly<PropsWithChildren<ErrorBoundaryProps>>) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(): ErrorState {
    return {
      hasError: true
    };
  }

  async componentDidCatch(error: Error, errorInfo: ReactErrorInfo): Promise<void> {
    const builder = Exceptionless.createException(error);
    if (errorInfo.componentStack) {
      builder.setContextProperty(ReactComponentStackContextKey, errorInfo.componentStack);
    }

    await builder.submit();
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}
