import { AppState, Platform } from "react-native";
import type { AppStateStatus } from "react-native";

import { ExceptionlessClient, IEventPlugin, PluginContext } from "@exceptionless/core";

export class ReactNativeLifeCyclePlugin implements IEventPlugin {
  public priority: number = 105;
  public name: string = "ReactNativeLifeCyclePlugin";

  private _client: ExceptionlessClient | null = null;

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return Promise.resolve();
    }

    this._client = context.client;

    if (Platform.OS === "web") {
      this.setupWebListeners();
    } else {
      this.setupNativeListeners();
    }

    return Promise.resolve();
  }

  public suspend(): Promise<void> {
    return Promise.resolve();
  }

  private setupNativeListeners(): void {
    AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        void this._client?.startup();
      } else if (nextAppState === "background") {
        if (this._client?.config.sessionsEnabled) {
          void this._client?.submitSessionEnd();
        }
        void this._client?.suspend();
      }
    });
  }

  private setupWebListeners(): void {
    const handleBeforeUnload = () => {
      if (this._client?.config.sessionsEnabled) {
        void this._client?.submitSessionEnd();
      }
      void this._client?.suspend();
    };
    globalThis.addEventListener("beforeunload", handleBeforeUnload);

    if (typeof document !== "undefined") {
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          void this._client?.startup();
        } else {
          if (this._client?.config.sessionsEnabled) {
            void this._client?.submitSessionEnd();
          }
          void this._client?.suspend();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
  }
}
