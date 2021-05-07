import { Exceptionless } from "@exceptionless/browser";
const ExceptionlessErrorBoundary = {
  name: "ErrorBoundary",
  data: () => ({
    error: false
  }),
  async errorCaptured(err, vm, info) {
    await Exceptionless.submitException(err);
    console.log(vm);
    console.log(info);
  },
  render() {
    return <div />;
  }
};

export { Exceptionless, ExceptionlessErrorBoundary };
