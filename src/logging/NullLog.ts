/// <reference path="../references.ts" />

module Exceptionless {
  export class NullLog implements ILog {
    public info(message) {}
    public warn(message) {}
    public error(message) {}
  }
}
