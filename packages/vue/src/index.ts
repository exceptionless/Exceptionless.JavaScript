export * from "@exceptionless/browser";
import { Exceptionless, toError } from "@exceptionless/browser";

interface VueComponentOptions {
  name?: unknown;
  __name?: unknown;
  _componentTag?: unknown;
}

/**
 * Gets the component name without walking the component instance, which references the whole app (and the DOM).
 */
function getComponentName(vm: unknown): string | undefined {
  if (typeof vm !== "object" || vm === null) {
    return undefined;
  }

  const options = (vm as { $options?: VueComponentOptions }).$options;
  const name = options?.name ?? options?.__name ?? options?._componentTag;
  return typeof name === "string" && name ? name : undefined;
}

/**
 * https://vuejs.org/api/application.html#app-config-errorhandler
 * https://v2.vuejs.org/v2/api/#errorHandler
 * @param err
 * @param vm
 * @param info
 */
export const ExceptionlessErrorHandler = async (err: unknown, vm: unknown, info: unknown): Promise<void> => {
  const builder = Exceptionless.createException(toError(err));

  const component = getComponentName(vm);
  if (component) {
    builder.setProperty("component", component);
  }

  await builder.setProperty("info", info).submit();
};
