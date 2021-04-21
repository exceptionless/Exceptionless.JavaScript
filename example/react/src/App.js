import React, { Component } from "react";
import "./App.css";
import {
  Exceptionless,
  ExceptionlessErrorBoundary,
} from "@exceptionless/react";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
      message: "",
      errorInfo: "",
    };
  }
  async componentDidMount() {
    await Exceptionless.startup((c) => {
      c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw";
      c.serverUrl = "http://localhost:5000";
      c.useDebugLogger();

      c.defaultTags.push("Example", "React");
    });
  }

  throwErrorInComponent = () => {
    this.setState({ error: true });
  };

  submitMessage = () => {
    const message = "Hello, world!";
    this.setState({ message: "", errorInfo: "" });
    Exceptionless.submitLog(message);
    this.setState({ message });
  };

  tryCatchExample = () => {
    try {
      this.setState({ message: "", errorInfo: "" });
      throw new Error("Caught in the try/catch");
    } catch (error) {
      this.setState({ errorInfo: error.message });
      Exceptionless.submitException(error);
    }
  };

  renderExample = () => {
    if (this.state.error) {
      throw new Error("I crashed!");
    } else {
      return (
        <div className="App">
          <header className="App-header">
            <div className="container">
              <h1 className="App-title">Exceptionless React Sample</h1>
              <p>
                By pressing the button below, an uncaught error will be thrown
                inside your component. This will automatically be sent to
                Exceptionless.
              </p>
              <button onClick={this.throwErrorInComponent}>
                Simulate Error
              </button>
              <p>
                The following buttons simulated handled events outside the
                component.
              </p>
              <button onClick={this.submitMessage}>Submit Message</button>
              {this.state.message && (
                <p>
                  Message sent to Exceptionless:{" "}
                  <code>{this.state.message}</code>
                </p>
              )}
              <button onClick={this.tryCatchExample}>Try/Catch Example</button>
              {this.state.errorInfo && (
                <p>
                  Error message sent to Exceptionless:{" "}
                  <code>{this.state.errorInfo}</code>
                </p>
              )}
            </div>
          </header>
        </div>
      );
    }
  };

  render() {
    return (
      <ExceptionlessErrorBoundary>
        {this.renderExample()}
      </ExceptionlessErrorBoundary>
    );
  }
}

export default App;
