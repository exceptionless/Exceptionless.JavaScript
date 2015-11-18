export class Utils {
  public static addRange<T>(target:T[], ...values:T[]) {
    if (!target) {
      target = [];
    }

    if (!values || values.length === 0) {
      return target;
    }

    for (let index = 0; index < values.length; index++) {
      if (values[index] && target.indexOf(values[index]) < 0) {
        target.push(values[index]);
      }
    }

    return target;
  }

  public static getHashCode(source:string): number {
    if (!source || source.length === 0) {
      return 0;
    }

    let hash:number = 0;
    for (let index = 0; index < source.length; index++) {
      let character   = source.charCodeAt(index);
      hash  = ((hash << 5) - hash) + character;
      hash |= 0;
    }

    return hash;
  }

  public static getCookies(cookies:string, exclusions?:string[]): Object {
    let result:Object = {};

    let parts:string[] = (cookies || '').split('; ');
    for (let index = 0; index < parts.length; index++) {
      let cookie:string[] = parts[index].split('=');
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

  public static merge(defaultValues:Object, values:Object) {
    let result:Object = {};

    for (let key in defaultValues || {}) {
      if (!!defaultValues[key]) {
        result[key] = defaultValues[key];
      }
    }

    for (let key in values || {}) {
      if (!!values[key]) {
        result[key] = values[key];
      }
    }

    return result;
  }

  public static parseVersion(source:string): string {
    if (!source) {
      return null;
    }

    let versionRegex = /(v?((\d+)\.(\d+)(\.(\d+))?)(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?)/;
    let matches = versionRegex.exec(source);
    if (matches && matches.length > 0) {
      return matches[0];
    }

    return null;
  }

  public static parseQueryString(query:string, exclusions?:string[]) {
    if (!query || query.length === 0) {
      return null;
    }

    let pairs:string[] = query.split('&');
    if (pairs.length === 0) {
      return null;
    }

    let result:Object = {};
    for (let index = 0; index < pairs.length; index++) {
      let pair = pairs[index].split('=');
      if (!Utils.isMatch(pair[0], exclusions)) {
        result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
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
  public static isMatch(input:string, patterns:string[]):boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    let trim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    return (patterns || []).some(pattern => {
      if (!pattern) {
        return false;
      }

      pattern = pattern.toLowerCase().replace(trim, '');
      input = input.toLowerCase().replace(trim, '');

      if (pattern.length <= 0) {
        return false;
      }

      let startsWithWildcard:boolean = pattern[0] === '*';
      if (startsWithWildcard) {
        pattern = pattern.slice(1);
      }

      let endsWithWildcard:boolean = pattern[pattern.length - 1] === '*';
      if (endsWithWildcard) {
        pattern = pattern.substring(0, pattern.length - 1);
      }

      if (startsWithWildcard && endsWithWildcard) {
        return input.indexOf(pattern) !== -1;
      }

      if (startsWithWildcard) {
        return input.lastIndexOf(pattern) === (input.length - pattern.length);
      }

      if (endsWithWildcard) {
        return input.indexOf(pattern) === 0;
      }

      return input === pattern;
    });
  }

  public static isEmpty(input:Object) {
    return input === null || (typeof(input) === 'object' && Object.keys(input).length === 0);
  }

  /**
   * Stringifys an object with optional exclusions and max depth.
   * @param data The data object to add.
   * @param exclusions Any property names that should be excluded.
   * @param maxDepth The max depth of the object to include.
   */
  public static stringify(data:any, exclusions?:string[], maxDepth?:number): string {
    function stringifyImpl(obj:any, excludedKeys:string[]): string {
      let cache:string[] = [];
      return JSON.stringify(obj, function(key:string, value:any) {
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

    if (({}).toString.call(data) === '[object Array]') {
      let result = [];
      for (let index = 0; index < data.length; index++) {
        result[index] = JSON.parse(stringifyImpl(data[index], exclusions));
      }

      return JSON.stringify(result);
    }

    return stringifyImpl(data, exclusions);
  }
}
