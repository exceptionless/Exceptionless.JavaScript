/// <reference path="../references.ts" />

module Exceptionless {
  export interface IError extends IInnerError {
    modules?:IModule[]
  }
}
