import { Component } from 'react';
import { Exceptionless } from "@exceptionless/browser";

type ErrorState = {
  hasError: boolean;
};

export default class ExceptionlessErrorBoundary extends Component<{}, ErrorState> {
  constructor(props: Readonly<{}> | {}) {
    super(props);
  }

  async componentDidCatch(error: Error, errorInfo: unknown) {
    await Exceptionless.createException(error).setProperty("errorInfo", errorInfo).submit();
  }

  render() {
    return this.props.children;
  }
}
