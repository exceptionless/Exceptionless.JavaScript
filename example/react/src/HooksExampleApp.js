import React, { useEffect, useState } from "react";
import "./App.css";
import { Exceptionless, ExceptionlessErrorBoundary } from "@exceptionless/react";

const HooksExampleApp = () => {
  const [error, setError] = useState(false);
  useEffect(() => {
    startExceptionless();
  }, []);

  const startExceptionless = async () => {
    await Exceptionless.startup((c) => {
      c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271nTest";
      c.serverUrl = "https://localhost:5100";
      c.useDebugLogger();

      c.defaultTags.push("Example", "React");
    });
  };

  const throwErrorInComponent = () => {
    setError(true);
  };

  const submitMessage = () => {
    Exceptionless.submitLog("Hello, world!");
  };

  const tryCatchExample = () => {
    try {
      throw new Error("Caught in the try/catch");
    } catch (error) {
      Exceptionless.submitException(error);
    }
  };

  const renderExample = () => {
    if (error) {
      throw new Error("I crashed!");
    } else {
      return (
        <div className="App">
          <header className="App-header">
            <div className="container">
              <h1 className="App-title">Exceptionless React Sample</h1>
              <p>By pressing the button below, an uncaught error will be thrown inside your component. This will automatically be sent to Exceptionless.</p>
              <button onClick={throwErrorInComponent}>Simulate Error</button>
              <p>The following buttons simulated handled events outside the component.</p>
              <button onClick={submitMessage}>Submit Message</button>
              <button onClick={tryCatchExample}>Try/Catch Example</button>
            </div>
          </header>
        </div>
      );
    }
  };

  return <ExceptionlessErrorBoundary>{renderExample()}</ExceptionlessErrorBoundary>;
};

export default HooksExampleApp;
