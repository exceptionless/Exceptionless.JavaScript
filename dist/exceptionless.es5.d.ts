declare module Exceptionless {
    class Configuration implements IConfigurationSettings {
        private _apiKey;
        private _enabled;
        private _serverUrl;
        private _plugins;
        lastReferenceIdManager: ILastReferenceIdManager;
        log: ILog;
        submissionBatchSize: any;
        submissionClient: ISubmissionClient;
        storage: IStorage<any>;
        queue: IEventQueue;
        defaultTags: string[];
        defaultData: Object;
        constructor(settings?: IConfigurationSettings);
        apiKey: string;
        serverUrl: string;
        enabled: boolean;
        plugins: IEventPlugin[];
        addPlugin(plugin: IEventPlugin): void;
        addPlugin(name: string, priority: number, pluginAction: (context: EventPluginContext) => void): void;
        removePlugin(plugin: IEventPlugin): void;
        removePlugin(name: string): void;
        useReferenceIds(): void;
        private static _defaultSettings;
        static defaults: IConfigurationSettings;
    }
}
declare module Exceptionless {
    interface IConfigurationSettings {
        apiKey?: string;
        serverUrl?: string;
        lastReferenceIdManager?: ILastReferenceIdManager;
        log?: ILog;
        submissionBatchSize?: number;
        submissionClient?: ISubmissionClient;
        storage?: IStorage<any>;
        queue?: IEventQueue;
    }
}
declare module Exceptionless {
    interface ILastReferenceIdManager {
        getLast(): string;
        clearLast(): void;
        setLast(eventId: string): void;
    }
}
declare module Exceptionless {
    class InMemoryLastReferenceIdManager implements ILastReferenceIdManager {
        private _lastReferenceId;
        getLast(): string;
        clearLast(): void;
        setLast(eventId: string): void;
    }
}
declare module Exceptionless {
    class ConsoleLog implements ILog {
        info(message: any): void;
        warn(message: any): void;
        error(message: any): void;
    }
}
declare module Exceptionless {
    interface ILog {
        info(message: string): any;
        warn(message: string): any;
        error(message: string): any;
    }
}
declare module Exceptionless {
    class NullLog implements ILog {
        info(message: any): void;
        warn(message: any): void;
        error(message: any): void;
    }
}
declare module Exceptionless {
    interface IError extends IInnerError {
        modules?: IModule[];
    }
}
declare module Exceptionless {
    interface IEvent {
        type?: string;
        source?: string;
        date?: Date;
        tags?: string[];
        message?: string;
        geo?: string;
        value?: number;
        data?: any;
        reference_id?: string;
        session_id?: string;
    }
}
declare module Exceptionless {
    interface IInnerError {
        message?: string;
        type?: string;
        code?: string;
        data?: any;
        inner?: IInnerError;
        stack_trace?: IStackFrame[];
        target_method?: IMethod;
    }
}
declare module Exceptionless {
    interface IMethod {
        data?: any;
        generic_arguments?: string[];
        parameters?: IParameter[];
        is_signature_target?: boolean;
        declaring_namespace?: string;
        declaring_type?: string;
        name?: string;
        module_id?: number;
    }
}
declare module Exceptionless {
    interface IModule {
        data?: any;
        module_id?: number;
        name?: string;
        version?: string;
        is_entry?: boolean;
        created_date?: Date;
        modified_date?: Date;
    }
}
declare module Exceptionless {
    interface IParameter {
        data?: any;
        generic_arguments?: string[];
        name?: string;
        type?: string;
        type_namespace?: string;
    }
}
declare module Exceptionless {
    interface IRequestInfo {
        user_agent?: string;
        http_method?: string;
        is_secure?: boolean;
        host?: string;
        port?: number;
        path?: string;
        referrer?: string;
        client_ip_address?: string;
        cookies?: any;
        post_data?: any;
        query_string?: any;
        data?: any;
    }
}
declare module Exceptionless {
    interface IStackFrame extends IMethod {
        file_name: string;
        line_number: number;
        column: number;
    }
}
declare module Exceptionless {
    interface IUserDescription {
        email_address?: string;
        description?: string;
        data?: any;
    }
}
declare module Exceptionless {
    class ContextData {
        setException(exception: Error): void;
        hasException: boolean;
        getException(): Error;
        markAsUnhandledError(): void;
        isUnhandledError: boolean;
        setSubmissionMethod(method: string): void;
        getSubmissionMethod(): string;
    }
}
declare module Exceptionless {
    class EventPluginContext {
        client: ExceptionlessClient;
        event: IEvent;
        contextData: ContextData;
        cancel: boolean;
        constructor(client: ExceptionlessClient, event: IEvent, contextData?: ContextData);
        log: ILog;
    }
}
declare module Exceptionless {
    class EventPluginManager {
        static run(context: EventPluginContext): Promise<any>;
        static addDefaultPlugins(config: Configuration): void;
    }
}
declare module Exceptionless {
    interface IEventPlugin {
        priority?: number;
        name?: string;
        run(context: EventPluginContext): Promise<any>;
    }
}
declare module Exceptionless {
    class ConfigurationDefaultsPlugin implements IEventPlugin {
        priority: number;
        name: string;
        run(context: Exceptionless.EventPluginContext): Promise<any>;
    }
}
declare module Exceptionless {
    class DuplicateCheckerPlugin implements IEventPlugin {
        priority: number;
        name: string;
        run(context: Exceptionless.EventPluginContext): Promise<any>;
    }
}
declare module Exceptionless {
    class ErrorPlugin implements IEventPlugin {
        priority: number;
        name: string;
        run(context: Exceptionless.EventPluginContext): Promise<any>;
        private processError(context, exception, stackFrames);
        private onParseError(context);
        private getStackFrames(context, stackFrames);
    }
}
declare module StackTrace {
    interface StackTraceOptions {
        filter?: (stackFrame: StackFrame) => boolean;
        sourceCache?: {
            URL: string;
        };
        offline?: boolean;
    }
    interface StackFrame {
        constructor(functionName: string, args: any, fileName: string, lineNumber: number, columnNumber: number): any;
        functionName?: string;
        args?: any;
        fileName?: string;
        lineNumber?: number;
        columnNumber?: number;
        toString(): string;
    }
    function get(options: StackTraceOptions): Promise<StackFrame[]>;
    function fromError(error: Error, options?: StackTraceOptions): Promise<StackFrame[]>;
    function generateArtificially(options: StackTraceOptions): Promise<StackFrame[]>;
    function instrument(fn: () => void, callback: (stackFrames: StackFrame[]) => void, errorCallback: () => void, thisArg: any): void;
    function deinstrument(fn: () => void): void;
}
declare module Exceptionless {
    class ModuleInfoPlugin implements IEventPlugin {
        priority: number;
        name: string;
        run(context: Exceptionless.EventPluginContext): Promise<any>;
    }
}
declare module Exceptionless {
    class ReferenceIdPlugin implements IEventPlugin {
        priority: number;
        name: string;
        run(context: Exceptionless.EventPluginContext): Promise<any>;
    }
}
declare module Exceptionless {
    class RequestInfoPlugin implements IEventPlugin {
        priority: number;
        name: string;
        run(context: Exceptionless.EventPluginContext): Promise<any>;
        private getCookies();
    }
}
declare module Exceptionless {
    class SubmissionMethodPlugin implements IEventPlugin {
        priority: number;
        name: string;
        run(context: Exceptionless.EventPluginContext): Promise<any>;
    }
}
declare module Exceptionless {
    class DefaultEventQueue implements IEventQueue {
        private _config;
        private _suspendProcessingUntil;
        private _discardQueuedItemsUntil;
        private _processingQueue;
        private _queueTimer;
        constructor(config: Configuration);
        enqueue(event: IEvent): boolean;
        process(): void;
        private processSubmissionResponse(response, events);
        private ensureQueueTimer();
        private onProcessQueue();
        suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): void;
        private requeueEvents(events);
        private isQueueProcessingSuspended();
        private areQueuedItemsDiscarded();
        private queuePath();
    }
}
declare module Exceptionless {
    interface IEventQueue {
        enqueue(event: IEvent): any;
        process(): any;
        suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): any;
    }
}
declare module Exceptionless {
    class InMemoryStorage<T> implements IStorage<T> {
        private _items;
        save<T>(path: string, value: T): boolean;
        get(searchPattern?: string, limit?: number): T[];
        clear(searchPattern?: string): void;
        count(searchPattern?: string): number;
    }
}
declare module Exceptionless {
    interface IStorage<T> {
        save<T>(path: string, value: T): boolean;
        get(searchPattern?: string, limit?: number): T[];
        clear(searchPattern?: string): any;
        count(searchPattern?: string): number;
    }
}
declare module Exceptionless {
    class DefaultSubmissionClient implements ISubmissionClient {
        submit(events: IEvent[], config: Configuration): Promise<SubmissionResponse>;
        submitDescription(referenceId: string, description: IUserDescription, config: Configuration): Promise<SubmissionResponse>;
        getSettings(config: Configuration): Promise<SettingsResponse>;
        private getResponseMessage(xhr);
        private createRequest(method, url);
        private sendRequest(method, url, data?);
    }
}
declare var XDomainRequest: {
    new (): XDomainRequest;
    prototype: XDomainRequest;
    create(): XDomainRequest;
};
declare module Exceptionless {
    interface ISubmissionClient {
        submit(events: IEvent[], config: Configuration): Promise<SubmissionResponse>;
        submitDescription(referenceId: string, description: IUserDescription, config: Configuration): Promise<SubmissionResponse>;
        getSettings(config: Configuration): Promise<SettingsResponse>;
    }
}
declare module Exceptionless {
    class SettingsResponse {
        success: boolean;
        settings: any;
        settingsVersion: number;
        message: string;
        exception: any;
        constructor(success: boolean, settings: any, settingsVersion?: number, exception?: any, message?: string);
    }
}
declare module Exceptionless {
    class SubmissionResponse {
        success: boolean;
        badRequest: boolean;
        serviceUnavailable: boolean;
        paymentRequired: boolean;
        unableToAuthenticate: boolean;
        notFound: boolean;
        requestEntityTooLarge: boolean;
        statusCode: number;
        message: string;
        constructor(statusCode: number, message?: string);
    }
}
declare module Exceptionless {
    class EventBuilder {
        target: IEvent;
        client: ExceptionlessClient;
        pluginContextData: ContextData;
        constructor(event: IEvent, client: ExceptionlessClient, pluginContextData?: ContextData);
        setType(type: string): EventBuilder;
        setSource(source: string): EventBuilder;
        setSessionId(sessionId: string): EventBuilder;
        setReferenceId(referenceId: string): EventBuilder;
        setMessage(message: string): EventBuilder;
        setGeo(latitude: number, longitude: number): EventBuilder;
        setValue(value: number): EventBuilder;
        addTags(...tags: string[]): EventBuilder;
        setProperty(name: string, value: any): EventBuilder;
        markAsCritical(critical: boolean): EventBuilder;
        submit(): Promise<any>;
        private isValidIdentifier(value);
    }
}
declare module Exceptionless {
    class ExceptionlessClient {
        config: Configuration;
        constructor();
        constructor(settings: IConfigurationSettings);
        constructor(apiKey: string, serverUrl?: string);
        createException(exception: Error): EventBuilder;
        submitException(exception: Error): Promise<any>;
        createUnhandledException(exception: Error): EventBuilder;
        submitUnhandledException(exception: Error): Promise<any>;
        createFeatureUsage(feature: string): EventBuilder;
        submitFeatureUsage(feature: string): Promise<any>;
        createLog(message: string): EventBuilder;
        createLog(source: string, message: string): EventBuilder;
        createLog(source: string, message: string, level: string): EventBuilder;
        submitLog(message: string): Promise<any>;
        submitLog(source: string, message: string): Promise<any>;
        submitLog(source: string, message: string, level: string): Promise<any>;
        createNotFound(resource: string): EventBuilder;
        submitNotFound(resource: string): Promise<any>;
        createSessionStart(sessionId: string): EventBuilder;
        submitSessionStart(sessionId: string): Promise<any>;
        createSessionEnd(sessionId: string): EventBuilder;
        submitSessionEnd(sessionId: string): Promise<any>;
        createEvent(pluginContextData?: ContextData): EventBuilder;
        submitEvent(event: IEvent, pluginContextData?: ContextData): Promise<any>;
        getLastReferenceId(): string;
        register(): void;
        private static _instance;
        static default: ExceptionlessClient;
    }
}
declare module Exceptionless {
    class Utils {
        static getHashCode(source: string): string;
        static guid(): string;
        static merge(defaultValues: any, values: any): {};
        static parseVersion(source: string): string;
        static parseQueryString(query: string): {};
        static randomNumber(): number;
    }
}
