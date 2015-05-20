export interface IBootstrapper {
    register(): void;
}
export interface ILastReferenceIdManager {
    getLast(): string;
    clearLast(): void;
    setLast(eventId: string): void;
}
export interface ILog {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
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
    enqueue(event: IEvent): void;
    process(): void;
    suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): void;
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
export declare class ContextData {
    setException(exception: Error): void;
    hasException: boolean;
    getException(): Error;
    markAsUnhandledError(): void;
    isUnhandledError: boolean;
    setSubmissionMethod(method: string): void;
    getSubmissionMethod(): string;
}
export interface IEnvironmentInfoCollector {
    getEnvironmentInfo(context: EventPluginContext): IEnvironmentInfo;
}
export interface IErrorParser {
    parse(context: EventPluginContext, exception: Error): void;
}
export interface IModuleCollector {
    getModules(context: EventPluginContext): IModule[];
}
export interface IRequestInfoCollector {
    getRequestInfo(context: EventPluginContext): IRequestInfo;
}
export interface IStorage<T> {
    save<T>(path: string, value: T): boolean;
    get(searchPattern?: string, limit?: number): T[];
    clear(searchPattern?: string): void;
    count(searchPattern?: string): number;
}
export interface ISubmissionClient {
    postEvents(events: IEvent[], config: Configuration, callback: (response: SubmissionResponse) => void): void;
    postUserDescription(referenceId: string, description: IUserDescription, config: Configuration, callback: (response: SubmissionResponse) => void): void;
    getSettings(config: Configuration, callback: (response: SettingsResponse) => void): void;
}
export interface IConfigurationSettings {
    apiKey?: string;
    serverUrl?: string;
    environmentInfoCollector?: IEnvironmentInfoCollector;
    errorParser?: IErrorParser;
    lastReferenceIdManager?: ILastReferenceIdManager;
    log?: ILog;
    moduleCollector?: IModuleCollector;
    requestInfoCollector?: IRequestInfoCollector;
    submissionBatchSize?: number;
    submissionClient?: ISubmissionClient;
    storage?: IStorage<any>;
    queue?: IEventQueue;
}
export declare class SettingsManager {
    private static _configPath;
    private static _handlers;
    private static changed(config);
    static onChanged(handler: (config: Configuration) => void): void;
    static applySavedServerSettings(config: Configuration): void;
    private static getSavedServerSettings(config);
    static checkVersion(version: number, config: Configuration): void;
    static updateSettings(config: Configuration): void;
}
export declare class InMemoryLastReferenceIdManager implements ILastReferenceIdManager {
    private _lastReferenceId;
    getLast(): string;
    clearLast(): void;
    setLast(eventId: string): void;
}
export declare class ConsoleLog implements ILog {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    private log(level, message);
}
export declare class NullLog implements ILog {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
export interface IUserInfo {
    identity?: string;
    name?: string;
    data?: any;
}
export interface IEventPlugin {
    priority?: number;
    name?: string;
    run(context: EventPluginContext, next?: () => void): void;
}
export declare class EventPluginContext {
    cancelled: boolean;
    client: ExceptionlessClient;
    event: IEvent;
    contextData: ContextData;
    constructor(client: ExceptionlessClient, event: IEvent, contextData?: ContextData);
    log: ILog;
}
export declare class EventPluginManager {
    static run(context: EventPluginContext, callback: (context?: EventPluginContext) => void): void;
    static addDefaultPlugins(config: Configuration): void;
}
export declare class ReferenceIdPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext, next?: () => void): void;
}
export declare class DefaultEventQueue implements IEventQueue {
    private _config;
    private _suspendProcessingUntil;
    private _discardQueuedItemsUntil;
    private _processingQueue;
    private _queueTimer;
    constructor(config: Configuration);
    enqueue(event: IEvent): void;
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
export declare class Utils {
    static addRange<T>(target: T[], ...values: T[]): T[];
    static getHashCode(source: string): string;
    static getCookies(cookies: string): Object;
    static guid(): string;
    static merge(defaultValues: Object, values: Object): Object;
    static parseVersion(source: string): string;
    static parseQueryString(query: string): Object;
    static randomNumber(): number;
    static stringify(data: any, exclusions?: string[]): string;
}
export declare class Configuration implements IConfigurationSettings {
    private _apiKey;
    private _enabled;
    private _serverUrl;
    private _dataExclusions;
    private _plugins;
    defaultTags: string[];
    defaultData: Object;
    environmentInfoCollector: IEnvironmentInfoCollector;
    errorParser: IErrorParser;
    lastReferenceIdManager: ILastReferenceIdManager;
    log: ILog;
    moduleCollector: IModuleCollector;
    requestInfoCollector: IRequestInfoCollector;
    submissionBatchSize: number;
    submissionClient: ISubmissionClient;
    settings: Object;
    storage: IStorage<Object>;
    queue: IEventQueue;
    constructor(configSettings?: IConfigurationSettings);
    apiKey: string;
    isValid: boolean;
    serverUrl: string;
    enabled: boolean;
    dataExclusions: string[];
    addDataExclusions(...exclusions: string[]): void;
    plugins: IEventPlugin[];
    addPlugin(plugin: IEventPlugin): void;
    addPlugin(name: string, priority: number, pluginAction: (context: EventPluginContext, next?: () => void) => void): void;
    removePlugin(plugin: IEventPlugin): void;
    removePlugin(name: string): void;
    setVersion(version: string): void;
    setUserIdentity(userInfo: IUserInfo): void;
    setUserIdentity(identity: string): void;
    setUserIdentity(identity: string, name: string): void;
    userAgent: string;
    useReferenceIds(): void;
    useDebugLogger(): void;
    private static _defaultSettings;
    static defaults: IConfigurationSettings;
}
export declare class EventBuilder {
    private _validIdentifierErrorMessage;
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
    setUserIdentity(userInfo: IUserInfo): EventBuilder;
    setUserIdentity(identity: string): EventBuilder;
    setUserIdentity(identity: string, name: string): EventBuilder;
    setValue(value: number): EventBuilder;
    addTags(...tags: string[]): EventBuilder;
    setProperty(name: string, value: any): EventBuilder;
    markAsCritical(critical: boolean): EventBuilder;
    addRequestInfo(request: Object): EventBuilder;
    submit(callback?: (context: EventPluginContext) => void): void;
    private isValidIdentifier(value);
}
export interface IError extends IInnerError {
    modules?: IModule[];
}
export interface IUserDescription {
    email_address?: string;
    description?: string;
    data?: any;
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
export declare class ExceptionlessClient {
    config: Configuration;
    constructor();
    constructor(settings: IConfigurationSettings);
    constructor(apiKey: string, serverUrl?: string);
    createException(exception: Error): EventBuilder;
    submitException(exception: Error, callback?: (context: EventPluginContext) => void): void;
    createUnhandledException(exception: Error, submissionMethod?: string): EventBuilder;
    submitUnhandledException(exception: Error, submissionMethod?: string, callback?: (context: EventPluginContext) => void): void;
    createFeatureUsage(feature: string): EventBuilder;
    submitFeatureUsage(feature: string, callback?: (context: EventPluginContext) => void): void;
    createLog(message: string): EventBuilder;
    createLog(source: string, message: string): EventBuilder;
    createLog(source: string, message: string, level: string): EventBuilder;
    submitLog(message: string): void;
    submitLog(source: string, message: string): void;
    submitLog(source: string, message: string, level: string, callback?: (context: EventPluginContext) => void): void;
    createNotFound(resource: string): EventBuilder;
    submitNotFound(resource: string, callback?: (context: EventPluginContext) => void): void;
    createSessionStart(sessionId: string): EventBuilder;
    submitSessionStart(sessionId: string, callback?: (context: EventPluginContext) => void): void;
    createSessionEnd(sessionId: string): EventBuilder;
    submitSessionEnd(sessionId: string, callback?: (context: EventPluginContext) => void): void;
    createEvent(pluginContextData?: ContextData): EventBuilder;
    submitEvent(event: IEvent, pluginContextData?: ContextData, callback?: (context: EventPluginContext) => void): void;
    updateUserEmailAndDescription(referenceId: string, email: string, description: string, callback?: (response: SubmissionResponse) => void): void;
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
    file_name?: string;
    line_number?: number;
    column?: number;
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
    run(context: EventPluginContext, next?: () => void): void;
}
export declare class ErrorPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext, next?: () => void): void;
}
export declare class DuplicateCheckerPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext, next?: () => void): void;
}
export declare class ModuleInfoPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext, next?: () => void): void;
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
    run(context: EventPluginContext, next?: () => void): void;
}
export declare class EnvironmentInfoPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext, next?: () => void): void;
}
export declare class SubmissionMethodPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext, next?: () => void): void;
}
export declare class SettingsResponse {
    success: boolean;
    settings: any;
    settingsVersion: number;
    message: string;
    exception: any;
    constructor(success: boolean, settings: any, settingsVersion?: number, exception?: any, message?: string);
}
export declare class NodeEnvironmentInfoCollector implements IEnvironmentInfoCollector {
    getEnvironmentInfo(context: EventPluginContext): IEnvironmentInfo;
    private getIpAddresses();
}
export declare class NodeErrorParser implements IErrorParser {
    parse(context: EventPluginContext, exception: Error): void;
    private getStackFrames(context, stackFrames);
}
export declare class NodeRequestInfoCollector implements IRequestInfoCollector {
    getRequestInfo(context: EventPluginContext): IRequestInfo;
}
export interface IClientConfiguration {
    settings: Object;
    version: number;
}
export declare class SubmissionClientBase implements ISubmissionClient {
    configurationVersionHeader: string;
    postEvents(events: IEvent[], config: Configuration, callback: (response: SubmissionResponse) => void): void;
    postUserDescription(referenceId: string, description: IUserDescription, config: Configuration, callback: (response: SubmissionResponse) => void): void;
    getSettings(config: Configuration, callback: (response: SettingsResponse) => void): void;
    sendRequest(config: Configuration, method: string, path: string, data: string, callback: (status: number, message: string, data?: string, headers?: Object) => void): void;
}
export declare class NodeSubmissionClient extends SubmissionClientBase {
    constructor();
    sendRequest(config: Configuration, method: string, path: string, data: string, callback: (status: number, message: string, data?: string, headers?: Object) => void): void;
}
export declare class NodeBootstrapper implements IBootstrapper {
    register(): void;
    private getExitCodeReason(code);
}
export declare class WebErrorParser implements IErrorParser {
    parse(context: EventPluginContext, exception: Error): void;
    private getStackFrames(context, stackFrames);
    private getParameters(parameters);
}
export declare class WebModuleCollector implements IModuleCollector {
    getModules(context: EventPluginContext): IModule[];
}
export declare class WebRequestInfoCollector implements IRequestInfoCollector {
    getRequestInfo(context: EventPluginContext): IRequestInfo;
}
export declare class DefaultSubmissionClient extends SubmissionClientBase {
    private createRequest(config, method, url);
    sendRequest(config: Configuration, method: string, path: string, data: string, callback: (status: number, message: string, data?: string, headers?: Object) => void): void;
}
export declare class WindowBootstrapper implements IBootstrapper {
    register(): void;
    private getDefaultsSettingsFromScriptTag();
    private processUnhandledException(stackTrace, options?);
    private processJQueryAjaxError(event, xhr, settings, error);
}
