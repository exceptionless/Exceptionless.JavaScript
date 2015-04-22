/// <reference path="../../references.ts" />

module Exceptionless {
  export class DuplicateCheckerPlugin implements IEventPlugin {
    public priority:number = 50;
    public name:string = 'DuplicateCheckerPlugin';

    run(context:Exceptionless.EventPluginContext):Promise<any> {
      // TODO: Implement
      return Promise.resolve();
    }
  }
}
