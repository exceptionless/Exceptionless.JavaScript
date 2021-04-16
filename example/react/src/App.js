import React, { Component } from 'react';
import './App.css';
import { Exceptionless, ExceptionlessErrorBoundary } from "@exceptionless/react";

class App extends Component {
  async componentDidMount() {
    await Exceptionless.startup(c => {
      c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw";
      c.serverUrl = "http://localhost:5000";
      c.useDebugLogger();

      c.defaultTags.push("Example", "React");
    })
  }

  render() {
    return (
      <ExceptionlessErrorBoundary>
        <div className="App">
          <header className="App-header">
            <h1 className="App-title">Exceptionless React Sample</h1>
          </header>
          <p className="App-intro">
            To get started, edit <code>src/App.js</code> and save to reload.
          </p>
        </div>
      </ExceptionlessErrorBoundary>
    );
  }
}

export default App;
