import React, { Component } from "react";
import "./App.css";
import { Exceptionless, ExceptionlessErrorBoundary } from "@exceptionless/react";

function ExceptionlessExampleContent({ error, message, errorInfo, onThrowComponentError, onUnhandledException, onSubmitMessage, onTryCatchExample }) {
  if (error) {
    throw new Error("I crashed!");
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="container">
          <h1 className="App-title">Exceptionless React Sample</h1>
          <p>By pressing the button below, an uncaught error will be thrown inside your component. This will automatically be sent to Exceptionless.</p>
          <button onClick={onThrowComponentError}>Simulate Error</button>
          <div>
            <p>Throw an uncaught error and make sure Exceptionless tracks it.</p>
            <button onClick={onUnhandledException}>Throw unhandled error</button>
          </div>
          <p>The following buttons simulated handled events outside the component.</p>
          <button onClick={onSubmitMessage}>Submit Message</button>
          {message && (
            <p>
              Message sent to Exceptionless: <code>{message}</code>
            </p>
          )}
          <button onClick={onTryCatchExample}>Try/Catch Example</button>
          {errorInfo && (
            <p>
              Error message sent to Exceptionless: <code>{errorInfo}</code>
            </p>
          )}
        </div>
      </header>
    </div>
  );
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
      message: "",
      errorInfo: ""
    };
  }
  async componentDidMount() {
    await Exceptionless.startup((c) => {
      c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271nTest";
      c.serverUrl = "https://localhost:5100";
      c.useDebugLogger();

      c.defaultTags.push("Example", "React");
    });
  }

  throwErrorInComponent = () => {
    this.setState({ error: true });
  };

  submitMessage = async () => {
    const message = "Hello, world!";
    this.setState({ message: "", errorInfo: "" });
    await Exceptionless.submitLog(message);
    this.setState({ message });
  };

  tryCatchExample = async () => {
    try {
      this.setState({ message: "", errorInfo: "" });
      throw new Error("Caught in the try/catch");
    } catch (error) {
      this.setState({ errorInfo: error.message });
      await Exceptionless.submitException(error);
    }
  };

  unhandledExceptionExample = () => {
    throw new Error("Unhandled exception");
  };

  render() {
    return (
      <ExceptionlessErrorBoundary>
        <ExceptionlessExampleContent
          error={this.state.error}
          message={this.state.message}
          errorInfo={this.state.errorInfo}
          onThrowComponentError={this.throwErrorInComponent}
          onUnhandledException={this.unhandledExceptionExample}
          onSubmitMessage={() => {
            void this.submitMessage();
          }}
          onTryCatchExample={() => {
            void this.tryCatchExample();
          }}
        />
      </ExceptionlessErrorBoundary>
    );
  }
}

export default App;
