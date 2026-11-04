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
      config.services.storage = new AsyncStorageProvider();
      config.usePersistedQueueStorage = true;

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
}
