/// <reference path="../references.ts" />

module Exceptionless {
  export interface ISubmissionClient {
    submit(events:IEvent[], config:Configuration): Promise<SubmissionResponse>;
    submitDescription(referenceId:string, description:IUserDescription, config:Configuration): Promise<SubmissionResponse>;
    getSettings(config:Configuration): Promise<SettingsResponse>;
  }
}
