export * from "@exceptionless/browser";
import { Exceptionless } from "@exceptionless/browser";

/**
 * https://vuejs.org/v2/api/#errorHandler
 * https://v3.vuejs.org/api/application-config.html#errorhandler
 * @param err
 * @param vm
 * @param info
 */
export const ExceptionlessErrorHandler = async (err: Error, vm: unknown, info: unknown): Promise<void> => {
  await Exceptionless.createException(err).setProperty("vm", vm).setProperty("info", info).submit();
};
