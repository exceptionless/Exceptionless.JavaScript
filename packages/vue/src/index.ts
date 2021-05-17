import { Exceptionless } from "@exceptionless/browser";
export { Exceptionless };

/**
 * https://vuejs.org/v2/api/#errorHandler
 * https://v3.vuejs.org/api/application-config.html#errorhandler
 * @param err
 * @param vm
 * @param info
 */
export const ExceptionlessErrorHandler = async (err, vm, info) => {
  console.log({ err, vm, info });
  await Exceptionless.submitException(err);
}
