export { BrowserConfiguration } from "./configuration/BrowserConfiguration.js";
export { BrowserErrorParser } from "./services/BrowserErrorParser.js";
export { BrowserModuleCollector } from "./services/BrowserModuleCollector.js";
export { BrowserRequestInfoCollector } from "./services/BrowserRequestInfoCollector.js";
export { BrowserLocalStorage } from "./storage/BrowserLocalStorage.js";
export { BrowserLocalStorageProvider as BrowserStorageProvider } from "./storage/BrowserLocalStorageProvider.js";
export { BrowserFetchSubmissionClient } from "./submission/BrowserFetchSubmissionClient.js";
export { BrowserExceptionlessClient } from "./BrowserExceptionlessClient.js";

import { BrowserExceptionlessClient } from "./BrowserExceptionlessClient.js";
export const Exceptionless = new BrowserExceptionlessClient();
