import { Platform } from "react-native";

import { ExceptionlessClient, IEventPlugin, PluginContext, toError } from "@exceptionless/core";

declare const ErrorUtils: {
  getGlobalHandler(): (error: Error, isFatal?: boolean) => void;
  setGlobalHandler(handler: (error: Error, isFatal?: boolean) => void): void;
};

interface ReactNativeExceptionGlobal {
  RN$handleException?: (error: unknown, isFatal: boolean, reportToConsole: boolean) => boolean | void;
}

interface ErrorWithCause extends Error {
  cause?: unknown;
}

export class ReactNativeGlobalHandlerPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = "ReactNativeGlobalHandlerPlugin";

  private _client: ExceptionlessClient | null = null;
  private _seenErrors = new WeakSet<object>();

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return Promise.resolve();
    }

    this._client = context.client;

    if (Platform.OS === "web") {
      this.setupWebHandlers();
    } else {
      this.setupNativeHandlers();
    }

    return Promise.resolve();
  }

  private setupNativeHandlers(): void {
    if (typeof ErrorUtils === "object") {
      const previousHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        this.submitUnhandledException(error, "ErrorUtils.globalHandler");
        previousHandler?.(error, isFatal);
      });
    }

    this.setupReactNativePromiseRejectionHandler();

    if (typeof globalThis.addEventListener === "function") {
      globalThis.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
        const error: Error = toError(event.reason, "Unhandled rejection");
        this.submitUnhandledException(error, "onunhandledrejection");
      });
    }
  }

  private setupReactNativePromiseRejectionHandler(): void {
    const reactNativeGlobal = globalThis as typeof globalThis & ReactNativeExceptionGlobal;
    const descriptor = Object.getOwnPropertyDescriptor(reactNativeGlobal, "RN$handleException");
    const previousHandler = reactNativeGlobal.RN$handleException;

    const wrappedHandler = (error: unknown, isFatal: boolean, reportToConsole: boolean) => {
      if (this.isReactNativeUnhandledPromiseRejection(error)) {
        const cause = error.cause ?? error;
        this.submitUnhandledException(toError(cause, "Unhandled rejection"), "ReactNative.promiseRejectionTracking");
      }

      return previousHandler?.(error, isFatal, reportToConsole) ?? false;
    };

    try {
      if (descriptor && !this.canAssignNativeHandler(descriptor)) {
        if (!descriptor.configurable) {
          this.setupReactNativePromiseRejectionConsoleFallback();
          return;
        }

        Object.defineProperty(reactNativeGlobal, "RN$handleException", {
          configurable: true,
          enumerable: descriptor.enumerable ?? false,
          value: wrappedHandler,
          writable: true
        });
        return;
      }

      reactNativeGlobal.RN$handleException = wrappedHandler;
    } catch {
      this.setupReactNativePromiseRejectionConsoleFallback();
    }
  }

  private setupReactNativePromiseRejectionConsoleFallback(): void {
    const previousConsoleError: (...data: unknown[]) => void = console.error.bind(console);

    console.error = (...args: unknown[]): void => {
      const [firstArg] = args;
      if (this.isReactNativeUnhandledPromiseRejection(firstArg)) {
        const cause = firstArg.cause ?? firstArg;
        this.submitUnhandledException(toError(cause, "Unhandled rejection"), "ReactNative.promiseRejectionTracking");
      }

      previousConsoleError(...args);
    };
  }

  private canAssignNativeHandler(descriptor: PropertyDescriptor): boolean {
    if ("writable" in descriptor) {
      return descriptor.writable === true;
    }

    return typeof descriptor.set === "function";
  }

  private setupWebHandlers(): void {
    if (typeof window !== "object") {
      return;
    }

    window.addEventListener("error", (event: ErrorEvent) => {
      const error = event.error instanceof Error ? event.error : toError(event.message || event.error, "Script error");
      void this._client?.submitUnhandledException(error, "onerror");
    });

    window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
      const error: Error = toError(event.reason, "Unhandled rejection");
      this.submitUnhandledException(error, "onunhandledrejection");
    });
  }

  private submitUnhandledException(error: Error, submissionMethod: string): void {
    if (this._seenErrors.has(error)) {
      return;
    }

    this._seenErrors.add(error);
    void this._client?.submitUnhandledException(error, submissionMethod);
  }

  private isReactNativeUnhandledPromiseRejection(error: unknown): error is ErrorWithCause {
    return error instanceof Error && error.message.startsWith("Uncaught (in promise");
  }
}
