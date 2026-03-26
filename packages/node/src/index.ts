export * from "@exceptionless/core";

export { NodeErrorPlugin } from "./plugins/NodeErrorPlugin.js";
export { NodeEnvironmentInfoPlugin } from "./plugins/NodeEnvironmentInfoPlugin.js";
export { NodeGlobalHandlerPlugin } from "./plugins/NodeGlobalHandlerPlugin.js";
export { NodeLifeCyclePlugin } from "./plugins/NodeLifeCyclePlugin.js";
export { NodeRequestInfoPlugin } from "./plugins/NodeRequestInfoPlugin.js";
export { NodeWrapFunctions } from "./plugins/NodeWrapFunctions.js";
export { NodeExceptionlessClient } from "./NodeExceptionlessClient.js";

import { NodeExceptionlessClient } from "./NodeExceptionlessClient.js";

export const Exceptionless = new NodeExceptionlessClient();
