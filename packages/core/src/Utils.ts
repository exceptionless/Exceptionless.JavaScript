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

export function isEmpty(input: Record<string, unknown> | null | undefined | unknown): boolean {
  if (input === null || input === undefined) {
    return true;
  }

  if (typeof input == "object") {
    return Object.keys(<Record<string, unknown>>input).length === 0;
  }

  return false;
}

export function startsWith(input: string, prefix: string): boolean {
  return input.substring(0, prefix.length) === prefix;
}

export function endsWith(input: string, suffix: string): boolean {
  return input.indexOf(suffix, input.length - suffix.length) !== -1;
}

export function prune(value: unknown, depth: number = 10): unknown {
  function pruneImpl(value: unknown, maxDepth: number, currentDepth: number = 10, seen: WeakSet<object> = new WeakSet()): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return currentDepth < maxDepth
        ? value.map(e => pruneImpl(e, maxDepth, currentDepth + 1, seen))
        : [];
    }

    if (value instanceof Map) {
      // NOTE: We don't prune the keys here, but we could.
      return currentDepth < maxDepth
        ? Array.from(value.entries()).reduce((map, kvp) => map.set(kvp[0], pruneImpl(kvp[1], maxDepth, currentDepth + 1, seen)), new Map())
        : new Map();
    }

    if (value instanceof Set) {
      return currentDepth < maxDepth
        ? new Set(Array.from(value).map(e => pruneImpl(e, maxDepth, currentDepth + 1, seen)))
        : new Set();
    }

    if (value instanceof WeakMap || value instanceof WeakSet) {
      // WeakMap and WeakSet can't be enumerated or cloned.
      return value;
    }

    if (value && typeof value === "object") {
      // Check for circular references
      if (currentDepth >= maxDepth || seen.has(value)) {
        return {};
      }

      seen.add(value);

      const result: Record<string, unknown> = {};
      for (const key in value) {
        const val = (value as { [index: string]: unknown })[key];
        result[key] = pruneImpl(val, maxDepth, currentDepth + 1, seen);
      }

      return result;
    }

    return value;
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

  const prunedData = prune(data, maxDepth);
  if (!prunedData) {
    return;
  }

  return stringifyImpl(prunedData, exclusions || []);
}

// export function stringify(data: unknown, exclusions?: string[], maxDepth?: number = Infinity): string | undefined {
//   function stringifyImpl(obj: unknown, excludedKeys: string[], maxDepth?: number = Infinity, currentDepth: number, cache: WeakSet): string | undefined {
//     if (currentDepth > maxDepth) {
//       return;
//     }
//
//     if (typeof obj === "function" || obj === undefined) {
//       return undefined;
//     }
//
//     if (obj === null) {
//       return "null";
//     }
//
//     if (typeof obj === "string") {
//       return `"${obj}"`;
//     }
//
//     if (typeof obj === "number" || typeof obj === "boolean") {
//       return obj.toString();
//     }
//
//     if (obj instanceof Date) {
//       return `"${obj.toISOString()}"`;
//     }
//
//     if (obj instanceof RegExp) {
//       return obj.toString();
//     }
//
//     if (typeof obj === "symbol") {
//       return obj.toString();
//     }
//
//     if (typeof obj === "bigint") {
//       return obj.toString() + "n";
//     }
//
//     if (typeof obj === "object") {
//       if (Array.isArray(obj)) {
//         const items = obj.map(item => stringify(item, maxDepth, currentDepth + 1));
//         return `[${items.join(",")}]`;
//       } else {
//         const keys = Object.keys(obj).sort(); // sort keys alphabetically
//         const items = keys.map(key => `"${key}":${stringify(obj[key], maxDepth, currentDepth + 1) || "null"}`);
//         return `{${items.join(",")}}`;
//       }
//     }
//
//     // handle circular references
//     if (cache.indexOf(obj)) {
//       return "[Circular Reference]";
//     }
//     cache.push(obj);
//
//     // handle objects that define their own toJSON method
//     const toJSON = obj.toJSON;
//     if (typeof toJSON === "function") {
//       return stringify(toJSON.call(obj), maxDepth, currentDepth + 1);
//     }
//
//     // handle objects that implement the iterator protocol (Maps, Sets, etc.)
//     const iterator = obj[Symbol.iterator];
//     if (typeof iterator === "function") {
//       const items = [];
//       for (let item of obj) {
//         items.push(stringify(item, maxDepth, currentDepth + 1));
//       }
//       return `[${items.join(",")}]`;
//     }
//
//     // handle objects that implement the async iterator protocol (Streams, etc.)
//     const asyncIterator = obj[Symbol.asyncIterator];
//     if (typeof asyncIterator === "function") {
//       return stringify(asyncIterator.call(obj).next().then(result => {
//         if (result.done) {
//           return null;
//         }
//         return stringify(result.value, maxDepth, currentDepth + 1);
//       }), maxDepth, currentDepth + 1);
//     }
//
//     return undefined;
//   }
// }

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

  return new Error(JSON.stringify(errorOrMessage) || defaultMessage);
}


/**
 * Unrefs a timeout or interval. When called, the active Timeout object will not require the Node.js event loop to remain active
 */
export function allowProcessToExitWithoutWaitingForTimerOrInterval(timeoutOrIntervalId: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> | undefined): void {
  if (typeof timeoutOrIntervalId === "object" && "unref" in timeoutOrIntervalId) {
    (timeoutOrIntervalId as { unref: () => ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> }).unref();
  }
}
