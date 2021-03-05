import {
  Configuration,
  ExceptionlessClient,
  IConfigurationSettings,
} from "@exceptionless/core";
import { DefaultErrorParser } from "./services/DefaultErrorParser.js";
import { DefaultModuleCollector } from "./services/DefaultModuleCollector.js";
import { DefaultRequestInfoCollector } from "./services/DefaultRequestInfoCollector.js";
import { BrowserStorageProvider } from "./storage/BrowserStorageProvider.js";
import { FetchSubmissionClient } from "./submission/FetchSubmissionClient.js";

class ExceptionlessForBrowser extends ExceptionlessClient {
  public startup(settingsOrApiKey?: IConfigurationSettings | string) {
    const config = new Configuration();

    if (typeof settingsOrApiKey === "string") {
      config.apiKey = settingsOrApiKey;
    } else {
      Object.assign(config, settingsOrApiKey);
    }

    //config.errorParser = config.errorParser ?? new DefaultErrorParser();
    config.submissionClient = config.submissionClient ??
      new FetchSubmissionClient(config);
    //config.storage = config.storage ?? new BrowserStorageProvider();
    //config.moduleCollector = config.moduleCollector ?? new DefaultModuleCollector();
    //config.requestInfoCollector = config.requestInfoCollector ?? new DefaultRequestInfoCollector();

    // do platform specific stuff here

    super.startup(config);
  }
}

export const Exceptionless = new ExceptionlessForBrowser();
