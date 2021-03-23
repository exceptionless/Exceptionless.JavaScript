export function getHashCode(source: string): number {
  if (!source || source.length === 0) {
    return 0;
  }

  let hash: number = 0;
  for (let index = 0; index < source.length; index++) {
    const character = source.charCodeAt(index);
    hash = ((hash << 5) - hash) + character;
    hash |= 0;
  }

  return hash;
}

export function getCookies(cookies: string, exclusions?: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  const parts: string[] = (cookies || "").split("; ");
  for (const part of parts) {
    const cookie: string[] = part.split("=");
    if (!isMatch(cookie[0], exclusions)) {
      result[cookie[0]] = cookie[1];
    }
  }

  return !isEmpty(result) ? result : null;
}

// TODO: PERF this to generate reference id.
export function guid(): string {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
}

export function merge<T>(defaultValues: T, values: T): T {
  const result = {};

  for (const key in defaultValues || {}) {
    if (defaultValues[key] !== undefined && defaultValues[key] !== null) {
      result[key] = defaultValues[key];
    }
  }

  for (const key in values || {}) {
    if (values[key] !== undefined && values[key] !== null) {
      result[key] = values[key];
    }
  }

  return <T>result;
}

export function parseVersion(source: string): string {
  if (!source) {
    return null;
  }

  const versionRegex = /(v?((\d+)\.(\d+)(\.(\d+))?)(?:-([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?)/;
  const matches = versionRegex.exec(source);
  if (matches && matches.length > 0) {
    return matches[0];
  }

  return null;
}

export function parseQueryString(query: string, exclusions?: string[]): Record<string, string> {
  if (!query || query.length === 0) {
    return null;
  }

  const pairs: string[] = query.split("&");
  if (pairs.length === 0) {
    return null;
  }

  const result: Record<string, string> = {};
  for (const pair of pairs) {
    const parts = pair.split("=");
    if (!isMatch(parts[0], exclusions)) {
      result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    }
  }

  return !isEmpty(result) ? result : null;
}

export function randomNumber(): number {
  return Math.floor(Math.random() * 9007199254740992);
}

/**
 * Checks to see if a value matches a pattern.
 * @param input the value to check against the @pattern.
 * @param pattern The pattern to check, supports wild cards (*).
 */
export function isMatch(input: string, patterns: string[], ignoreCase: boolean = true): boolean {
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
      pattern = (ignoreCase ? pattern.toLowerCase() : pattern).replace(trim, "")
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

export function isEmpty(input: Record<string, unknown> | unknown) {
  return input === null || (typeof (input) === "object" && Object.keys(input).length === 0);
}

export function startsWith(input: string, prefix: string): boolean {
  return input.substring(0, prefix.length) === prefix;
}

export function endsWith(input: string, suffix: string): boolean {
  return input.indexOf(suffix, input.length - suffix.length) !== -1;
}

/**
 * Stringifies an object with optional exclusions and max depth.
 * @param data The data object to add.
 * @param exclusions Any property names that should be excluded.
 * @param maxDepth The max depth of the object to include.
 */
export function stringify(data: any, exclusions?: string[], maxDepth?: number): string {
  function stringifyImpl(obj: any, excludedKeys: string[]): string {
    const cache: string[] = [];
    return JSON.stringify(obj, (key: string, value: any) => {
      if (isMatch(key, excludedKeys)) {
        return;
      }

      if (typeof value === "object" && value) {
        if (cache.indexOf(value) !== -1) {
          // Circular reference found, discard key
          return;
        }

        cache.push(value);
      }

      return value;
    });
  }

  if (({}).toString.call(data) === "[object Object]") {
    const flattened = {};
    for (const prop in data) {
      const value = data[prop];
      if (value === data) {
        continue;
      }
      flattened[prop] = data[prop];
    }

    return stringifyImpl(flattened, exclusions);
  }

  if (({}).toString.call(data) === "[object Array]") {
    const result = [];
    for (let index = 0; index < data.length; index++) {
      result[index] = JSON.parse(stringifyImpl(data[index], exclusions));
    }

    return JSON.stringify(result);
  }

  return stringifyImpl(data, exclusions);
}

export function toBoolean(input, defaultValue: boolean = false): boolean {
  if (typeof input === "boolean") {
    return input;
  }

  if (input === null || typeof input !== "number" && typeof input !== "string") {
    return defaultValue;
  }

  switch ((input + "").toLowerCase().trim()) {
    case "true": case "yes": case "1": return true;
    case "false": case "no": case "0": case null: return false;
  }

  return defaultValue;
}
