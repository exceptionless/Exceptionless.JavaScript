import { Configuration, ExceptionlessClient, SimpleErrorPlugin } from "@exceptionless/core";
import { Platform } from "react-native";

import { NativeCrashPlugin } from "./plugins/NativeCrashPlugin.js";
import { ReactNativeErrorPlugin } from "./plugins/ReactNativeErrorPlugin.js";
import { ReactNativeEnvironmentInfoPlugin } from "./plugins/ReactNativeEnvironmentInfoPlugin.js";
import { ReactNativeGlobalHandlerPlugin } from "./plugins/ReactNativeGlobalHandlerPlugin.js";
import { ReactNativeLifeCyclePlugin } from "./plugins/ReactNativeLifeCyclePlugin.js";
import { AsyncStorageProvider } from "./storage/AsyncStorageProvider.js";

export class ReactNativeExceptionlessClient extends ExceptionlessClient {
  public async startup(configurationOrApiKey?: ((config: Configuration) => void) | string): Promise<void> {
    const config = this.config;

    if (configurationOrApiKey && !this._initialized) {
      this.configureStorage(config);

      if (Platform.OS === "ios") {
        config.addPlugin(new NativeCrashPlugin());
      }

      config.addPlugin(new ReactNativeEnvironmentInfoPlugin());
      config.addPlugin(new ReactNativeGlobalHandlerPlugin());
      config.addPlugin(new ReactNativeLifeCyclePlugin());
      config.addPlugin(new ReactNativeErrorPlugin());
      config.removePlugin(new SimpleErrorPlugin());
    }

    await super.startup(configurationOrApiKey);
  }

  private configureStorage(config: Configuration): void {
    try {
      const storage = new AsyncStorageProvider();
      config.services.storage = storage;
      config.usePersistedQueueStorage = true;
    } catch {
      config.services.log.info("AsyncStorage provider failed to initialize. Using in-memory storage. Events will not persist across app restarts.");
    }
  }
}
