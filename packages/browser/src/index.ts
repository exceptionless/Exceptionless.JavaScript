export { BrowserGlobalHandlerPlugin } from "./plugins/BrowserGlobalHandlerPlugin.js";
export { BrowserLifeCyclePlugin } from "./plugins/BrowserLifeCyclePlugin.js";
export { BrowserModuleInfoPlugin } from "./plugins/BrowserModuleInfoPlugin.js";
export { BrowserRequestInfoPlugin } from "./plugins/BrowserRequestInfoPlugin.js";
export { BrowserWrapFunctions } from "./plugins/BrowserWrapFunctions.js";
export { BrowserErrorParser } from "./services/BrowserErrorParser.js";
export { BrowserExceptionlessClient } from "./BrowserExceptionlessClient.js";

import { BrowserExceptionlessClient } from "./BrowserExceptionlessClient.js";
export const Exceptionless = new BrowserExceptionlessClient();
