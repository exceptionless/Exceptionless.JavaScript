export class Utils {
  public static addRange<T>(target: T[], ...values: T[]) {
    if (!target) {
      target = [];
    }

    if (!values || values.length === 0) {
      return target;
    }

    for (const value of values) {
      if (value && target.indexOf(value) < 0) {
        target.push(value);
      }
    }

    return target;
  }

  public static getHashCode(source: string): number {
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

  public static getCookies(cookies: string, exclusions?: string[]): object {
    const result: object = {};

    const parts: string[] = (cookies || '').split('; ');
    for (const part of parts) {
      const cookie: string[] = part.split('=');
      if (!Utils.isMatch(cookie[0], exclusions)) {
        result[cookie[0]] = cookie[1];
      }
    }

    return !Utils.isEmpty(result) ? result : null;
  }

  public static guid(): string {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  // tslint:disable-next-line:ban-types
  public static merge(defaultValues: Object, values: Object) {
    const result: object = {};

    for (const key in defaultValues || {}) {
      if (!!defaultValues[key]) {
        result[key] = defaultValues[key];
      }
    }

    for (const key in values || {}) {
      if (!!values[key]) {
        result[key] = values[key];
      }
    }

    return result;
  }

  public static parseVersion(source: string): string {
    if (!source) {
      return null;
    }

    const versionRegex = /(v?((\d+)\.(\d+)(\.(\d+))?)(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?)/;
    const matches = versionRegex.exec(source);
    if (matches && matches.length > 0) {
      return matches[0];
    }

    return null;
  }

  public static parseQueryString(query: string, exclusions?: string[]) {
    if (!query || query.length === 0) {
      return null;
    }

    const pairs: string[] = query.split('&');
    if (pairs.length === 0) {
      return null;
    }

    const result: object = {};
    for (const pair of pairs) {
      const parts = pair.split('=');
      if (!Utils.isMatch(parts[0], exclusions)) {
        result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
      }
    }

    return !Utils.isEmpty(result) ? result : null;
  }

  public static randomNumber(): number {
    return Math.floor(Math.random() * 9007199254740992);
  }

  /**
   * Checks to see if a value matches a pattern.
   * @param input the value to check against the @pattern.
   * @param pattern The pattern to check, supports wild cards (*).
   */
  public static isMatch(input: string, patterns: string[], ignoreCase: boolean = true): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    const trim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    input = (ignoreCase ? input.toLowerCase() : input).replace(trim, '');

    return (patterns || []).some((pattern) => {
      if (typeof pattern !== 'string') {
        return false;
      }

      pattern = (ignoreCase ? pattern.toLowerCase() : pattern).replace(trim, '');
      if (pattern.length <= 0) {
        return false;
      }

      const startsWithWildcard: boolean = pattern[0] === '*';
      if (startsWithWildcard) {
        pattern = pattern.slice(1);
      }

      const endsWithWildcard: boolean = pattern[pattern.length - 1] === '*';
      if (endsWithWildcard) {
        pattern = pattern.substring(0, pattern.length - 1);
      }

      if (startsWithWildcard && endsWithWildcard) {
        return pattern.length <= input.length && input.indexOf(pattern, 0) !== -1;
      }

      if (startsWithWildcard) {
        return Utils.endsWith(input, pattern);
      }

      if (endsWithWildcard) {
        return Utils.startsWith(input, pattern);
      }

      return input === pattern;
    });
  }

  public static isEmpty(input: object) {
    return input === null || (typeof (input) === 'object' && Object.keys(input).length === 0);
  }

  public static startsWith(input: string, prefix: string): boolean {
    return input.substring(0, prefix.length) === prefix;
  }

  public static endsWith(input: string, suffix: string): boolean {
    return input.indexOf(suffix, input.length - suffix.length) !== -1;
  }

  /**
   * Stringifys an object with optional exclusions and max depth.
   * @param data The data object to add.
   * @param exclusions Any property names that should be excluded.
   * @param maxDepth The max depth of the object to include.
   */
  public static stringify(data: any, exclusions?: string[], maxDepth?: number): string {
    function stringifyImpl(obj: any, excludedKeys: string[]): string {
      const cache: string[] = [];
      return JSON.stringify(obj, (key: string, value: any) => {
        if (Utils.isMatch(key, excludedKeys)) {
          return;
        }

        if (typeof value === 'object' && !!value) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
          }

          cache.push(value);
        }

        return value;
      });
    }

    if (({}).toString.call(data) === '[object Object]') {
      const flattened = {};
      /* tslint:disable:forin */
      for (const prop in data) {
        const value = data[prop];
        if (value === data) {
          continue;
        }
        flattened[prop] = data[prop];
      }
      /* tslint:enable:forin */

      return stringifyImpl(flattened, exclusions);
    }

    if (({}).toString.call(data) === '[object Array]') {
      const result = [];
      for (let index = 0; index < data.length; index++) {
        result[index] = JSON.parse(stringifyImpl(data[index], exclusions));
      }

      return JSON.stringify(result);
    }

    return stringifyImpl(data, exclusions);
  }

  public static toBoolean(input, defaultValue: boolean = false): boolean {
    if (typeof input === 'boolean') {
      return input;
    }

    if (input === null || typeof input !== 'number' && typeof input !== 'string') {
      return defaultValue;
    }

    switch ((input + '').toLowerCase().trim()) {
      case 'true': case 'yes': case '1': return true;
      case 'false': case 'no': case '0': case null: return false;
    }

    return defaultValue;
  }
}
