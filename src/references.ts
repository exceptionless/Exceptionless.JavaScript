/// <reference path="../typings/tsd.d.ts" />

/// <reference path="configuration/Configuration.ts" />
/// <reference path="configuration/IConfigurationSettings.ts" />
/// <reference path="lastReferenceIdManager/ILastReferenceIdManager.ts" />
/// <reference path="lastReferenceIdManager/InMemoryLastReferenceIdManager.ts" />
/// <reference path="logging/ConsoleLog.ts" />
/// <reference path="logging/ILog.ts" />
/// <reference path="logging/NullLog.ts" />
/// <reference path="models/IError.ts" />
/// <reference path="models/IEvent.ts" />
/// <reference path="models/IInnerError.ts" />
/// <reference path="models/IMethod.ts" />
/// <reference path="models/IModule.ts" />
/// <reference path="models/IParameter.ts" />
/// <reference path="models/IRequestInfo.ts" />
/// <reference path="models/IStackFrame.ts" />
/// <reference path="models/IUserDescription.ts" />
/// <reference path="plugins/ContextData.ts" />
/// <reference path="plugins/EventPluginContext.ts" />
/// <reference path="plugins/EventPluginManager.ts" />
/// <reference path="plugins/IEventPlugin.ts" />
/// <reference path="plugins/default/ConfigurationDefaultsPlugin.ts" />
/// <reference path="plugins/default/DuplicateCheckerPlugin.ts" />
/// <reference path="plugins/default/ErrorPlugin.ts" />
/// <reference path="plugins/default/ModuleInfoPlugin.ts" />
/// <reference path="plugins/default/ReferenceIdPlugin.ts" />
/// <reference path="plugins/default/RequestInfoPlugin.ts" />
/// <reference path="plugins/default/SubmissionMethodPlugin.ts" />
/// <reference path="queue/DefaultEventQueue.ts" />
/// <reference path="queue/IEventQueue.ts" />
/// <reference path="storage/InMemoryStorage.ts" />
/// <reference path="storage/IStorage.ts" />
/// <reference path="submission/DefaultSubmissionClient.ts" />
/// <reference path="submission/ISubmissionClient.ts" />
/// <reference path="submission/SettingsResponse.ts" />
/// <reference path="submission/SubmissionResponse.ts" />
/// <reference path="EventBuilder.ts" />
/// <reference path="ExceptionlessClient.ts" />
/// <reference path="Utils.ts" />

declare module StackTrace {
  interface StackTraceOptions {
    filter?: (stackFrame:StackFrame) => boolean;
    sourceCache?: { URL:string };
    offline?: boolean;
  }

  interface StackFrame {
    constructor(functionName:string, args:any, fileName:string, lineNumber:number, columnNumber:number);

    functionName?:string;
    args?:any;
    fileName?:string;
    lineNumber?:number;
    columnNumber?:number;
    toString():string;
  }

  /**
   * Get a backtrace from invocation point.
   * @param options Options Object
   * @return Array[StackFrame]
   */
  function get(options: StackTraceOptions): Promise<StackFrame[]>;

  /**
   * Given an error object, parse it.
   * @param error Error object
   * @param options Object for options
   * @return Array[StackFrame]
   */
  function fromError(error:Error, options?:StackTraceOptions): Promise<StackFrame[]>;

  /**
   * Use StackGenerator to generate a backtrace.
   * @param options Object options
   * @returns Array[StackFrame]
   */
  function generateArtificially(options: StackTraceOptions): Promise<StackFrame[]>;

  /**
   * Given a function, wrap it such that invocations trigger a callback that
   * is called with a stack trace.
   *
   * @param {Function} fn to be instrumented
   * @param {Function} callback function to call with a stack trace on invocation
   * @param {Function} errorCallback optional function to call with error if unable to get stack trace.
   * @param {Object} thisArg optional context object (e.g. window)
   */
  function instrument(fn:() => void, callback:(stackFrames:StackFrame[]) => void, errorCallback:() => void, thisArg:any): void;

  /**
   * Given a function that has been instrumented,
   * revert the function to it's original (non-instrumented) state.
   *
   * @param fn {Function}
   */
  function deinstrument(fn:() => void): void;
}
