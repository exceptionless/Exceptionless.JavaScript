export function getHashCode(source: string): number {
  if (!source || source.length === 0) {
    return 0;
  }

  let hash = 0;
  for (let index = 0; index < source.length; index++) {
    const character = source.charCodeAt(index);
    hash = ((hash << 5) - hash) + character;
    hash |= 0;
  }

  return hash;
}

export function getCookies(
  cookies: string,
  exclusions?: string[],
): Record<string, string> | null {
  const result: Record<string, string> = {};

  const parts: string[] = (cookies || "").split("; ");
  for (const part of parts) {
    const cookie: string[] = part.split("=");
    if (!isMatch(cookie[0], exclusions || [])) {
      result[cookie[0]] = cookie[1];
    }
  }

  return !isEmpty(result) ? result : null;
}

export function guid(): string {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() +
    s4() + s4();
}

export function parseVersion(source: string): string | null {
  if (!source) {
    return null;
  }

  const versionRegex =
    /(v?((\d+)\.(\d+)(\.(\d+))?)(?:-([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?)/;
  const matches = versionRegex.exec(source);
  if (matches && matches.length > 0) {
    return matches[0];
  }

  return null;
}

export function parseQueryString(
  query: string,
  exclusions?: string[],
): Record<string, string> {
  if (!query || query.length === 0) {
    return {};
  }

  const pairs: string[] = query.split("&");
  if (pairs.length === 0) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const pair of pairs) {
    const parts = pair.split("=");
    if (!exclusions || !isMatch(parts[0], exclusions)) {
      result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    }
  }

  return !isEmpty(result) ? result : {};
}

export function randomNumber(): number {
  return Math.floor(Math.random() * 9007199254740992);
}

/**
 * Checks to see if a value matches a pattern.
 * @param input the value to check against the @pattern.
 * @param pattern The pattern to check, supports wild cards (*).
 */
export function isMatch(
  input: string | undefined,
  patterns: string[],
  ignoreCase = true,
): boolean {
  if (typeof input !== "string") {
    return false;
  }

  const trim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
  input = (ignoreCase ? input.toLowerCase() : input).replace(trim, "");

  return (patterns || []).some((pattern) => {
    if (typeof pattern !== "string") {
      return false;
    }

    if (pattern) {
      pattern = (ignoreCase ? pattern.toLowerCase() : pattern).replace(
        trim,
        "",
      );
    }

    if (!pattern) {
      return input === undefined || input === null;
    }

    if (pattern === "*") {
      return true;
    }

    if (input === undefined || input === null) {
      return false;
    }

    const startsWithWildcard: boolean = pattern[0] === "*";
    if (startsWithWildcard) {
      pattern = pattern.slice(1);
    }

    const endsWithWildcard: boolean = pattern[pattern.length - 1] === "*";
    if (endsWithWildcard) {
      pattern = pattern.substring(0, pattern.length - 1);
    }

    if (startsWithWildcard && endsWithWildcard) {
      return pattern.length <= input.length && input.indexOf(pattern, 0) !== -1;
    }

    if (startsWithWildcard) {
      return endsWith(input, pattern);
    }

    if (endsWithWildcard) {
      return startsWith(input, pattern);
    }

    return input === pattern;
  });
}

/**
 * Very simple implementation to check primitive types for emptiness.
 * - If the input is null or undefined, it will return true.
 * - If the input is an array, it will return true if the array is empty.
 * - If the input is an object, it will return true if the object has no properties.
 * - If the input is a string, it will return true if the string is empty or "{}" or "[]".
 * @param input The input to check.
 */
export function isEmpty(input: Record<string, unknown> | null | undefined | unknown): input is null | undefined | Record<string, never> {
  if (input === null || input === undefined) {
    return true;
  }

  if (typeof input === "object") {
    if (Array.isArray(input)) {
      return input.length === 0;
    }

    if (input instanceof Date) {
      return false;
    }

    return Object.getOwnPropertyNames(input).length === 0;
  }

  if (typeof input === "string") {
    const trimmedInput = input.trim();
    return trimmedInput.length === 0 || trimmedInput === "{}" || trimmedInput === "[]";
  }

  return false;
}

export function startsWith(input: string, prefix: string): boolean {
  return input.substring(0, prefix.length) === prefix;
}

export function endsWith(input: string, suffix: string): boolean {
  return input.indexOf(suffix, input.length - suffix.length) !== -1;
}

/**
 * This function will prune an object to a certain depth and return a new object.
 * The following rules will be applied:
 * 1. If the value is null or undefined, it will be returned as is.
 * 2. If the value is a function or unsupported type it will be return undefined.
 * 3. If the value is an array, it will be pruned to the specified depth.
 * 4. If the value is an object, it will be pruned to the specified depth and
 *    a. If the object is a Circular Reference it will return undefined.
 *    b. If the object is a Map, it will be converted to an object. Some data loss might occur if map keys are object types as last in wins.
 *    c. If the object is a Set, it will be converted to an array.
 *    d. If the object contains prototype properties, they will be picked up.
 *    e. If the object contains a toJSON function, it will be called and it's value will be normalized.
 *    f. If the object is is not iterable or cloneable (e.g., WeakMap, WeakSet, etc.), it will return undefined.
 *    g. If a symbol property is encountered, it will be converted to a string representation and could overwrite existing object keys.
 * 5. If the value is an Error, we will treat it as an object.
 * 6. If the value is a primitive, it will be returned as is.
 * 7. If the value is a Regexp, Symbol we will convert it to the string representation.
 * 8. BigInt and other typed arrays will be converted to a string unless number type works.
 * 9. All other values will be returned as undefined (E.g., Buffer, DataView, Promises, Generators etc..)
 */
export function prune(value: unknown, depth: number = 10): unknown {
  function isUnsupportedType(value: unknown): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    switch (typeof value) {
      case "function":
        return true;
      case "object":
        switch (Object.prototype.toString.call(value)) {
          case "[object AsyncGenerator]":
          case "[object Generator]":
          case "[object ArrayBuffer]":
          case "[object Buffer]":
          case "[object DataView]":
          case "[object Promise]":
          case "[object WeakMap]":
          case "[object WeakSet]":
            return true;
        }

        // Check for buffer;
        if ("writeBigInt64LE" in value) {
          return true;
        }

        break;
    }

    return false;
  }

  function normalizeValue(value: unknown): unknown {
    function hasToJSONFunction(value: unknown): value is { toJSON: () => unknown } {
      return value !== null && typeof value === "object" && typeof (value as { toJSON?: unknown }).toJSON === "function";
    }

    if (typeof value === "bigint") {
      return `${value.toString()}n`;
    }

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return value;
      }

      if (value instanceof Date) {
        return value;
      }

      if (value instanceof Map) {
        const result: Record<PropertyKey, unknown> = {};
        for (const [key, val] of value) {
          result[key] = val;
        }

        return result;
      }

      if (value instanceof RegExp) {
        return value.toString();
      }

      if (value instanceof Set) {
        return Array.from(value);
      }

      // Check for typed arrays
      const TypedArray = Object.getPrototypeOf(Uint8Array);
      if (value instanceof TypedArray) {
        return Array.from(value as Iterable<unknown>);
      }

      if (hasToJSONFunction(value)) {
        // NOTE: We are not checking for circular references or overflow
        return normalizeValue(value.toJSON());
      }

      return value;
    }

    if (typeof value === "symbol") {
      return value.description;
    }

    return value;
  }

  function pruneImpl(value: unknown, maxDepth: number, currentDepth: number = 10, seen: WeakSet<object> = new WeakSet(), parentIsArray: boolean = false): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (currentDepth > maxDepth) {
      return undefined;
    }

    if (isUnsupportedType(value)) {
      return undefined;
    }

    const normalizedValue = normalizeValue(value);
    if (typeof normalizedValue === "object") {
      if (currentDepth == maxDepth) {
        return undefined;
      }

      if (Array.isArray(normalizedValue)) {
        // Treat an object inside of an array as a single level
        const depth: number = parentIsArray ? currentDepth + 1 : currentDepth;
        return normalizedValue.map(e => pruneImpl(e, maxDepth, depth, seen, true));
      }

      if (normalizedValue instanceof Date) {
        return normalizedValue;
      }

      // Check for circular references
      if (Object.prototype.toString.call(normalizedValue) === "[object Object]") {
        if (seen.has(normalizedValue as object)) {
          return undefined;
        }

        seen.add(normalizedValue as object);
      }

      const keys = new Set<PropertyKey>([...Object.getOwnPropertyNames(normalizedValue), ...Object.getOwnPropertySymbols(normalizedValue)]);
      // Loop over and add any inherited prototype properties
      for (const key in normalizedValue) {
        keys.add(key);
      }

      type NonSymbolPropertyKey = Exclude<PropertyKey, symbol>;
      const result: Record<NonSymbolPropertyKey, unknown> = {};
      for (const key of keys) {
        // Normalize the key so Symbols are converted to strings.
        const normalizedKey = normalizeValue(key) as NonSymbolPropertyKey;

        const objectValue = (normalizedValue as { [index: PropertyKey]: unknown })[key];
        result[normalizedKey] = pruneImpl(objectValue, maxDepth, currentDepth + 1, seen);
      }

      return result;
    }

    return normalizedValue;
  }

  if (depth < 0) {
    return undefined;
  }

  return pruneImpl(value, depth, 0);
}

