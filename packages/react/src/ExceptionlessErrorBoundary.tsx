import { Component } from 'react';
import { Exceptionless } from "@exceptionless/browser";

type ErrorState = {
  hasError: boolean;
};

export class ExceptionlessErrorBoundary extends Component<{}, ErrorState> {
  constructor(props) {
    super(props);
  }

  async componentDidCatch(error, errorInfo) {
    console.log(errorInfo);
    Exceptionless.submitException(error);
  }

  render() {
    return this.props.children;
  }
}
