export { BrowserErrorPlugin } from "./plugins/BrowserErrorPlugin.js"
export { BrowserGlobalHandlerPlugin } from "./plugins/BrowserGlobalHandlerPlugin.js";
export { BrowserIgnoreExtensionErrorsPlugin } from "./plugins/BrowserIgnoreExtensionErrorsPlugin.js";
export { BrowserLifeCyclePlugin } from "./plugins/BrowserLifeCyclePlugin.js";
export { BrowserModuleInfoPlugin } from "./plugins/BrowserModuleInfoPlugin.js";
export { BrowserRequestInfoPlugin } from "./plugins/BrowserRequestInfoPlugin.js";
export { BrowserExceptionlessClient } from "./BrowserExceptionlessClient.js";

import { BrowserExceptionlessClient } from "./BrowserExceptionlessClient.js";
export const Exceptionless = new BrowserExceptionlessClient();
