import { Component, type ErrorInfo as ReactErrorInfo, type PropsWithChildren } from "react";
import { Exceptionless } from "@exceptionless/browser";

const ReactComponentStackContextKey = "@@_ComponentStack";

type ErrorState = {
  hasError: boolean;
};

export class ExceptionlessErrorBoundary extends Component<PropsWithChildren, ErrorState> {
  constructor(props: Readonly<Record<PropertyKey, unknown>> | Record<PropertyKey, unknown>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorState {
    return { hasError: true };
  }

  async componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    const builder = Exceptionless.createException(error);
    if (errorInfo.componentStack) {
      builder.setContextProperty(ReactComponentStackContextKey, errorInfo.componentStack);
    }

    await builder.submit();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}