export function stringify(data: unknown, exclusions?: string[], maxDepth: number = 10): string | undefined {
  function stringifyImpl(obj: unknown, excludedKeys: string[]): string {
    return JSON.stringify(obj, (key: string, value: unknown) => {
      if (isMatch(key, excludedKeys)) {
        return;
      }

      return value;
    });
  }

  if (data === undefined) {
    return data;
  }

  const prunedData = prune(data, maxDepth);
  return stringifyImpl(prunedData, exclusions || []);
}

export function toBoolean(input: unknown, defaultValue: boolean = false): boolean {
  if (typeof input === "boolean") {
    return input;
  }

  if (
    input === null || typeof input !== "number" && typeof input !== "string"
  ) {
    return defaultValue;
  }

  switch ((input + "").toLowerCase().trim()) {
    case "true":
    case "yes":
    case "1":
      return true;
    case "false":
    case "no":
    case "0":
    case null:
      return false;
  }

  return defaultValue;
}

export function toError(errorOrMessage: unknown, defaultMessage = "Unknown Error"): Error {
  if (errorOrMessage === null || errorOrMessage === undefined) {
    return new Error(defaultMessage);
  }

  if (errorOrMessage instanceof Error) {
    return errorOrMessage;
  }

  if (typeof errorOrMessage === "string") {
    return new Error(errorOrMessage);
  }

  return new Error(stringify(errorOrMessage) || defaultMessage);
}


/**
 * Unrefs a timeout or interval. When called, the active Timeout object will not require the Node.js event loop to remain active
 */
export function allowProcessToExitWithoutWaitingForTimerOrInterval(timeoutOrIntervalId: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> | undefined): void {
  if (typeof timeoutOrIntervalId === "object" && "unref" in timeoutOrIntervalId) {
    (timeoutOrIntervalId as { unref: () => ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> }).unref();
  }
}
