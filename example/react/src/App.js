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
    };
  }
  async componentDidMount() {
    await Exceptionless.startup((c) => {
      c.apiKey = "YOUR API KEY";
      c.useDebugLogger();

      c.defaultTags.push("Example", "React");
    });
  }

  throwErrorInComponent = () => {
    this.setState({ error: true });
  };

  renderExample = () => {
    if (this.state.error) {
      throw new Error("I crashed!");
    } else {
      return (
        <div className="App">
          <header className="App-header">
            <h1 className="App-title">Exceptionless React Sample</h1>
            <button onClick={this.throwErrorInComponent}>Throw Error</button>
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
