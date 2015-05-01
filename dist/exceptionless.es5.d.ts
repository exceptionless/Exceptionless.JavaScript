export interface IBootstrapper {
    register(): void;
}
export interface ILastReferenceIdManager {
    getLast(): string;
    clearLast(): void;
    setLast(eventId: string): void;
}
export interface ILog {
    info(message: string): any;
    warn(message: string): any;
    error(message: string): any;
}
export interface IEvent {
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
export interface IEventQueue {
    enqueue(event: IEvent): any;
    process(): any;
    suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): any;
}
export interface IStorage<T> {
    save<T>(path: string, value: T): boolean;
    get(searchPattern?: string, limit?: number): T[];
    clear(searchPattern?: string): any;
    count(searchPattern?: string): number;
}
export interface IConfigurationSettings {
    apiKey?: string;
    serverUrl?: string;
    lastReferenceIdManager?: ILastReferenceIdManager;
    log?: ILog;
    submissionBatchSize?: number;
    submissionClient?: ISubmissionClient;
    storage?: IStorage<any>;
    queue?: IEventQueue;
}
export declare class InMemoryLastReferenceIdManager implements ILastReferenceIdManager {
    private _lastReferenceId;
    getLast(): string;
    clearLast(): void;
    setLast(eventId: string): void;
}
export declare class ConsoleLog implements ILog {
    info(message: any): void;
    warn(message: any): void;
    error(message: any): void;
}
export declare class NullLog implements ILog {
    info(message: any): void;
    warn(message: any): void;
    error(message: any): void;
}
export interface IEventPlugin {
    priority?: number;
    name?: string;
    run(context: EventPluginContext): Promise<any>;
}
export declare class EventPluginContext {
    client: ExceptionlessClient;
    event: IEvent;
    contextData: ContextData;
    cancel: boolean;
    constructor(client: ExceptionlessClient, event: IEvent, contextData?: ContextData);
    log: ILog;
}
export declare class EventPluginManager {
    static run(context: EventPluginContext): Promise<any>;
    static addDefaultPlugins(config: Configuration): void;
}
export declare class ReferenceIdPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext): Promise<any>;
}
export declare class DefaultEventQueue implements IEventQueue {
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
export declare class InMemoryStorage<T> implements IStorage<T> {
    private _items;
    save<T>(path: string, value: T): boolean;
    get(searchPattern?: string, limit?: number): T[];
    clear(searchPattern?: string): void;
    count(searchPattern?: string): number;
}
export interface ISubmissionClient {
    submit(events: IEvent[], config: Configuration): Promise<SubmissionResponse>;
    submitDescription(referenceId: string, description: IUserDescription, config: Configuration): Promise<SubmissionResponse>;
    getSettings(config: Configuration): Promise<SettingsResponse>;
}
export declare class Utils {
    static getHashCode(source: string): string;
    static guid(): string;
    static merge(defaultValues: any, values: any): {};
    static parseVersion(source: string): string;
    static parseQueryString(query: string): {};
    static randomNumber(): number;
    static stringify(data: any): string;
}
export declare class Configuration implements IConfigurationSettings {
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
    setVersion(version: string): void;
    useReferenceIds(): void;
    useDebugLogger(): void;
    private static _defaultSettings;
    static defaults: IConfigurationSettings;
}
export interface IUserDescription {
    email_address?: string;
    description?: string;
    data?: any;
}
export declare class SettingsResponse {
    success: boolean;
    settings: any;
    settingsVersion: number;
    message: string;
    exception: any;
    constructor(success: boolean, settings: any, settingsVersion?: number, exception?: any, message?: string);
}
export declare class SubmissionResponse {
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
export declare class ContextData {
    setException(exception: Error): void;
    hasException: boolean;
    getException(): Error;
    markAsUnhandledError(): void;
    isUnhandledError: boolean;
    setSubmissionMethod(method: string): void;
    getSubmissionMethod(): string;
}
export declare class EventBuilder {
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
export interface IError extends IInnerError {
    modules?: IModule[];
}
export declare class ExceptionlessClient {
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
    private static _instance;
    static default: ExceptionlessClient;
}
export interface IParameter {
    data?: any;
    generic_arguments?: string[];
    name?: string;
    type?: string;
    type_namespace?: string;
}
export interface IMethod {
    data?: any;
    generic_arguments?: string[];
    parameters?: IParameter[];
    is_signature_target?: boolean;
    declaring_namespace?: string;
    declaring_type?: string;
    name?: string;
    module_id?: number;
}
export interface IStackFrame extends IMethod {
    file_name: string;
    line_number: number;
    column: number;
}
export interface IInnerError {
    message?: string;
    type?: string;
    code?: string;
    data?: any;
    inner?: IInnerError;
    stack_trace?: IStackFrame[];
    target_method?: IMethod;
}
export interface IModule {
    data?: any;
    module_id?: number;
    name?: string;
    version?: string;
    is_entry?: boolean;
    created_date?: Date;
    modified_date?: Date;
}
export declare class ConfigurationDefaultsPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext): Promise<any>;
}
export declare class ErrorPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext): Promise<any>;
    private processError(context, exception, stackFrames);
    private onParseError(context);
    private getStackFrames(context, stackFrames);
}
export declare class DuplicateCheckerPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext): Promise<any>;
}
export declare class ModuleInfoPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext): Promise<any>;
    private getFromDocument();
}
export interface IRequestInfo {
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
export declare class RequestInfoPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext): Promise<any>;
    private getCookies();
}
export declare class SubmissionMethodPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext): Promise<any>;
}
export declare class NodeSubmissionClient implements ISubmissionClient {
    submit(events: IEvent[], config: Configuration): Promise<SubmissionResponse>;
    submitDescription(referenceId: string, description: IUserDescription, config: Configuration): Promise<SubmissionResponse>;
    getSettings(config: Configuration): Promise<SettingsResponse>;
    private getResponseMessage(msg);
    private sendRequest(method, host, path, data?);
}
export declare class NodeBootstrapper implements IBootstrapper {
    register(): void;
    private isNode();
}
export declare class DefaultSubmissionClient implements ISubmissionClient {
    submit(events: IEvent[], config: Configuration): Promise<SubmissionResponse>;
    submitDescription(referenceId: string, description: IUserDescription, config: Configuration): Promise<SubmissionResponse>;
    getSettings(config: Configuration): Promise<SettingsResponse>;
    private getResponseMessage(xhr);
    private createRequest(method, url);
    private sendRequest(method, url, data?);
}
export declare class WindowBootstrapper implements IBootstrapper {
    register(): void;
    private getDefaultsSettingsFromScriptTag();
    private handleWindowOnError();
}
export interface IEnvironmentInfo {
    processor_count?: number;
    total_physical_memory?: number;
    available_physical_memory?: number;
    command_line?: string;
    process_name?: string;
    process_id?: string;
    process_memory_size?: number;
    thread_id?: string;
    architecture?: string;
    o_s_name?: string;
    o_s_version?: string;
    ip_address?: string;
    machine_name?: string;
    install_id?: string;
    runtime_version?: string;
    data?: any;
}
export interface IEnvironmentInfoCollector {
    GetEnvironmentInfo(): IEnvironmentInfo;
}
export declare class NodeEnvironmentInfoCollector implements IEnvironmentInfoCollector {
    GetEnvironmentInfo(): IEnvironmentInfo;
    private getIpAddresses();
}
