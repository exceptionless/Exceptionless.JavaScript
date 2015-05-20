import { IStackFrame } from 'models/IStackFrame';

export class Utils {
  public static addRange<T>(target:T[], ...values:T[]) {
    if (!target) {
      target = [];
    }

    if (!values || values.length === 0) {
      return target;
    }

    for (var index = 0; index < values.length; index++) {
      if (values[index] && target.indexOf(values[index]) < 0) {
        target.push(values[index]);
      }
    }

    return target;
  }

  public static getHashCode(source:string): string {
    if (!source || source.length === 0) {
      return null;
    }

    var hash:number = 0;
    for (var index = 0; index < source.length; index++) {
      var character   = source.charCodeAt(index);
      hash  = ((hash << 5) - hash) + character;
      hash |= 0;
    }

    return hash.toString();
  }

  public static getCookies(cookies:string): Object {
    var result:Object = {};

    var parts:string[] = (cookies || '').split('; ');
    for (var index = 0; index < parts.length; index++) {
      var cookie:string[] = parts[index].split('=');
      result[cookie[0]] = cookie[1];
    }

    return result;
  }

  public static guid(): string {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  public static merge(defaultValues:Object, values:Object) {
    var result:Object = {};

    for (var key in defaultValues || {}) {
      if (!!defaultValues[key]) {
        result[key] = defaultValues[key];
      }
    }

    for (var key in values || {}) {
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

    var versionRegex = /(v?((\d+)\.(\d+)(\.(\d+))?)(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?)/;
    var matches = versionRegex.exec(source);
    if (matches && matches.length > 0) {
      return matches[0];
    }

    return null;
  }

  public static parseQueryString(query:string) {
    if (!query || query.length === 0) {
      return null;
    }

    var pairs:string[] = query.split('&');
    if (pairs.length === 0) {
      return null;
    }

    var result:Object = {};
    for (var index = 0; index < pairs.length; index++) {
      var pair = pairs[index].split('=');
      result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }

    return result;
  }

  public static randomNumber(): number {
    return Math.floor(Math.random() * 9007199254740992);
  }

  public static stringify(data:any, exclusions?:string[]): string {
    function checkForMatch(pattern:string, value:string): boolean {
      if (!pattern || !value || typeof value !== 'string') {
        return false;
      }

      var trim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
      pattern = pattern.toLowerCase().replace(trim, '');
      value = value.toLowerCase().replace(trim, '');

      if (pattern.length <= 0) {
        return false;
      }

      var startsWithWildcard:boolean = pattern[0] === '*';
      if (startsWithWildcard) {
        pattern = pattern.slice(1);
      }

      var endsWithWildcard:boolean = pattern[pattern.length - 1] === '*';
      if (endsWithWildcard) {
        pattern = pattern.substring(0, pattern.length - 1);
      }


      if (startsWithWildcard && endsWithWildcard)
        return value.indexOf(pattern) !== -1;

      if (startsWithWildcard)
        return value.lastIndexOf(pattern, 0) !== -1;

      if (endsWithWildcard)
        return value.lastIndexOf(pattern) === (value.length - pattern.length);

      return value === pattern;
    }

    function stringifyImpl(data:any, exclusions:string[]): string {
      var cache:string[] = [];
      return JSON.stringify(data, function(key:string, value:any) {
        for (var index = 0; index < (exclusions || []).length; index++) {
          if (checkForMatch(exclusions[index], key)){
            return;
          }
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

    if (toString.call(data) === '[object Array]') {
      var result = [];
      for (var index = 0; index < data.length; index++) {
        result[index] = JSON.parse(stringifyImpl(data[index], exclusions || []));
      }

      return JSON.stringify(result);
    }

    return stringifyImpl(data, exclusions || []);
  }
}
