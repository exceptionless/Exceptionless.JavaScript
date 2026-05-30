# @exceptionless/react-native

Use for React Native and Expo apps. This package adds a React Native client, AsyncStorage-backed persistence, React Native/Hermes stack parsing, lifecycle handling, global JavaScript error capture, an error boundary, and iOS native crash reporting.

## Install

Expo:

```bash
npx expo install @exceptionless/react-native @react-native-async-storage/async-storage
```

React Native CLI:

```bash
npm install @exceptionless/react-native @react-native-async-storage/async-storage
cd ios && pod install
```

For Expo development or standalone builds, add the config plugin:

```json
{
  "expo": {
    "plugins": ["@exceptionless/react-native/expo-plugin"]
  }
}
```

Native iOS crash reporting requires an Expo development build, a standalone build, or a bare React Native app. Expo Go can capture JavaScript errors but cannot load the native crash reporter.

## Configure

Call `startup` once during app initialization:

```tsx
import { Exceptionless } from "@exceptionless/react-native";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.setUserIdentity("12345678", "Blake");
  config.defaultTags.push("React Native");
});
```

For self-hosted Exceptionless:

```tsx
await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.serverUrl = "https://exceptionless.example.com";
});
```

For local simulator development, prefer `http://localhost:<port>` when the app is running in the iOS simulator. Start Expo with `--localhost` or set `REACT_NATIVE_PACKAGER_HOSTNAME=localhost` so Metro bundle URLs in stack traces also use localhost. Use a LAN IP only when a physical device must reach a server on the development machine.

## Error Boundary

Wrap rendering surfaces to capture React render errors and attach the React component stack to `@error.data["@component_stack"]`:

```tsx
import { Text } from "react-native";
import { ExceptionlessErrorBoundary } from "@exceptionless/react-native";

export function App() {
  return (
    <ExceptionlessErrorBoundary fallback={<Text>Something went wrong.</Text>}>
      <YourApp />
    </ExceptionlessErrorBoundary>
  );
}
```

React error boundaries do not catch event handlers, async failures, or manually swallowed errors. Submit those explicitly.

## Send

```tsx
import { Exceptionless, toError } from "@exceptionless/react-native";

try {
  await saveProfile();
} catch (error) {
  await Exceptionless.submitException(toError(error));
}

await Exceptionless.submitLog("mobile", "Profile opened", "info");
await Exceptionless.submitFeatureUsage("Profile Editor");

await Exceptionless.createException(new Error("Checkout failed"))
  .addTags("checkout", "mobile")
  .setProperty("orderId", "12345")
  .markAsCritical(true)
  .submit();
```

## Captured Behavior

- Unhandled JavaScript errors and unhandled promise rejections are captured automatically after startup.
- React Native/Hermes stack frames are parsed into structured Exceptionless stack frames.
- iOS native crashes are persisted by PLCrashReporter and submitted on the next launch.
- Device, OS, locale, React Native version, sessions, and lifecycle state are captured when available.
- Event queue storage uses `@react-native-async-storage/async-storage`.

## Troubleshooting

- If native crashes do not appear in Expo, verify the app is not running in Expo Go and that the config plugin is present before rebuilding the native app.
- If simulator submissions cannot reach a local Exceptionless server, use `http://localhost:<port>` for iOS Simulator and make sure Metro is not running in Expo's default LAN mode. Physical devices need a reachable LAN host.
- For malformed or unexpected stacks, verify behavior in `ReactNativeErrorPlugin` tests before changing parser logic.
- For native crash report loss concerns, verify `NativeCrashPlugin` only clears pending reports after at least one report is retrieved and submitted.

## Source Anchors

- `packages/react-native/README.md`
- `packages/react-native/src/ReactNativeExceptionlessClient.ts`
- `packages/react-native/src/ExceptionlessErrorBoundary.tsx`
- `packages/react-native/src/plugins/ReactNativeErrorPlugin.ts`
- `packages/react-native/src/plugins/ReactNativeGlobalHandlerPlugin.ts`
- `packages/react-native/src/plugins/ReactNativeLifeCyclePlugin.ts`
- `packages/react-native/src/plugins/NativeCrashPlugin.ts`
- `packages/react-native/src/storage/AsyncStorageProvider.ts`
- `packages/react-native/exceptionless-react-native.podspec`
- `packages/react-native/expo-plugin/withExceptionless.cjs`
- `example/expo/`
