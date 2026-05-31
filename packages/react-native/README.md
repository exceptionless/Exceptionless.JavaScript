# Exceptionless React Native

React Native and Expo client for [Exceptionless](https://exceptionless.com) — real-time error and event reporting with native iOS crash capture.

**Features:**

- Automatic capture of unhandled JS errors and promise rejections
- Parsed React Native / Hermes JavaScript stack frames
- React error boundary component
- Native iOS crash reporting via [PLCrashReporter](https://github.com/microsoft/plcrashreporter) (ObjC/Swift exceptions, signals, Mach exceptions)
- Persistent event queue via AsyncStorage
- Automatic device and environment info (OS, React Native version, device model where available, locale)
- Session tracking with heartbeats
- App lifecycle management (background/foreground)
- Works with Expo (managed + bare) and React Native CLI

## Quick Start

```bash
npm install @exceptionless/react-native @react-native-async-storage/async-storage
```

```tsx
import { Exceptionless } from "@exceptionless/react-native";

await Exceptionless.startup((c) => {
  c.apiKey = "API_KEY_HERE";
});
```

That's it. Unhandled errors, promise rejections, and native iOS crashes are now automatically reported.

## Installation

### Expo (Managed Workflow)

```bash
npx expo install @exceptionless/react-native @react-native-async-storage/async-storage
```

Add the config plugin to `app.json` when using development or standalone builds:

```json
{
  "expo": {
    "plugins": ["@exceptionless/react-native/expo-plugin"]
  }
}
```

> **Note:** Native iOS crash reporting requires an Expo [development build](https://docs.expo.dev/develop/development-builds/introduction/) or standalone build. It does not work in Expo Go. For local development with native crash capture, install `expo-dev-client` and run `npx expo run:ios`. JS error reporting works everywhere, including Expo Go.

### React Native CLI (Bare Workflow)

```bash
npm install @exceptionless/react-native @react-native-async-storage/async-storage
cd ios && pod install
```

CocoaPods will automatically link PLCrashReporter for native crash reporting.

## Configuration

Call `startup` once when your app initializes:

```tsx
import { Exceptionless } from "@exceptionless/react-native";

await Exceptionless.startup((c) => {
  c.apiKey = "API_KEY_HERE";

  // Optional: identify the user
  c.setUserIdentity("user-123", "Jane Doe");

  // Optional: enable managed sessions with heartbeats (every 60s)
  c.useSessions(true, 60000, true);

  // Optional: add default tags
  c.defaultTags.push("react-native", "ios");

  // Optional: add default data
  c.defaultData["environment"] = "production";
});
```

### Self-Hosted Server

```tsx
await Exceptionless.startup((c) => {
  c.apiKey = "API_KEY_HERE";
  c.serverUrl = "https://your-exceptionless-server.com";
});
```

## Error Boundary

Wrap your component tree to catch and report React rendering errors:

```tsx
import { Exceptionless, ExceptionlessErrorBoundary } from "@exceptionless/react-native";

function App() {
  return (
    <ExceptionlessErrorBoundary>
      <YourApp />
    </ExceptionlessErrorBoundary>
  );
}
```

You can provide a custom fallback UI:

```tsx
<ExceptionlessErrorBoundary fallback={<Text>Something went wrong</Text>}>
  <YourApp />
</ExceptionlessErrorBoundary>
```

## Sending Events

```tsx
import { Exceptionless, toError } from "@exceptionless/react-native";

// Submit errors
try {
  riskyOperation();
} catch (error) {
  await Exceptionless.submitException(toError(error));
}

// Submit logs
await Exceptionless.submitLog("App started");
await Exceptionless.submitLog("app.startup", "User opened app", "info");

// Submit feature usage
await Exceptionless.submitFeatureUsage("DarkMode");

// Fluent builder API
await Exceptionless.createException(new Error("Checkout failed")).addTags("checkout", "critical").setProperty("orderId", "12345").markAsCritical(true).submit();
```

## Automatically Captured Data

The following is captured automatically with every event (when available):

| Data                   | Source                            | Platforms |
| ---------------------- | --------------------------------- | --------- |
| OS name and version    | `Platform.OS`, `Platform.Version` | All       |
| Device brand and model | `Platform.constants`              | Android   |
| Locale                 | `Intl.DateTimeFormat`             | All       |
| React Native version   | `Platform.constants`              | All       |

## Internal Log Monitoring

Monitor SDK internal logs for debugging (useful during development):

```tsx
import { CallbackLog, ConsoleLog, Exceptionless } from "@exceptionless/react-native";
import type { LogEntry } from "@exceptionless/react-native";

const log = new CallbackLog(new ConsoleLog());

log.subscribe((entry: LogEntry) => {
  console.log(`[${entry.level}] ${entry.message}`);
});

await Exceptionless.startup((c) => {
  c.apiKey = "API_KEY_HERE";
  c.services.log = log;
});
```

## Native iOS Crash Reporting

On iOS, the package automatically installs a native crash reporter using [PLCrashReporter](https://github.com/microsoft/plcrashreporter). This captures crashes that JavaScript cannot detect:

- Objective-C / Swift exceptions
- Signal crashes (SIGSEGV, SIGABRT, SIGBUS, etc.)
- Mach exceptions (EXC_BAD_ACCESS, etc.)

Crash reports are saved to disk by PLCrashReporter and submitted automatically on the next app launch. No additional configuration is needed.

> **Note:** Native crash reporting is only available on iOS. Android native crash support is planned for a future release. JS error reporting works on all platforms.

## API Reference

### Exports

| Export                           | Description                                               |
| -------------------------------- | --------------------------------------------------------- |
| `Exceptionless`                  | Pre-configured singleton client — use this for most cases |
| `ExceptionlessErrorBoundary`     | React error boundary component                            |
| `ReactNativeExceptionlessClient` | Client class (for creating additional instances)          |
| `CallbackLog`                    | Log decorator for monitoring SDK internals                |
| `AsyncStorageProvider`           | IStorage implementation using AsyncStorage                |
| `ReactNativeErrorPlugin`         | Parses React Native JavaScript stack traces               |
| `NativeCrashPlugin`              | Submits pending iOS native crash reports                  |

All exports from `@exceptionless/core` are also re-exported (event types, configuration, plugin interfaces, etc.).

## Requirements

- React >= 18.0.0
- React Native >= 0.71.0
- iOS >= 14.0 (for native crash reporting)
- `@react-native-async-storage/async-storage` >= 1.19.0 for persistent event queue storage

## Support

If you need help, please contact us via in-app support,
[open an issue](https://github.com/exceptionless/Exceptionless.JavaScript/issues/new)
or [join our chat on Discord](https://discord.gg/6HxgFCx). We're always here to
help if you have any questions!
