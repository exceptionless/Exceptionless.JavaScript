# Agent Guidelines for Exceptionless.JavaScript

You are an expert TypeScript/JavaScript engineer working on Exceptionless.JavaScript, the official client SDK monorepo for the [Exceptionless](https://exceptionless.com) error and event monitoring platform. This is an npm workspaces monorepo containing 6 library packages and 5 example apps. Your changes must maintain backward compatibility, cross-package consistency, and correctness across browser and Node.js environments. Approach each task methodically: research existing patterns, make surgical changes, and validate thoroughly.

**Craftsmanship Mindset**: Every line of code should be intentional, readable, and maintainable. Write code you'd be proud to have reviewed by senior engineers. Prefer simplicity over cleverness. When in doubt, favor explicitness and clarity.

## Repository Overview

Exceptionless.JavaScript provides client SDKs for sending errors, logs, feature usages, and other events to an Exceptionless server:

- **Core** (`@exceptionless/core`) — Event building, configuration, plugin system, queues, storage, submission
- **Browser** (`@exceptionless/browser`) — Browser-specific error handling, request info, lifecycle plugins
- **Node** (`@exceptionless/node`) — Node.js error handling, file-based storage, process lifecycle
- **React** (`@exceptionless/react`) — React error boundary component
- **Vue** (`@exceptionless/vue`) — Vue plugin wrapper
- **AngularJS** (`@exceptionless/angularjs`) — AngularJS module wrapper

Design principles: **interface-first**, **plugin architecture**, **zero runtime dependencies in core**, **platform-specific extensions**, **ESM-first with CDN bundles**.

## Quick Start

```bash
# Install dependencies (use ci for clean installs)
npm ci

# Build all packages (respects workspace dependency order)
npm run build

# Run all tests
npm test

# Lint (ESLint + Prettier check)
npm run lint

# Auto-format with Prettier
npm run format

# Clean all build outputs
npm run clean

# Build + watch a specific package
npm run watch --workspace=packages/core
```

## Project Structure

```text
packages/
├── core/              # Core library — events, configuration, plugins, queues, storage, submission
│   ├── src/
│   │   ├── configuration/    # Configuration class, SettingsManager
│   │   ├── lastReferenceIdManager/
│   │   ├── logging/          # ILog, ConsoleLog, NullLog
│   │   ├── models/           # Event, ErrorInfo, RequestInfo, UserInfo, etc.
│   │   ├── plugins/          # IEventPlugin interface, EventPluginManager, default plugins
│   │   ├── queue/            # IEventQueue, DefaultEventQueue
│   │   ├── storage/          # IStorage, InMemoryStorage, LocalStorage
│   │   ├── submission/       # ISubmissionClient, DefaultSubmissionClient
│   │   ├── EventBuilder.ts   # Fluent event builder API
│   │   ├── ExceptionlessClient.ts  # Main client class
│   │   ├── Utils.ts          # Shared utility functions
│   │   └── index.ts          # Barrel export
│   └── test/
├── browser/           # Browser client — extends core with browser-specific plugins
│   ├── src/
│   │   ├── plugins/          # BrowserErrorPlugin, GlobalHandlerPlugin, etc.
│   │   ├── BrowserExceptionlessClient.ts
│   │   └── index.ts
│   └── test/
├── node/              # Node.js client — extends core with Node-specific plugins and storage
│   ├── src/
│   │   ├── plugins/
│   │   ├── storage/
│   │   ├── NodeExceptionlessClient.ts
│   │   └── index.ts
│   └── test/
├── react/             # React error boundary wrapper
│   └── src/
│       ├── ExceptionlessErrorBoundary.tsx
│       └── index.ts
├── vue/               # Vue plugin wrapper
│   └── src/
│       └── index.ts
└── angularjs/         # AngularJS module wrapper
    └── src/
        └── index.ts
example/
├── browser/           # Vanilla JS browser sample
├── express/           # Express.js server sample
├── react/             # React + Vite sample
├── svelte-kit/        # SvelteKit sample
└── vue/               # Vue + Vite sample
```

### Dependency Flow

```text
core → browser → react
                → vue
                → angularjs
core → node
```

All framework packages (`react`, `vue`, `angularjs`) depend on `browser`, which depends on `core`. The `node` package depends directly on `core`.

## Coding Standards

### Style & Formatting

- Run `npm run format` (Prettier) to auto-format code
- Run `npm run lint` (ESLint + Prettier check) to verify
- Match existing file style; minimize diffs
- No code comments unless necessary—code should be self-explanatory

### TypeScript

- **Strict mode**: All packages use `"strict": true` with `exactOptionalPropertyTypes`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`
- **Target**: ES2022 with ESNext modules
- **Prefer `interface` over `type`** for object shapes
- **Use modern features**: optional chaining (`?.`), nullish coalescing (`??`), `async`/`await` over raw promises
- **Explicit return types** on exported functions
- **No `any`**: Use `unknown` and narrow with type guards

### Module System

- **ESM only**: All packages use `"type": "module"` in `package.json`
- **File extensions in imports**: Use `.js` extensions in TypeScript import paths (e.g., `import { Foo } from "./Foo.js"`)
- **Barrel exports**: Each package has an `index.ts` that re-exports all public API
- **Type-only exports**: Use `export type { ... }` for interfaces and type aliases

### Architecture Patterns

- **Interface-first design**: Core abstractions are interfaces (`IEventPlugin`, `IStorage`, `IEventQueue`, `ISubmissionClient`, `ILog`)
- **Plugin architecture**: Functionality is composed via `IEventPlugin` implementations registered on `Configuration`
- **Platform extension**: Browser and Node packages extend `ExceptionlessClient` with platform-specific plugins and services
- **Framework wrappers**: React, Vue, and AngularJS packages wrap the browser client with framework-specific integration patterns
- **Zero runtime dependencies in core**: The core package has no production `dependencies`
- **CDN bundles**: Each package produces esbuild bundles (`dist/index.bundle.js`, `dist/index.bundle.min.js`) for unpkg/jsdelivr

### Code Quality

- Write complete, runnable code—no placeholders, TODOs, or `// existing code...` comments
- Follow SOLID, DRY principles; remove unused code and parameters
- Clear, descriptive naming; prefer explicit over clever
- One primary type/class per file
- Keep files focused on a single responsibility

### Common Patterns

```typescript
// Plugin implementation
export class MyPlugin implements IEventPlugin {
  priority = 50;
  name = "MyPlugin";

  async startup(context: PluginContext): Promise<void> {
    /* ... */
  }
  async run(context: EventPluginContext): Promise<void> {
    /* ... */
  }
}

// Fluent event builder
client.createLog("source", "message", "info").addTags("tag1", "tag2").setUserIdentity("user@example.com").submit();

// Configuration
const client = new ExceptionlessClient();
await client.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.serverUrl = "https://localhost:5200";
  config.addPlugin(new MyPlugin());
});
```

### Key Interfaces

```typescript
// Plugin lifecycle
interface IEventPlugin {
  priority?: number;
  name?: string;
  startup?(context: PluginContext): Promise<void>;
  suspend?(context: PluginContext): Promise<void>;
  run?(context: EventPluginContext): Promise<void>;
}

// Storage abstraction
interface IStorage {
  length(): Promise<number>;
  clear(): Promise<void>;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  key(index: number): Promise<string | null>;
  keys(): Promise<string[]>;
}

// Submission abstraction
interface ISubmissionClient {
  getSettings(version: number): Promise<Response<ServerSettings>>;
  submitEvents(events: Event[]): Promise<Response>;
  submitUserDescription(referenceId: string, description: UserDescription): Promise<Response>;
  submitHeartbeat(sessionIdOrUserId: string, closeSession: boolean): Promise<Response>;
}
```

## Making Changes

### Before Starting

1. **Gather context**: Read related files across packages, understand the dependency flow
2. **Research patterns**: Search for existing usages of the code you're modifying
3. **Understand completely**: Know the problem, side effects, and edge cases before coding
4. **Plan the approach**: Choose the simplest solution that satisfies all requirements
5. **Check cross-package impact**: Changes to `core` affect all downstream packages

### Pre-Implementation Analysis

Before writing any implementation code, think critically:

1. **What could go wrong?** Consider browser vs Node differences, async timing, null/undefined edge cases
2. **What are the failure modes?** Network failures, storage unavailable, plugin errors
3. **What assumptions am I making?** Validate each assumption against the codebase
4. **Is this the root cause?** Don't fix symptoms—trace to the core problem
5. **Is there existing code that does this?** Search before creating new utilities
6. **Does this work in both browser and Node?** Core code must be platform-agnostic

### Test-First Development

**Always write or extend tests before implementing changes:**

1. **Find existing tests first**: Search `test/` directories in the relevant package
2. **Extend existing test files**: Add test cases to existing `describe` blocks when possible
3. **Write failing tests**: Create tests that demonstrate the bug or missing feature
4. **Implement the fix**: Write minimal code to make tests pass
5. **Refactor**: Clean up while keeping tests green
6. **Verify edge cases**: Add tests for boundary conditions and error paths

### While Coding

- **Minimize diffs**: Change only what's necessary, preserve formatting and structure
- **Preserve behavior**: Don't break existing functionality or change semantics unintentionally
- **Build incrementally**: Run `npm run build` after each logical change to catch type errors early
- **Test continuously**: Run `npm test` (or `npm test --workspace=packages/core`) to verify correctness
- **Match style**: Follow the patterns in surrounding code exactly
- **Fix issues you find**: If you discover a correctness issue—whether pre-existing or introduced by your changes—fix it. If the fix is trivial, just do it. If it's non-trivial, present the issue and a proposed plan to the user.

### Validation

Before marking work complete, verify:

1. **Builds successfully**: `npm run build` exits with code 0
2. **All tests pass**: `npm test` shows no failures
3. **Lint passes**: `npm run lint` shows no errors
4. **API compatibility**: Public API changes are intentional and backward-compatible
5. **Exports updated**: New public types are re-exported through `index.ts` barrel files
6. **Cross-package consistency**: If you changed an interface in `core`, verify all implementations still conform
7. **Breaking changes flagged**: Clearly identify any breaking changes for review

## Testing

### Framework

- **Vitest** as the test runner
- **`vitest`** for imports (`describe`, `test`, `expect`, `beforeEach`, `afterEach`)
- **jsdom** test environment for browser packages, **node** for the node package
- **vitest.config.ts** at root defines test projects for each package

### Test Structure

Tests live in `test/` directories within each package, mirroring the `src/` structure:

```text
packages/core/test/
├── ExceptionlessClient.test.ts
├── Utils.test.ts
├── helpers.ts                  # Shared test utilities
├── configuration/
├── plugins/
├── queue/
├── storage/
└── submission/
```

### Writing Tests

Follow the Arrange-Act-Assert pattern:

```typescript
import { describe, test, expect } from "vitest";

import { ExceptionlessClient } from "../src/ExceptionlessClient.js";

describe("ExceptionlessClient", () => {
  test("should use event reference ids", async () => {
    // Arrange
    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";

    // Act
    const context = await client.submitException(createException());

    // Assert
    expect(context.event.reference_id).not.toBeUndefined();
  });
});
```

### Test Naming

Use descriptive names that explain the scenario:

- `"should use event reference ids"`
- `"should cancel event with known bot"`
- `"should handle null input gracefully"`

### Running Tests

```bash
# All tests across all packages
npm test

# Tests for a specific package
npm test --workspace=packages/core
npm test --workspace=packages/browser

# Watch mode for a specific package
npm run test:watch --workspace=packages/core

# Run tests matching a pattern
npx vitest --run --testNamePattern="ExceptionlessClient"
```

### Test Principles (FIRST)

- **Fast**: Tests execute quickly with no network calls
- **Isolated**: No dependencies on external services or execution order
- **Repeatable**: Consistent results every run
- **Self-checking**: Tests validate their own outcomes
- **Timely**: Write tests alongside code

## Build System

### Per-Package Build

Each package runs two build steps:

1. **`tsc`**: Compiles TypeScript → JavaScript with declarations (`.js` + `.d.ts` + `.js.map`)
2. **`esbuild`**: Bundles into single files for CDN distribution (`index.bundle.js`, `index.bundle.min.js`)

### Build Order

npm workspaces respects dependency order. `npm run build` at the root builds packages in topological order: `core` first, then `browser`/`node`, then `react`/`vue`/`angularjs`.

### Package Outputs

Each package publishes:

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "unpkg": "dist/index.bundle.min.js",
  "jsdelivr": "dist/index.bundle.min.js",
  "exports": { ".": "./dist/index.js" }
}
```

## Security

- **Validate all inputs**: Check for null, undefined, empty strings at public API boundaries
- **Sanitize external data**: Never trust data from network responses or storage
- **No sensitive data in events**: Don't capture passwords, tokens, keys, or PII
- **Use secure defaults**: Default to HTTPS for server URLs
- **Follow OWASP guidelines**: Review [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- **Dependency security**: Run `npm audit` before adding dependencies; minimize dependency count
- **No `eval` or `Function` constructors**: Avoid dynamic code execution

## Debugging

1. **Reproduce** with minimal steps using an example app
2. **Check the plugin pipeline**: Enable `ConsoleLog` to trace event processing
3. **Understand** the root cause before fixing
4. **Test** the fix thoroughly across affected packages
5. **Verify** in both browser and Node environments when the change is in `core`

## Resources

- [README.md](README.md) — Overview, installation, and usage
- [example/](example/) — Sample applications for each platform
- [Exceptionless](https://exceptionless.com) — The error monitoring platform these SDKs target
