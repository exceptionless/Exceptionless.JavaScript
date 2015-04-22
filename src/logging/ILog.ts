/// <reference path="../references.ts" />

module Exceptionless {
  export interface ILog {
    info(message:string);
    warn(message:string);
    error(message:string);
  }
}
