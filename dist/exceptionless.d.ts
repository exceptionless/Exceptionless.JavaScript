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
export interface IEventQueue {
    enqueue(event: IEvent): void;
    process(isAppExiting?: boolean): void;
    suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): void;
}
export interface IEnvironmentInfoCollector {
    getEnvironmentInfo(context: EventPluginContext): IEnvironmentInfo;
}
export interface IErrorParser {
    parse(context: EventPluginContext, exception: Error): IError;
}
export interface IModuleCollector {
    getModules(context: EventPluginContext): IModule[];
}
export interface IRequestInfoCollector {
    getRequestInfo(context: EventPluginContext): IRequestInfo;
}
export interface IStorageProvider {
    queue: IStorage;
    settings: IStorage;
}
export interface ISubmissionAdapter {
    sendRequest(request: SubmissionRequest, callback?: SubmissionCallback, isAppExiting?: boolean): void;
}
export interface ISubmissionClient {
    postEvents(events: IEvent[], config: Configuration, callback: (response: SubmissionResponse) => void, isAppExiting?: boolean): void;
    postUserDescription(referenceId: string, description: IUserDescription, config: Configuration, callback: (response: SubmissionResponse) => void): void;
    getSettings(config: Configuration, callback: (response: SettingsResponse) => void): void;
    sendHeartbeat(sessionIdOrUserId: string, closeSession: boolean, config: Configuration): void;
}
export interface IConfigurationSettings {
    apiKey?: string;
    serverUrl?: string;
    heartbeatServerUrl?: string;
    environmentInfoCollector?: IEnvironmentInfoCollector;
    errorParser?: IErrorParser;
    lastReferenceIdManager?: ILastReferenceIdManager;
    log?: ILog;
    moduleCollector?: IModuleCollector;
    requestInfoCollector?: IRequestInfoCollector;
    submissionBatchSize?: number;
    submissionClient?: ISubmissionClient;
    submissionAdapter?: ISubmissionAdapter;
    storage?: IStorageProvider;
    queue?: IEventQueue;
}
export declare class SettingsManager {
    private static _handlers;
    static onChanged(handler: (config: Configuration) => void): void;
    static applySavedServerSettings(config: Configuration): void;
    static checkVersion(version: number, config: Configuration): void;
    static updateSettings(config: Configuration): void;
    private static changed(config);
    private static getSavedServerSettings(config);
}
export declare class DefaultLastReferenceIdManager implements ILastReferenceIdManager {
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
export declare class HeartbeatPlugin implements IEventPlugin {
    priority: number;
    name: string;
    private _interval;
    private _intervalId;
    constructor(heartbeatInterval?: number);
    run(context: EventPluginContext, next?: () => void): void;
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
    process(isAppExiting?: boolean): void;
    suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): void;
    private areQueuedItemsDiscarded();
    private ensureQueueTimer();
    private isQueueProcessingSuspended();
    private onProcessQueue();
    private processSubmissionResponse(response, events);
    private removeEvents(events);
}
export declare class InMemoryStorageProvider implements IStorageProvider {
    queue: IStorage;
    settings: IStorage;
    constructor(maxQueueItems?: number);
}
export declare class DefaultSubmissionClient implements ISubmissionClient {
    configurationVersionHeader: string;
    postEvents(events: IEvent[], config: Configuration, callback: (response: SubmissionResponse) => void, isAppExiting?: boolean): void;
    postUserDescription(referenceId: string, description: IUserDescription, config: Configuration, callback: (response: SubmissionResponse) => void): void;
    getSettings(config: Configuration, callback: (response: SettingsResponse) => void): void;
    sendHeartbeat(sessionIdOrUserId: string, closeSession: boolean, config: Configuration): void;
    private createRequest(config, method, url, data?);
    private createSubmissionCallback(config, callback);
}
export declare class Utils {
    static addRange<T>(target: T[], ...values: T[]): T[];
    static getHashCode(source: string): number;
    static getCookies(cookies: string, exclusions?: string[]): Object;
    static guid(): string;
    static merge(defaultValues: Object, values: Object): Object;
    static parseVersion(source: string): string;
    static parseQueryString(query: string, exclusions?: string[]): Object;
    static randomNumber(): number;
    static isMatch(input: string, patterns: string[], ignoreCase?: boolean): boolean;
    static isEmpty(input: Object): boolean;
    static startsWith(input: string, prefix: string): boolean;
    static endsWith(input: string, suffix: string): boolean;
    static stringify(data: any, exclusions?: string[], maxDepth?: number): string;
}
export declare class Configuration implements IConfigurationSettings {
    private static _defaultSettings;
    defaultTags: string[];
    defaultData: Object;
    enabled: boolean;
    environmentInfoCollector: IEnvironmentInfoCollector;
    errorParser: IErrorParser;
    lastReferenceIdManager: ILastReferenceIdManager;
    log: ILog;
    moduleCollector: IModuleCollector;
    requestInfoCollector: IRequestInfoCollector;
    submissionBatchSize: number;
    submissionAdapter: ISubmissionAdapter;
    submissionClient: ISubmissionClient;
    settings: Object;
    storage: IStorageProvider;
    queue: IEventQueue;
    private _plugins;
    constructor(configSettings?: IConfigurationSettings);
    private _apiKey;
    apiKey: string;
    isValid: boolean;
    private _serverUrl;
    serverUrl: string;
    private _heartbeatServerUrl;
    heartbeatServerUrl: string;
    private _dataExclusions;
    private _userAgentBotPatterns;
    dataExclusions: string[];
    addDataExclusions(...exclusions: string[]): void;
    userAgentBotPatterns: string[];
    addUserAgentBotPatterns(...userAgentBotPatterns: string[]): void;
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
    useSessions(sendHeartbeats?: boolean, heartbeatInterval?: number): void;
    useReferenceIds(): void;
    useLocalStorage(): void;
    useDebugLogger(): void;
    static defaults: IConfigurationSettings;
}
export declare class EventBuilder {
    target: IEvent;
    client: ExceptionlessClient;
    pluginContextData: ContextData;
    private _validIdentifierErrorMessage;
    constructor(event: IEvent, client: ExceptionlessClient, pluginContextData?: ContextData);
    setType(type: string): EventBuilder;
    setSource(source: string): EventBuilder;
    setReferenceId(referenceId: string): EventBuilder;
    setEventReference(name: string, id: string): EventBuilder;
    setMessage(message: string): EventBuilder;
    setGeo(latitude: number, longitude: number): EventBuilder;
    setUserIdentity(userInfo: IUserInfo): EventBuilder;
    setUserIdentity(identity: string): EventBuilder;
    setUserIdentity(identity: string, name: string): EventBuilder;
    setUserDescription(emailAddress: string, description: string): EventBuilder;
    setManualStackingInfo(signatureData: any, title?: string): this;
    setManualStackingKey(manualStackingKey: string, title?: string): EventBuilder;
    setValue(value: number): EventBuilder;
    addTags(...tags: string[]): EventBuilder;
    setProperty(name: string, value: any, maxDepth?: number, excludedPropertyNames?: string[]): EventBuilder;
    markAsCritical(critical: boolean): EventBuilder;
    addRequestInfo(request: Object): EventBuilder;
    submit(callback?: (context: EventPluginContext) => void): void;
    private isValidIdentifier(value);
}
export interface IUserDescription {
    email_address?: string;
    description?: string;
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
    private static _instance;
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
    createSessionStart(): EventBuilder;
    submitSessionStart(callback?: (context: EventPluginContext) => void): void;
    submitSessionEnd(sessionIdOrUserId: string): void;
    submitSessionHeartbeat(sessionIdOrUserId: string): void;
    createEvent(pluginContextData?: ContextData): EventBuilder;
    submitEvent(event: IEvent, pluginContextData?: ContextData, callback?: (context: EventPluginContext) => void): void;
    updateUserEmailAndDescription(referenceId: string, email: string, description: string, callback?: (response: SubmissionResponse) => void): void;
    getLastReferenceId(): string;
    static default: ExceptionlessClient;
}
export interface IManualStackingInfo {
    title?: string;
    signature_data?: any;
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
export declare class SettingsResponse {
    success: boolean;
    settings: any;
    settingsVersion: number;
    message: string;
    exception: any;
    constructor(success: boolean, settings: any, settingsVersion?: number, exception?: any, message?: string);
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
export declare class ModuleInfoPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext, next?: () => void): void;
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
export declare class DuplicateCheckerPlugin implements IEventPlugin {
    priority: number;
    name: string;
    private _processedHashcodes;
    private _getCurrentTime;
    constructor(getCurrentTime?: () => number);
    run(context: EventPluginContext, next?: () => void): void;
}
export declare class EventExclusionPlugin implements IEventPlugin {
    priority: number;
    name: string;
    run(context: EventPluginContext, next?: () => void): void;
}
export declare class UpdateConfigurationSettingsWhileIdlePlugin implements IEventPlugin {
    priority: number;
    name: string;
    private _config;
    private _interval;
    private _intervalId;
    constructor(config: Configuration, interval?: number);
    run(context: EventPluginContext, next?: () => void): void;
}
export interface IError extends IInnerError {
    modules?: IModule[];
}
export interface IStorageItem {
    timestamp: number;
    value: any;
}
export interface IStorage {
    save(value: any): number;
    get(limit?: number): IStorageItem[];
    remove(timestamp: number): void;
    clear(): void;
}
export interface SubmissionCallback {
    (status: number, message: string, data?: string, headers?: Object): void;
}
export interface SubmissionRequest {
    apiKey: string;
    userAgent: string;
    method: string;
    url: string;
    data: string;
}
export declare class InMemoryStorage implements IStorage {
    private maxItems;
    private items;
    private lastTimestamp;
    constructor(maxItems: number);
    save(value: any): number;
    get(limit?: number): IStorageItem[];
    remove(timestamp: number): void;
    clear(): void;
}
export interface IClientConfiguration {
    settings: Object;
    version: number;
}
export declare abstract class KeyValueStorageBase implements IStorage {
    private maxItems;
    private items;
    private lastTimestamp;
    constructor(maxItems: any);
    save(value: any, single?: boolean): number;
    get(limit?: number): IStorageItem[];
    remove(timestamp: number): void;
    clear(): void;
    protected abstract write(key: string, value: string): void;
    protected abstract read(key: string): string;
    protected abstract readAllKeys(): string[];
    protected abstract delete(key: string): any;
    protected abstract getKey(timestamp: number): string;
    protected abstract getTimestamp(key: string): number;
    private ensureIndex();
    private safeDelete(key);
    private createIndex();
}
export declare class BrowserStorage extends KeyValueStorageBase {
    private prefix;
    static isAvailable(): boolean;
    constructor(namespace: string, prefix?: string, maxItems?: number);
    write(key: string, value: string): void;
    read(key: string): any;
    readAllKeys(): string[];
    delete(key: string): void;
    getKey(timestamp: any): string;
    getTimestamp(key: any): number;
}
export declare class DefaultErrorParser implements IErrorParser {
    parse(context: EventPluginContext, exception: Error): IError;
}
export declare class DefaultModuleCollector implements IModuleCollector {
    getModules(context: EventPluginContext): IModule[];
}
export declare class DefaultRequestInfoCollector implements IRequestInfoCollector {
    getRequestInfo(context: EventPluginContext): IRequestInfo;
}
export declare class DefaultSubmissionAdapter implements ISubmissionAdapter {
    sendRequest(request: SubmissionRequest, callback?: SubmissionCallback, isAppExiting?: boolean): void;
}
export declare class BrowserStorageProvider implements IStorageProvider {
    queue: IStorage;
    settings: IStorage;
    constructor(prefix?: string, maxQueueItems?: number);
}
