/// <reference path="../references.ts" />

module Exceptionless {
  export interface IEventPlugin {
    priority?:number;
    name?:string;
    run(context:EventPluginContext): Promise<any>;
  }
}
