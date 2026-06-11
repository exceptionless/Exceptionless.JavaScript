# @exceptionless/react

Use for React web apps. This package re-exports the browser client and adds `ExceptionlessErrorBoundary`.

Docs: https://exceptionless.com/docs/clients/javascript/guides/react/

## Install

```bash
npm install @exceptionless/react --save
```

## Configure

```jsx
import { Component } from "react";
import { Exceptionless, ExceptionlessErrorBoundary } from "@exceptionless/react";

class App extends Component {
  async componentDidMount() {
    await Exceptionless.startup((config) => {
      config.apiKey = "API_KEY_HERE";
      config.setUserIdentity("12345678", "Blake");
      config.defaultTags.push("Example", "React");
    });
  }

  render() {
    return (
      <ExceptionlessErrorBoundary fallback={<div>Something went wrong.</div>}>
        <div>Application content</div>
      </ExceptionlessErrorBoundary>
    );
  }
}
```

## Send

```js
import { Exceptionless, toError } from "@exceptionless/react";

await Exceptionless.startup("API_KEY_HERE");

try {
  throw new Error("Profile save failed");
} catch (error) {
  await Exceptionless.submitException(toError(error));
}

await Exceptionless.submitLog("react", "Hello world", "info");
await Exceptionless.submitFeatureUsage("New Shopping Cart Feature");
```

React error boundaries do not catch event handler, async, or manually swallowed errors. Submit those explicitly.

## Source Anchors

- `packages/react/README.md`
- `packages/react/src/ExceptionlessErrorBoundary.tsx`
- `example/react/src/App.jsx`
