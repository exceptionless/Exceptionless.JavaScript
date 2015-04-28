/// <reference path="references.ts" />

module Exceptionless {
  export class Utils {
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

    public static guid(): string {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }

      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    public static merge(defaultValues:any, values:any) {
      var result = {};

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

      var pairs = query.split('&');
      if (pairs.length === 0) {
        return null;
      }

      var result = {};
      for (var index = 0; index < pairs.length; index++) {
        var pair = pairs[index].split('=');
        result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }

      return result;
    }

    public static randomNumber(): number {
      return Math.floor(Math.random() * 9007199254740992);
    }

    public static stringify(data:any): string {
      var cache = [];

      return JSON.stringify(data, function(key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
          }

          cache.push(value);
        }

        return value;
      });
    }
  }
}
