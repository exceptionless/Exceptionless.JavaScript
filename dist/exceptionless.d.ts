/// <reference path="../typings/tsd.d.ts" />
/// <reference path="stacktrace.d.ts" />
declare module Exceptionless {
    class ExceptionlessClient {
        config: Configuration;
        constructor(apiKey?: string, serverUrl?: string);
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
        private getSettingsFromScriptTag();
        private static _instance;
        static default: ExceptionlessClient;
    }
    class Configuration {
        private _apiKey;
        private _enabled;
        private _serverUrl;
        private _plugins;
        lastReferenceIdManager: ILastReferenceIdManager;
        log: ILog;
        submissionBatchSize: number;
        submissionClient: ISubmissionClient;
        storage: IStorage<any>;
        queue: IEventQueue;
        defaultTags: string[];
        defaultData: Object;
        constructor(apiKey: string, serverUrl?: string);
        apiKey: string;
        serverUrl: string;
        enabled: boolean;
        plugins: IEventPlugin[];
        addPlugin(plugin: IEventPlugin): void;
        addPlugin(name: string, priority: number, pluginAction: (context: EventPluginContext) => void): void;
        removePlugin(plugin: IEventPlugin): void;
        removePlugin(name: string): void;
        useReferenceIds(): void;
    }
    interface ILog {
        info(message: string): any;
        warn(message: string): any;
        error(message: string): any;
    }
    class NullLog implements ILog {
        info(message: any): void;
        warn(message: any): void;
        error(message: any): void;
    }
    class ConsoleLog implements ILog {
        info(message: any): void;
        warn(message: any): void;
        error(message: any): void;
    }
    interface IEventQueue {
        enqueue(event: IEvent): any;
        process(): any;
        suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): any;
    }
    class EventQueue implements IEventQueue {
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
    interface ISubmissionClient {
        submit(events: IEvent[], config: Configuration): Promise<SubmissionResponse>;
        submitDescription(referenceId: string, description: IUserDescription, config: Configuration): Promise<SubmissionResponse>;
        getSettings(config: Configuration): Promise<SettingsResponse>;
    }
    class SubmissionClient implements ISubmissionClient {
        submit(events: IEvent[], config: Configuration): Promise<SubmissionResponse>;
        submitDescription(referenceId: string, description: IUserDescription, config: Configuration): Promise<SubmissionResponse>;
        getSettings(config: Configuration): Promise<SettingsResponse>;
        private getResponseMessage(xhr);
        private createRequest(method, url);
        private sendRequest(method, url, data?);
    }
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
    class SettingsResponse {
        success: boolean;
        settings: any;
        settingsVersion: number;
        message: string;
        exception: any;
        constructor(success: boolean, settings: any, settingsVersion?: number, exception?: any, message?: string);
    }
    interface IStorage<T> {
        save<T>(path: string, value: T): boolean;
        get(searchPattern?: string, limit?: number): T[];
        clear(searchPattern?: string): any;
        count(searchPattern?: string): number;
    }
    class InMemoryStorage<T> implements IStorage<T> {
        private _items;
        save<T>(path: string, value: T): boolean;
        get(searchPattern?: string, limit?: number): T[];
        clear(searchPattern?: string): void;
        count(searchPattern?: string): number;
    }
    interface ILastReferenceIdManager {
        getLast(): string;
        clearLast(): void;
        setLast(eventId: string): void;
    }
    class InMemoryLastReferenceIdManager implements ILastReferenceIdManager {
        private _lastReferenceId;
        getLast(): string;
        clearLast(): void;
        setLast(eventId: string): void;
    }
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
    class ContextData {
        setException(exception: Error): void;
        hasException: boolean;
        getException(): Error;
        markAsUnhandledError(): void;
        isUnhandledError: boolean;
        setSubmissionMethod(method: string): void;
        getSubmissionMethod(): string;
    }
    class EventPluginContext {
        client: ExceptionlessClient;
        event: IEvent;
        contextData: ContextData;
        cancel: boolean;
        constructor(client: ExceptionlessClient, event: IEvent, contextData?: ContextData);
        log: ILog;
    }
    interface IEventPlugin {
        priority?: number;
        name?: string;
        run(context: EventPluginContext): Promise<any>;
    }
    interface IUserDescription {
        email_address?: string;
        description?: string;
        data?: any;
    }
    class Utils {
        static getHashCode(source: string): string;
        static guid(): string;
        static parseVersion(source: string): string;
        static parseQueryString(query: string): {};
        static randomNumber(): number;
    }
}
