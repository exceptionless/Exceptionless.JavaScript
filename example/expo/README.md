# Exceptionless Expo Example

This example exercises `@exceptionless/react-native` from an Expo app. It covers JavaScript errors, promise rejections, manual events, logs, sessions, user identity, the React error boundary, and native iOS crash submission.

Native iOS crash reporting uses the package's custom native module, so it requires an Expo development build or a standalone app. Expo Go can run JavaScript reporting paths only; it cannot load the native crash reporter.

This app tracks Expo SDK 57.

## Prerequisites

- Install dependencies from the repository root with `npm install`.
- Run an Exceptionless server on `http://localhost:7110`. The example uses localhost for web/iOS, `10.0.2.2` for Android Emulator, and Expo's `hostUri` for physical Android devices.
- Use a development build for native iOS crash reporting.

## Run

From the repository root:

```bash
npm install
npm run ios --workspace=example/expo
```

`npm run ios` runs `expo run:ios`, which prebuilds native files when needed, installs the development build, and starts Metro. The script sets `REACT_NATIVE_PACKAGER_HOSTNAME=localhost` so iOS Simulator stack traces use localhost bundle URLs instead of LAN IPs.

For the checked-in VS Code launch profile and iPad dogfooding, use:

```bash
npm run ios:ipad --workspace=example/expo
```

`ios:ipad` launches the `iPad Air 11-inch (M3)` simulator on Metro port `8082`, which avoids colliding with another React Native app already using the default `8081` port. It also forces the Metro hostname to localhost.

If the development build is already installed, start Metro directly:

```bash
npm run start --workspace=example/expo
```

Use the web build for JavaScript event flows:

```bash
npm run start:web --workspace=example/expo
```

The web build does not include native crash reporting.

## Verify Reporting

With an Exceptionless server listening on `http://localhost:7110`, use the sample tabs to submit:

- caught errors and unhandled errors
- unhandled promise rejections
- logs and feature usage events
- session start, heartbeat, and end events

The in-app Logs tab should show events being enqueued and sent to the configured server. Native iOS crash reports are captured by the development build and submitted on the next launch.

## Notes

- The example points at `http://localhost:7110` by default and only derives the host IP for Android physical devices when Expo provides `hostUri`.
- For iOS Simulator stack traces, run Metro with `--localhost` or `REACT_NATIVE_PACKAGER_HOSTNAME=localhost`; otherwise Expo's default LAN mode can put a `10.x.x.x` URL into stack-frame file names.
- Native iOS crashes are written by the native module and submitted on the next launch.
- Android currently exercises JavaScript events only; Android native crash reporting is not implemented yet.
- Generated native folders are intentionally ignored by `example/expo/.gitignore`; run `npm run prebuild --workspace=example/expo` or `npm run ios --workspace=example/expo` to recreate them locally.
