var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ContextData = (function () {
    function ContextData() {
    }
    ContextData.prototype.setException = function (exception) {
        if (exception) {
            this['@@_Exception'] = exception;
        }
    };
    Object.defineProperty(ContextData.prototype, "hasException", {
        get: function () {
            return !!this['@@_Exception'];
        },
        enumerable: true,
        configurable: true
    });
    ContextData.prototype.getException = function () {
        return this['@@_Exception'] || null;
    };
    ContextData.prototype.markAsUnhandledError = function () {
        this['@@_IsUnhandledError'] = true;
    };
    Object.defineProperty(ContextData.prototype, "isUnhandledError", {
        get: function () {
            return !!this['@@_IsUnhandledError'];
        },
        enumerable: true,
        configurable: true
    });
    ContextData.prototype.setSubmissionMethod = function (method) {
        if (method) {
            this['@@_SubmissionMethod'] = method;
        }
    };
    ContextData.prototype.getSubmissionMethod = function () {
        return this['@@_SubmissionMethod'] || null;
    };
    return ContextData;
})();
exports.ContextData = ContextData;
var SettingsManager = (function () {
    function SettingsManager() {
    }
    SettingsManager.changed = function (config) {
        var handlers = this._handlers;
        for (var index = 0; index < handlers.length; index++) {
            handlers[index](config);
        }
    };
    SettingsManager.onChanged = function (handler) {
        !!handler && this._handlers.push(handler);
    };
    SettingsManager.applySavedServerSettings = function (config) {
        config.log.info('Applying saved settings.');
        config.settings = Utils.merge(config.settings, this.getSavedServerSettings(config));
        this.changed(config);
    };
    SettingsManager.getSavedServerSettings = function (config) {
        return config.storage.get(this._configPath) || {};
    };
    SettingsManager.checkVersion = function (version, config) {
        if (version) {
            var savedConfigVersion = parseInt(config.storage.get(this._configPath + "-version"));
            if (isNaN(savedConfigVersion) || version > savedConfigVersion) {
                config.log.info("Updating settings from v" + (!isNaN(savedConfigVersion) ? savedConfigVersion : 0) + " to v" + version);
                this.updateSettings(config);
            }
        }
    };
    SettingsManager.updateSettings = function (config) {
        var _this = this;
        if (!config.isValid) {
            config.log.error('Unable to update settings: ApiKey is not set.');
            return;
        }
        config.submissionClient.getSettings(config, function (response) {
            if (!response || !response.success || !response.settings) {
                return;
            }
            config.settings = Utils.merge(config.settings, response.settings);
            var savedServerSettings = SettingsManager.getSavedServerSettings(config);
            for (var key in savedServerSettings) {
                if (response.settings[key]) {
                    continue;
                }
                delete config.settings[key];
            }
            var path = SettingsManager._configPath;
            config.storage.save(path + "-version", response.settingsVersion);
            config.storage.save(path, response.settings);
            config.log.info('Updated settings');
            _this.changed(config);
        });
    };
    SettingsManager._configPath = 'ex-server-settings.json';
    SettingsManager._handlers = [];
    return SettingsManager;
})();
exports.SettingsManager = SettingsManager;
var DefaultLastReferenceIdManager = (function () {
    function DefaultLastReferenceIdManager() {
        this._lastReferenceId = null;
    }
    DefaultLastReferenceIdManager.prototype.getLast = function () {
        return this._lastReferenceId;
    };
    DefaultLastReferenceIdManager.prototype.clearLast = function () {
        this._lastReferenceId = null;
    };
    DefaultLastReferenceIdManager.prototype.setLast = function (eventId) {
        this._lastReferenceId = eventId;
    };
    return DefaultLastReferenceIdManager;
})();
exports.DefaultLastReferenceIdManager = DefaultLastReferenceIdManager;
var ConsoleLog = (function () {
    function ConsoleLog() {
    }
    ConsoleLog.prototype.info = function (message) {
        this.log('info', message);
    };
    ConsoleLog.prototype.warn = function (message) {
        this.log('warn', message);
    };
    ConsoleLog.prototype.error = function (message) {
        this.log('error', message);
    };
    ConsoleLog.prototype.log = function (level, message) {
        if (console && console[level]) {
            console[level]("[" + level + "] Exceptionless: " + message);
        }
    };
    return ConsoleLog;
})();
exports.ConsoleLog = ConsoleLog;
var NullLog = (function () {
    function NullLog() {
    }
    NullLog.prototype.info = function (message) { };
    NullLog.prototype.warn = function (message) { };
    NullLog.prototype.error = function (message) { };
    return NullLog;
})();
exports.NullLog = NullLog;
var EventPluginContext = (function () {
    function EventPluginContext(client, event, contextData) {
        this.client = client;
        this.event = event;
        this.contextData = contextData ? contextData : new ContextData();
    }
    Object.defineProperty(EventPluginContext.prototype, "log", {
        get: function () {
            return this.client.config.log;
        },
        enumerable: true,
        configurable: true
    });
    return EventPluginContext;
})();
exports.EventPluginContext = EventPluginContext;
var EventPluginManager = (function () {
    function EventPluginManager() {
    }
    EventPluginManager.run = function (context, callback) {
        var wrap = function (plugin, next) {
            return function () {
                try {
                    if (!context.cancelled) {
                        plugin.run(context, next);
                    }
                }
                catch (ex) {
                    context.cancelled = true;
                    context.log.error("Error running plugin '" + plugin.name + "': " + ex.message + ". Discarding Event.");
                }
                if (context.cancelled && !!callback) {
                    callback(context);
                }
            };
        };
        var plugins = context.client.config.plugins;
        var wrappedPlugins = [];
        if (!!callback) {
            wrappedPlugins[plugins.length] = wrap({ name: 'cb', priority: 9007199254740992, run: callback }, null);
        }
        for (var index = plugins.length - 1; index > -1; index--) {
            wrappedPlugins[index] = wrap(plugins[index], !!callback || (index < plugins.length - 1) ? wrappedPlugins[index + 1] : null);
        }
        wrappedPlugins[0]();
    };
    EventPluginManager.addDefaultPlugins = function (config) {
        config.addPlugin(new ConfigurationDefaultsPlugin());
        config.addPlugin(new ErrorPlugin());
        config.addPlugin(new ModuleInfoPlugin());
        config.addPlugin(new RequestInfoPlugin());
        config.addPlugin(new EnvironmentInfoPlugin());
        config.addPlugin(new SubmissionMethodPlugin());
    };
    return EventPluginManager;
})();
exports.EventPluginManager = EventPluginManager;
var ReferenceIdPlugin = (function () {
    function ReferenceIdPlugin() {
        this.priority = 20;
        this.name = 'ReferenceIdPlugin';
    }
    ReferenceIdPlugin.prototype.run = function (context, next) {
        if ((!context.event.reference_id || context.event.reference_id.length === 0) && context.event.type === 'error') {
            context.event.reference_id = Utils.guid().replace('-', '').substring(0, 10);
        }
        next && next();
    };
    return ReferenceIdPlugin;
})();
exports.ReferenceIdPlugin = ReferenceIdPlugin;
var DefaultEventQueue = (function () {
    function DefaultEventQueue(config) {
        this._processingQueue = false;
        this._config = config;
    }
    DefaultEventQueue.prototype.enqueue = function (event) {
        var config = this._config;
        this.ensureQueueTimer();
        if (this.areQueuedItemsDiscarded()) {
            config.log.info('Queue items are currently being discarded. The event will not be queued.');
            return;
        }
        var key = "ex-q-" + new Date().toJSON() + "-" + Utils.randomNumber();
        config.log.info("Enqueuing event: " + key + " type=" + event.type + " " + (!!event.reference_id ? 'refid=' + event.reference_id : ''));
        config.storage.save(key, event);
    };
    DefaultEventQueue.prototype.process = function () {
        var _this = this;
        function getEvents(events) {
            var items = [];
            for (var index = 0; index < events.length; index++) {
                items.push(events[index].value);
            }
            return items;
        }
        var queueNotProcessed = 'The queue will not be processed.';
        var config = this._config;
        var log = config.log;
        this.ensureQueueTimer();
        if (this._processingQueue) {
            return;
        }
        log.info('Processing queue...');
        if (!config.enabled) {
            log.info("Configuration is disabled. " + queueNotProcessed);
            return;
        }
        if (!config.isValid) {
            log.info("Invalid Api Key. " + queueNotProcessed);
            return;
        }
        this._processingQueue = true;
        try {
            var events = config.storage.getList('ex-q', config.submissionBatchSize);
            if (!events || events.length == 0) {
                this._processingQueue = false;
                return;
            }
            log.info("Sending " + events.length + " events to " + config.serverUrl + ".");
            config.submissionClient.postEvents(getEvents(events), config, function (response) {
                _this.processSubmissionResponse(response, events);
                log.info('Finished processing queue.');
                _this._processingQueue = false;
            });
        }
        catch (ex) {
            log.error("Error processing queue: " + ex);
            this.suspendProcessing();
            this._processingQueue = false;
        }
    };
    DefaultEventQueue.prototype.processSubmissionResponse = function (response, events) {
        var noSubmission = 'The event will not be submitted.';
        var config = this._config;
        var log = config.log;
        if (response.success) {
            log.info("Sent " + events.length + " events.");
            this.removeEvents(events);
            return;
        }
        if (response.serviceUnavailable) {
            log.error('Server returned service unavailable.');
            this.suspendProcessing();
            return;
        }
        if (response.paymentRequired) {
            log.info('Too many events have been submitted, please upgrade your plan.');
            this.suspendProcessing(null, true, true);
            return;
        }
        if (response.unableToAuthenticate) {
            log.info("Unable to authenticate, please check your configuration. " + noSubmission);
            this.suspendProcessing(15);
            this.removeEvents(events);
            return;
        }
        if (response.notFound || response.badRequest) {
            log.error("Error while trying to submit data: " + response.message);
            this.suspendProcessing(60 * 4);
            this.removeEvents(events);
            return;
        }
        if (response.requestEntityTooLarge) {
            var message = 'Event submission discarded for being too large.';
            if (config.submissionBatchSize > 1) {
                log.error(message + " Retrying with smaller batch size.");
                config.submissionBatchSize = Math.max(1, Math.round(config.submissionBatchSize / 1.5));
            }
            else {
                log.error(message + " " + noSubmission);
                this.removeEvents(events);
            }
            return;
        }
        if (!response.success) {
            log.error("Error submitting events: " + (response.message || 'Please check the network tab for more info.'));
            this.suspendProcessing();
        }
    };
    DefaultEventQueue.prototype.ensureQueueTimer = function () {
        var _this = this;
        if (!this._queueTimer) {
            this._queueTimer = setInterval(function () { return _this.onProcessQueue(); }, 10000);
        }
    };
    DefaultEventQueue.prototype.onProcessQueue = function () {
        if (!this.isQueueProcessingSuspended() && !this._processingQueue) {
            this.process();
        }
    };
    DefaultEventQueue.prototype.suspendProcessing = function (durationInMinutes, discardFutureQueuedItems, clearQueue) {
        var config = this._config;
        if (!durationInMinutes || durationInMinutes <= 0) {
            durationInMinutes = 5;
        }
        config.log.info("Suspending processing for " + durationInMinutes + " minutes.");
        this._suspendProcessingUntil = new Date(new Date().getTime() + (durationInMinutes * 60000));
        if (discardFutureQueuedItems) {
            this._discardQueuedItemsUntil = new Date(new Date().getTime() + (durationInMinutes * 60000));
        }
        if (clearQueue) {
            this.removeEvents(config.storage.getList('ex-q'));
        }
    };
    DefaultEventQueue.prototype.removeEvents = function (events) {
        for (var index = 0; index < (events || []).length; index++) {
            this._config.storage.remove(events[index].path);
        }
    };
    DefaultEventQueue.prototype.isQueueProcessingSuspended = function () {
        return this._suspendProcessingUntil && this._suspendProcessingUntil > new Date();
    };
    DefaultEventQueue.prototype.areQueuedItemsDiscarded = function () {
        return this._discardQueuedItemsUntil && this._discardQueuedItemsUntil > new Date();
    };
    return DefaultEventQueue;
})();
exports.DefaultEventQueue = DefaultEventQueue;
var InMemoryStorage = (function () {
    function InMemoryStorage(maxItems) {
        this._items = [];
        this._maxItems = maxItems > 0 ? maxItems : 250;
    }
    InMemoryStorage.prototype.save = function (path, value) {
        if (!path || !value) {
            return false;
        }
        this.remove(path);
        if (this._items.push({ created: new Date().getTime(), path: path, value: value }) > this._maxItems) {
            this._items.shift();
        }
        return true;
    };
    InMemoryStorage.prototype.get = function (path) {
        var item = path ? this.getList("^" + path + "$", 1)[0] : null;
        return item ? item.value : null;
    };
    InMemoryStorage.prototype.getList = function (searchPattern, limit) {
        var items = this._items;
        if (!searchPattern) {
            return items.slice(0, limit);
        }
        var regex = new RegExp(searchPattern);
        var results = [];
        for (var index = 0; index < items.length; index++) {
            if (regex.test(items[index].path)) {
                results.push(items[index]);
                if (results.length >= limit) {
                    break;
                }
            }
        }
        return results;
    };
    InMemoryStorage.prototype.remove = function (path) {
        if (path) {
            var item = this.getList("^" + path + "$", 1)[0];
            if (item) {
                this._items.splice(this._items.indexOf(item), 1);
            }
        }
    };
    return InMemoryStorage;
})();
exports.InMemoryStorage = InMemoryStorage;
var Utils = (function () {
    function Utils() {
    }
    Utils.addRange = function (target) {
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        if (!target) {
            target = [];
        }
        if (!values || values.length === 0) {
            return target;
        }
        for (var index = 0; index < values.length; index++) {
            if (values[index] && target.indexOf(values[index]) < 0) {
                target.push(values[index]);
            }
        }
        return target;
    };
    Utils.getHashCode = function (source) {
        if (!source || source.length === 0) {
            return null;
        }
        var hash = 0;
        for (var index = 0; index < source.length; index++) {
            var character = source.charCodeAt(index);
            hash = ((hash << 5) - hash) + character;
            hash |= 0;
        }
        return hash.toString();
    };
    Utils.getCookies = function (cookies) {
        var result = {};
        var parts = (cookies || '').split('; ');
        for (var index = 0; index < parts.length; index++) {
            var cookie = parts[index].split('=');
            result[cookie[0]] = cookie[1];
        }
        return result;
    };
    Utils.guid = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };
    Utils.merge = function (defaultValues, values) {
        var result = {};
        for (var key in defaultValues || {}) {
            if (!!defaultValues[key]) {
                result[key] = defaultValues[key];
            }
        }
        for (var key in values || {}) {
            if (!!values[key]) {
                result[key] = values[key];
            }
        }
        return result;
    };
    Utils.parseVersion = function (source) {
        if (!source) {
            return null;
        }
        var versionRegex = /(v?((\d+)\.(\d+)(\.(\d+))?)(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?)/;
        var matches = versionRegex.exec(source);
        if (matches && matches.length > 0) {
            return matches[0];
        }
        return null;
    };
    Utils.parseQueryString = function (query) {
        if (!query || query.length === 0) {
            return null;
        }
        var pairs = query.split('&');
        if (pairs.length === 0) {
            return null;
        }
        var result = {};
        for (var index = 0; index < pairs.length; index++) {
            var pair = pairs[index].split('=');
            result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return result;
    };
    Utils.randomNumber = function () {
        return Math.floor(Math.random() * 9007199254740992);
    };
    Utils.stringify = function (data, exclusions) {
        function checkForMatch(pattern, value) {
            if (!pattern || !value || typeof value !== 'string') {
                return false;
            }
            var trim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
            pattern = pattern.toLowerCase().replace(trim, '');
            value = value.toLowerCase().replace(trim, '');
            if (pattern.length <= 0) {
                return false;
            }
            var startsWithWildcard = pattern[0] === '*';
            if (startsWithWildcard) {
                pattern = pattern.slice(1);
            }
            var endsWithWildcard = pattern[pattern.length - 1] === '*';
            if (endsWithWildcard) {
                pattern = pattern.substring(0, pattern.length - 1);
            }
            if (startsWithWildcard && endsWithWildcard)
                return value.indexOf(pattern) !== -1;
            if (startsWithWildcard)
                return value.lastIndexOf(pattern, 0) !== -1;
            if (endsWithWildcard)
                return value.lastIndexOf(pattern) === (value.length - pattern.length);
            return value === pattern;
        }
        function stringifyImpl(data, exclusions) {
            var cache = [];
            return JSON.stringify(data, function (key, value) {
                for (var index = 0; index < (exclusions || []).length; index++) {
                    if (checkForMatch(exclusions[index], key)) {
                        return;
                    }
                }
                if (typeof value === 'object' && !!value) {
                    if (cache.indexOf(value) !== -1) {
                        return;
                    }
                    cache.push(value);
                }
                return value;
            });
        }
        if (({}).toString.call(data) === '[object Array]') {
            var result = [];
            for (var index = 0; index < data.length; index++) {
                result[index] = JSON.parse(stringifyImpl(data[index], exclusions || []));
            }
            return JSON.stringify(result);
        }
        return stringifyImpl(data, exclusions || []);
    };
    return Utils;
})();
exports.Utils = Utils;
var Configuration = (function () {
    function Configuration(configSettings) {
        this.defaultTags = [];
        this.defaultData = {};
        this.enabled = true;
        this.lastReferenceIdManager = new DefaultLastReferenceIdManager();
        this.settings = {};
        this._serverUrl = 'https://collector.exceptionless.io';
        this._dataExclusions = [];
        this._plugins = [];
        function inject(fn) {
            return typeof fn === 'function' ? fn(this) : fn;
        }
        configSettings = Utils.merge(Configuration.defaults, configSettings);
        this.log = inject(configSettings.log) || new NullLog();
        this.apiKey = configSettings.apiKey;
        this.serverUrl = configSettings.serverUrl;
        this.environmentInfoCollector = inject(configSettings.environmentInfoCollector);
        this.errorParser = inject(configSettings.errorParser);
        this.lastReferenceIdManager = inject(configSettings.lastReferenceIdManager) || new DefaultLastReferenceIdManager();
        this.moduleCollector = inject(configSettings.moduleCollector);
        this.requestInfoCollector = inject(configSettings.requestInfoCollector);
        this.submissionBatchSize = inject(configSettings.submissionBatchSize) || 50;
        this.submissionClient = inject(configSettings.submissionClient);
        this.storage = inject(configSettings.storage) || new InMemoryStorage();
        this.queue = inject(configSettings.queue) || new DefaultEventQueue(this);
        SettingsManager.applySavedServerSettings(this);
        EventPluginManager.addDefaultPlugins(this);
    }
    Object.defineProperty(Configuration.prototype, "apiKey", {
        get: function () {
            return this._apiKey;
        },
        set: function (value) {
            this._apiKey = value || null;
            this.log.info("apiKey: " + this._apiKey);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "isValid", {
        get: function () {
            return !!this.apiKey && this.apiKey.length >= 10;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "serverUrl", {
        get: function () {
            return this._serverUrl;
        },
        set: function (value) {
            if (!!value) {
                this._serverUrl = value;
                this.log.info("serverUrl: " + this._serverUrl);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "dataExclusions", {
        get: function () {
            var exclusions = this.settings['@@DataExclusions'];
            return this._dataExclusions.concat(exclusions && exclusions.split(',') || []);
        },
        enumerable: true,
        configurable: true
    });
    Configuration.prototype.addDataExclusions = function () {
        var exclusions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            exclusions[_i - 0] = arguments[_i];
        }
        this._dataExclusions = Utils.addRange.apply(Utils, [this._dataExclusions].concat(exclusions));
    };
    Object.defineProperty(Configuration.prototype, "plugins", {
        get: function () {
            return this._plugins.sort(function (p1, p2) {
                return (p1.priority < p2.priority) ? -1 : (p1.priority > p2.priority) ? 1 : 0;
            });
        },
        enumerable: true,
        configurable: true
    });
    Configuration.prototype.addPlugin = function (pluginOrName, priority, pluginAction) {
        var plugin = !!pluginAction ? { name: pluginOrName, priority: priority, run: pluginAction } : pluginOrName;
        if (!plugin || !plugin.run) {
            this.log.error('Add plugin failed: Run method not defined');
            return;
        }
        if (!plugin.name) {
            plugin.name = Utils.guid();
        }
        if (!plugin.priority) {
            plugin.priority = 0;
        }
        var pluginExists = false;
        var plugins = this._plugins;
        for (var index = 0; index < plugins.length; index++) {
            if (plugins[index].name === plugin.name) {
                pluginExists = true;
                break;
            }
        }
        if (!pluginExists) {
            plugins.push(plugin);
        }
    };
    Configuration.prototype.removePlugin = function (pluginOrName) {
        var name = typeof pluginOrName === 'string' ? pluginOrName : pluginOrName.name;
        if (!name) {
            this.log.error('Remove plugin failed: Plugin name not defined');
            return;
        }
        var plugins = this._plugins;
        for (var index = 0; index < plugins.length; index++) {
            if (plugins[index].name === name) {
                plugins.splice(index, 1);
                break;
            }
        }
    };
    Configuration.prototype.setVersion = function (version) {
        if (!!version) {
            this.defaultData['@version'] = version;
        }
    };
    Configuration.prototype.setUserIdentity = function (userInfoOrIdentity, name) {
        var USER_KEY = '@user';
        var userInfo = typeof userInfoOrIdentity !== 'string' ? userInfoOrIdentity : { identity: userInfoOrIdentity, name: name };
        var shouldRemove = !userInfo || (!userInfo.identity && !userInfo.name);
        if (shouldRemove) {
            delete this.defaultData[USER_KEY];
        }
        else {
            this.defaultData[USER_KEY] = userInfo;
        }
        this.log.info("user identity: " + (shouldRemove ? 'null' : userInfo.identity));
    };
    Object.defineProperty(Configuration.prototype, "userAgent", {
        get: function () {
            return 'exceptionless-js/0.9.1';
        },
        enumerable: true,
        configurable: true
    });
    Configuration.prototype.useReferenceIds = function () {
        this.addPlugin(new ReferenceIdPlugin());
    };
    Configuration.prototype.useDebugLogger = function () {
        this.log = new ConsoleLog();
    };
    Object.defineProperty(Configuration, "defaults", {
        get: function () {
            if (Configuration._defaultSettings === null) {
                Configuration._defaultSettings = {};
            }
            return Configuration._defaultSettings;
        },
        enumerable: true,
        configurable: true
    });
    Configuration._defaultSettings = null;
    return Configuration;
})();
exports.Configuration = Configuration;
var EventBuilder = (function () {
    function EventBuilder(event, client, pluginContextData) {
        this._validIdentifierErrorMessage = "must contain between 8 and 100 alphanumeric or '-' characters.";
        this.target = event;
        this.client = client;
        this.pluginContextData = pluginContextData || new ContextData();
    }
    EventBuilder.prototype.setType = function (type) {
        if (!!type) {
            this.target.type = type;
        }
        return this;
    };
    EventBuilder.prototype.setSource = function (source) {
        if (!!source) {
            this.target.source = source;
        }
        return this;
    };
    EventBuilder.prototype.setSessionId = function (sessionId) {
        if (!this.isValidIdentifier(sessionId)) {
            throw new Error("SessionId " + this._validIdentifierErrorMessage);
        }
        this.target.session_id = sessionId;
        return this;
    };
    EventBuilder.prototype.setReferenceId = function (referenceId) {
        if (!this.isValidIdentifier(referenceId)) {
            throw new Error("ReferenceId " + this._validIdentifierErrorMessage);
        }
        this.target.reference_id = referenceId;
        return this;
    };
    EventBuilder.prototype.setMessage = function (message) {
        if (!!message) {
            this.target.message = message;
        }
        return this;
    };
    EventBuilder.prototype.setGeo = function (latitude, longitude) {
        if (latitude < -90.0 || latitude > 90.0)
            throw new Error('Must be a valid latitude value between -90.0 and 90.0.');
        if (longitude < -180.0 || longitude > 180.0)
            throw new Error('Must be a valid longitude value between -180.0 and 180.0.');
        this.target.geo = latitude + "," + longitude;
        return this;
    };
    EventBuilder.prototype.setUserIdentity = function (userInfoOrIdentity, name) {
        var userInfo = typeof userInfoOrIdentity !== 'string' ? userInfoOrIdentity : { identity: userInfoOrIdentity, name: name };
        if (!userInfo || (!userInfo.identity && !userInfo.name)) {
            return this;
        }
        this.setProperty('@user', userInfo);
        return this;
    };
    EventBuilder.prototype.setValue = function (value) {
        if (!!value) {
            this.target.value = value;
        }
        return this;
    };
    EventBuilder.prototype.addTags = function () {
        var tags = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tags[_i - 0] = arguments[_i];
        }
        this.target.tags = Utils.addRange.apply(Utils, [this.target.tags].concat(tags));
        return this;
    };
    EventBuilder.prototype.setProperty = function (name, value) {
        if (!name || (value === undefined || value == null)) {
            return this;
        }
        if (!this.target.data) {
            this.target.data = {};
        }
        this.target.data[name] = value;
        return this;
    };
    EventBuilder.prototype.markAsCritical = function (critical) {
        if (critical) {
            this.addTags('Critical');
        }
        return this;
    };
    EventBuilder.prototype.addRequestInfo = function (request) {
        if (!!request) {
            this.pluginContextData['@request'] = request;
        }
        return this;
    };
    EventBuilder.prototype.submit = function (callback) {
        this.client.submitEvent(this.target, this.pluginContextData, callback);
    };
    EventBuilder.prototype.isValidIdentifier = function (value) {
        if (!value) {
            return true;
        }
        if (value.length < 8 || value.length > 100) {
            return false;
        }
        for (var index = 0; index < value.length; index++) {
            var code = value.charCodeAt(index);
            var isDigit = (code >= 48) && (code <= 57);
            var isLetter = ((code >= 65) && (code <= 90)) || ((code >= 97) && (code <= 122));
            var isMinus = code === 45;
            if (!(isDigit || isLetter) && !isMinus) {
                return false;
            }
        }
        return true;
    };
    return EventBuilder;
})();
exports.EventBuilder = EventBuilder;
var SubmissionResponse = (function () {
    function SubmissionResponse(statusCode, message) {
        this.success = false;
        this.badRequest = false;
        this.serviceUnavailable = false;
        this.paymentRequired = false;
        this.unableToAuthenticate = false;
        this.notFound = false;
        this.requestEntityTooLarge = false;
        this.statusCode = statusCode;
        this.message = message;
        this.success = statusCode >= 200 && statusCode <= 299;
        this.badRequest = statusCode === 400;
        this.serviceUnavailable = statusCode === 503;
        this.paymentRequired = statusCode === 402;
        this.unableToAuthenticate = statusCode === 401 || statusCode === 403;
        this.notFound = statusCode === 404;
        this.requestEntityTooLarge = statusCode === 413;
    }
    return SubmissionResponse;
})();
exports.SubmissionResponse = SubmissionResponse;
var ExceptionlessClient = (function () {
    function ExceptionlessClient(settingsOrApiKey, serverUrl) {
        if (typeof settingsOrApiKey !== 'object') {
            this.config = new Configuration(settingsOrApiKey);
        }
        else {
            this.config = new Configuration({ apiKey: settingsOrApiKey, serverUrl: serverUrl });
        }
    }
    ExceptionlessClient.prototype.createException = function (exception) {
        var pluginContextData = new ContextData();
        pluginContextData.setException(exception);
        return this.createEvent(pluginContextData).setType('error');
    };
    ExceptionlessClient.prototype.submitException = function (exception, callback) {
        this.createException(exception).submit(callback);
    };
    ExceptionlessClient.prototype.createUnhandledException = function (exception, submissionMethod) {
        var builder = this.createException(exception);
        builder.pluginContextData.markAsUnhandledError();
        builder.pluginContextData.setSubmissionMethod(submissionMethod);
        return builder;
    };
    ExceptionlessClient.prototype.submitUnhandledException = function (exception, submissionMethod, callback) {
        this.createUnhandledException(exception, submissionMethod).submit(callback);
    };
    ExceptionlessClient.prototype.createFeatureUsage = function (feature) {
        return this.createEvent().setType('usage').setSource(feature);
    };
    ExceptionlessClient.prototype.submitFeatureUsage = function (feature, callback) {
        this.createFeatureUsage(feature).submit(callback);
    };
    ExceptionlessClient.prototype.createLog = function (sourceOrMessage, message, level) {
        var builder = this.createEvent().setType('log');
        if (sourceOrMessage && message && level) {
            builder = builder.setSource(sourceOrMessage).setMessage(message).setProperty('@level', level);
        }
        else if (sourceOrMessage && message) {
            builder = builder.setSource(sourceOrMessage).setMessage(message);
        }
        else {
            var caller = (arguments.callee.caller);
            builder = builder.setSource(caller && caller.name).setMessage(sourceOrMessage);
        }
        return builder;
    };
    ExceptionlessClient.prototype.submitLog = function (sourceOrMessage, message, level, callback) {
        this.createLog(sourceOrMessage, message, level).submit(callback);
    };
    ExceptionlessClient.prototype.createNotFound = function (resource) {
        return this.createEvent().setType('404').setSource(resource);
    };
    ExceptionlessClient.prototype.submitNotFound = function (resource, callback) {
        this.createNotFound(resource).submit(callback);
    };
    ExceptionlessClient.prototype.createSessionStart = function (sessionId) {
        return this.createEvent().setType('start').setSessionId(sessionId);
    };
    ExceptionlessClient.prototype.submitSessionStart = function (sessionId, callback) {
        this.createSessionStart(sessionId).submit(callback);
    };
    ExceptionlessClient.prototype.createSessionEnd = function (sessionId) {
        return this.createEvent().setType('end').setSessionId(sessionId);
    };
    ExceptionlessClient.prototype.submitSessionEnd = function (sessionId, callback) {
        this.createSessionEnd(sessionId).submit(callback);
    };
    ExceptionlessClient.prototype.createEvent = function (pluginContextData) {
        return new EventBuilder({ date: new Date() }, this, pluginContextData);
    };
    ExceptionlessClient.prototype.submitEvent = function (event, pluginContextData, callback) {
        function cancelled() {
            if (!!context) {
                context.cancelled = true;
            }
            return !!callback && callback(context);
        }
        if (!event) {
            return cancelled();
        }
        if (!this.config.enabled) {
            this.config.log.info('Event submission is currently disabled.');
            return cancelled();
        }
        if (!event.data) {
            event.data = {};
        }
        if (!event.tags || !event.tags.length) {
            event.tags = [];
        }
        var context = new EventPluginContext(this, event, pluginContextData);
        EventPluginManager.run(context, function (context) {
            var ev = context.event;
            if (!context.cancelled) {
                if (!ev.type || ev.type.length === 0) {
                    ev.type = 'log';
                }
                if (!ev.date) {
                    ev.date = new Date();
                }
                var config = context.client.config;
                config.queue.enqueue(ev);
                if (ev.reference_id && ev.reference_id.length > 0) {
                    context.log.info("Setting last reference id '" + ev.reference_id + "'");
                    config.lastReferenceIdManager.setLast(ev.reference_id);
                }
            }
            !!callback && callback(context);
        });
    };
    ExceptionlessClient.prototype.updateUserEmailAndDescription = function (referenceId, email, description, callback) {
        var _this = this;
        if (!referenceId || !email || !description || !this.config.enabled) {
            return !!callback && callback(new SubmissionResponse(500, 'cancelled'));
        }
        var userDescription = { email_address: email, description: description };
        var response = this.config.submissionClient.postUserDescription(referenceId, userDescription, this.config, function (response) {
            if (!response.success) {
                _this.config.log.error("Failed to submit user email and description for event '" + referenceId + "': " + response.statusCode + " " + response.message);
            }
            !!callback && callback(response);
        });
    };
    ExceptionlessClient.prototype.getLastReferenceId = function () {
        return this.config.lastReferenceIdManager.getLast();
    };
    Object.defineProperty(ExceptionlessClient, "default", {
        get: function () {
            if (ExceptionlessClient._instance === null) {
                ExceptionlessClient._instance = new ExceptionlessClient(null);
            }
            return ExceptionlessClient._instance;
        },
        enumerable: true,
        configurable: true
    });
    ExceptionlessClient._instance = null;
    return ExceptionlessClient;
})();
exports.ExceptionlessClient = ExceptionlessClient;
var ConfigurationDefaultsPlugin = (function () {
    function ConfigurationDefaultsPlugin() {
        this.priority = 10;
        this.name = 'ConfigurationDefaultsPlugin';
    }
    ConfigurationDefaultsPlugin.prototype.run = function (context, next) {
        var defaultTags = context.client.config.defaultTags || [];
        for (var index = 0; index < defaultTags.length; index++) {
            var tag = defaultTags[index];
            if (!!tag && context.event.tags.indexOf(tag) < 0) {
                context.event.tags.push(tag);
            }
        }
        var defaultData = context.client.config.defaultData || {};
        for (var key in defaultData) {
            if (!!defaultData[key]) {
                context.event.data[key] = defaultData[key];
            }
        }
        next && next();
    };
    return ConfigurationDefaultsPlugin;
})();
exports.ConfigurationDefaultsPlugin = ConfigurationDefaultsPlugin;
var ErrorPlugin = (function () {
    function ErrorPlugin() {
        this.priority = 30;
        this.name = 'ErrorPlugin';
    }
    ErrorPlugin.prototype.run = function (context, next) {
        var ERROR_KEY = '@error';
        var exception = context.contextData.getException();
        if (!!exception) {
            context.event.type = 'error';
            if (!context.event.data[ERROR_KEY]) {
                var parser = context.client.config.errorParser;
                if (!parser) {
                    throw new Error('No error parser was defined.');
                }
                var result = parser.parse(context, exception);
                if (!!result) {
                    context.event.data[ERROR_KEY] = result;
                }
            }
        }
        next && next();
    };
    return ErrorPlugin;
})();
exports.ErrorPlugin = ErrorPlugin;
var ModuleInfoPlugin = (function () {
    function ModuleInfoPlugin() {
        this.priority = 40;
        this.name = 'ModuleInfoPlugin';
    }
    ModuleInfoPlugin.prototype.run = function (context, next) {
        var ERROR_KEY = '@error';
        var collector = context.client.config.moduleCollector;
        if (context.event.data[ERROR_KEY] && !context.event.data['@error'].modules && !!collector) {
            var modules = collector.getModules(context);
            if (modules && modules.length > 0) {
                context.event.data[ERROR_KEY].modules = modules;
            }
        }
        next && next();
    };
    return ModuleInfoPlugin;
})();
exports.ModuleInfoPlugin = ModuleInfoPlugin;
var RequestInfoPlugin = (function () {
    function RequestInfoPlugin() {
        this.priority = 60;
        this.name = 'RequestInfoPlugin';
    }
    RequestInfoPlugin.prototype.run = function (context, next) {
        var REQUEST_KEY = '@request';
        var collector = context.client.config.requestInfoCollector;
        if (!context.event.data[REQUEST_KEY] && !!collector) {
            var requestInfo = collector.getRequestInfo(context);
            if (!!requestInfo) {
                context.event.data[REQUEST_KEY] = requestInfo;
            }
        }
        next && next();
    };
    return RequestInfoPlugin;
})();
exports.RequestInfoPlugin = RequestInfoPlugin;
var EnvironmentInfoPlugin = (function () {
    function EnvironmentInfoPlugin() {
        this.priority = 70;
        this.name = 'EnvironmentInfoPlugin';
    }
    EnvironmentInfoPlugin.prototype.run = function (context, next) {
        var ENVIRONMENT_KEY = '@environment';
        var collector = context.client.config.environmentInfoCollector;
        if (!context.event.data[ENVIRONMENT_KEY] && collector) {
            var environmentInfo = collector.getEnvironmentInfo(context);
            if (!!environmentInfo) {
                context.event.data[ENVIRONMENT_KEY] = environmentInfo;
            }
        }
        next && next();
    };
    return EnvironmentInfoPlugin;
})();
exports.EnvironmentInfoPlugin = EnvironmentInfoPlugin;
var SubmissionMethodPlugin = (function () {
    function SubmissionMethodPlugin() {
        this.priority = 100;
        this.name = 'SubmissionMethodPlugin';
    }
    SubmissionMethodPlugin.prototype.run = function (context, next) {
        var submissionMethod = context.contextData.getSubmissionMethod();
        if (!!submissionMethod) {
            context.event.data['@submission_method'] = submissionMethod;
        }
        next && next();
    };
    return SubmissionMethodPlugin;
})();
exports.SubmissionMethodPlugin = SubmissionMethodPlugin;
var SettingsResponse = (function () {
    function SettingsResponse(success, settings, settingsVersion, exception, message) {
        if (settingsVersion === void 0) { settingsVersion = -1; }
        if (exception === void 0) { exception = null; }
        if (message === void 0) { message = null; }
        this.success = false;
        this.settingsVersion = -1;
        this.success = success;
        this.settings = settings;
        this.settingsVersion = settingsVersion;
        this.exception = exception;
        this.message = message;
    }
    return SettingsResponse;
})();
exports.SettingsResponse = SettingsResponse;
var os = require('os');
var NodeEnvironmentInfoCollector = (function () {
    function NodeEnvironmentInfoCollector() {
    }
    NodeEnvironmentInfoCollector.prototype.getEnvironmentInfo = function (context) {
        function getIpAddresses() {
            var ips = [];
            var interfaces = os.networkInterfaces();
            Object.keys(interfaces).forEach(function (name) {
                interfaces[name].forEach(function (iface) {
                    if ('IPv4' === iface.family && !iface.internal) {
                        ips.push(iface.address);
                    }
                });
            });
            return ips.join(', ');
        }
        if (!os) {
            return null;
        }
        var environmentInfo = {
            processor_count: os.cpus().length,
            total_physical_memory: os.totalmem(),
            available_physical_memory: os.freemem(),
            command_line: process.argv.join(' '),
            process_name: (process.title || '').replace(/[\uE000-\uF8FF]/g, ''),
            process_id: process.pid + '',
            process_memory_size: process.memoryUsage().heapTotal,
            architecture: os.arch(),
            o_s_name: os.type(),
            o_s_version: os.release(),
            ip_address: getIpAddresses(),
            machine_name: os.hostname(),
            runtime_version: process.version,
            data: {
                loadavg: os.loadavg(),
                platform: os.platform(),
                tmpdir: os.tmpdir(),
                uptime: os.uptime()
            }
        };
        if (os.endianness) {
            environmentInfo.data.endianness = os.endianness();
        }
        return environmentInfo;
    };
    return NodeEnvironmentInfoCollector;
})();
exports.NodeEnvironmentInfoCollector = NodeEnvironmentInfoCollector;
var nodestacktrace = require('stack-trace');
var NodeErrorParser = (function () {
    function NodeErrorParser() {
    }
    NodeErrorParser.prototype.parse = function (context, exception) {
        function getStackFrames(context, stackFrames) {
            var frames = [];
            for (var index = 0; index < stackFrames.length; index++) {
                var frame = stackFrames[index];
                frames.push({
                    name: frame.getMethodName() || frame.getFunctionName(),
                    file_name: frame.getFileName(),
                    line_number: frame.getLineNumber(),
                    column: frame.getColumnNumber(),
                    declaring_type: frame.getTypeName(),
                    data: {
                        is_native: frame.isNative() || (!!frame.filename && frame.filename[0] !== '/' && frame.filename[0] !== '.')
                    }
                });
            }
            return frames;
        }
        if (!nodestacktrace) {
            throw new Error('Unable to load the stack trace library.');
        }
        var stackFrames = nodestacktrace.parse(exception) || [];
        return {
            type: exception.name,
            message: exception.message,
            stack_trace: getStackFrames(context, stackFrames)
        };
    };
    return NodeErrorParser;
})();
exports.NodeErrorParser = NodeErrorParser;
var NodeRequestInfoCollector = (function () {
    function NodeRequestInfoCollector() {
    }
    NodeRequestInfoCollector.prototype.getRequestInfo = function (context) {
        var REQUEST_KEY = '@request';
        if (!context.contextData[REQUEST_KEY]) {
            return null;
        }
        var request = context.contextData[REQUEST_KEY];
        var requestInfo = {
            client_ip_address: request.ip,
            user_agent: request.headers['user-agent'],
            is_secure: request.secure,
            http_method: request.method,
            host: request.hostname || request.host,
            path: request.path,
            post_data: request.body,
            cookies: Utils.getCookies((request || {}).headers['cookie']),
            query_string: request.params
        };
        var host = request.headers['host'];
        var port = host && parseInt(host.slice(host.indexOf(':') + 1));
        if (port > 0) {
            requestInfo.port = port;
        }
        return requestInfo;
    };
    return NodeRequestInfoCollector;
})();
exports.NodeRequestInfoCollector = NodeRequestInfoCollector;
var DefaultSubmissionClient = (function () {
    function DefaultSubmissionClient() {
        this.configurationVersionHeader = 'X-Exceptionless-ConfigVersion';
    }
    DefaultSubmissionClient.prototype.postEvents = function (events, config, callback) {
        var _this = this;
        return this.sendRequest(config, 'POST', '/api/v2/events', Utils.stringify(events, config.dataExclusions), function (status, message, data, headers) {
            var settingsVersion = headers && parseInt(headers[_this.configurationVersionHeader]);
            SettingsManager.checkVersion(settingsVersion, config);
            callback(new SubmissionResponse(status, message));
        });
    };
    DefaultSubmissionClient.prototype.postUserDescription = function (referenceId, description, config, callback) {
        var _this = this;
        var path = "/api/v2/events/by-ref/" + encodeURIComponent(referenceId) + "/user-description";
        return this.sendRequest(config, 'POST', path, Utils.stringify(description, config.dataExclusions), function (status, message, data, headers) {
            var settingsVersion = headers && parseInt(headers[_this.configurationVersionHeader]);
            SettingsManager.checkVersion(settingsVersion, config);
            callback(new SubmissionResponse(status, message));
        });
    };
    DefaultSubmissionClient.prototype.getSettings = function (config, callback) {
        return this.sendRequest(config, 'GET', '/api/v2/projects/config', null, function (status, message, data) {
            if (status !== 200) {
                return callback(new SettingsResponse(false, null, -1, null, message));
            }
            var settings;
            try {
                settings = JSON.parse(data);
            }
            catch (e) {
                config.log.error("Unable to parse settings: '" + data + "'");
            }
            if (!settings || isNaN(settings.version)) {
                return callback(new SettingsResponse(false, null, -1, null, 'Invalid configuration settings.'));
            }
            callback(new SettingsResponse(true, settings.settings || {}, settings.version));
        });
    };
    DefaultSubmissionClient.prototype.sendRequest = function (config, method, path, data, callback) {
        var TIMEOUT = 'timeout';
        var LOADED = 'loaded';
        var WITH_CREDENTIALS = 'withCredentials';
        var isCompleted = false;
        var useSetTimeout = false;
        function complete(mode, xhr) {
            function parseResponseHeaders(headerStr) {
                var headers = {};
                var headerPairs = (headerStr || '').split('\u000d\u000a');
                for (var index = 0; index < headerPairs.length; index++) {
                    var headerPair = headerPairs[index];
                    var separator = headerPair.indexOf('\u003a\u0020');
                    if (separator > 0) {
                        headers[headerPair.substring(0, separator)] = headerPair.substring(separator + 2);
                    }
                }
                return headers;
            }
            if (isCompleted) {
                return;
            }
            isCompleted = true;
            var message = xhr.statusText;
            var responseText = xhr.responseText;
            var status = xhr.status;
            if (mode === TIMEOUT || status === 0) {
                message = 'Unable to connect to server.';
                status = 0;
            }
            else if (mode === LOADED && !status) {
                status = method === 'POST' ? 202 : 200;
            }
            else if (status < 200 || status > 299) {
                var responseBody = xhr.responseBody;
                if (!!responseBody && !!responseBody.message) {
                    message = responseBody.message;
                }
                else if (!!responseText && responseText.indexOf('message') !== -1) {
                    try {
                        message = JSON.parse(responseText).message;
                    }
                    catch (e) {
                        message = responseText;
                    }
                }
            }
            callback(status || 500, message || '', responseText, parseResponseHeaders(xhr.getAllResponseHeaders && xhr.getAllResponseHeaders()));
        }
        function createRequest(config, method, url) {
            var xhr = new XMLHttpRequest();
            if (WITH_CREDENTIALS in xhr) {
                xhr.open(method, url, true);
                xhr.setRequestHeader('X-Exceptionless-Client', config.userAgent);
                if (method === 'POST') {
                    xhr.setRequestHeader('Content-Type', 'application/json');
                }
            }
            else if (typeof XDomainRequest != 'undefined') {
                useSetTimeout = true;
                xhr = new XDomainRequest();
                xhr.open(method, location.protocol === 'http:' ? url.replace('https:', 'http:') : url);
            }
            else {
                xhr = null;
            }
            if (xhr) {
                xhr.timeout = 10000;
            }
            return xhr;
        }
        var url = "" + config.serverUrl + path + "?access_token=" + encodeURIComponent(config.apiKey);
        var xhr = createRequest(config, method || 'POST', url);
        if (!xhr) {
            return callback(503, 'CORS not supported.');
        }
        if (WITH_CREDENTIALS in xhr) {
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) {
                    return;
                }
                complete(LOADED, xhr);
            };
        }
        xhr.onprogress = function () { };
        xhr.ontimeout = function () { return complete(TIMEOUT, xhr); };
        xhr.onerror = function () { return complete('error', xhr); };
        xhr.onload = function () { return complete(LOADED, xhr); };
        if (useSetTimeout) {
            setTimeout(function () { return xhr.send(data); }, 500);
        }
        else {
            xhr.send(data);
        }
    };
    return DefaultSubmissionClient;
})();
exports.DefaultSubmissionClient = DefaultSubmissionClient;
var http = require('http');
var https = require('https');
var url = require('url');
var NodeSubmissionClient = (function (_super) {
    __extends(NodeSubmissionClient, _super);
    function NodeSubmissionClient() {
        _super.call(this);
        this.configurationVersionHeader = this.configurationVersionHeader.toLowerCase();
    }
    NodeSubmissionClient.prototype.sendRequest = function (config, method, path, data, callback) {
        function complete(response, responseBody, responseHeaders) {
            var message;
            if (response.statusCode === 0) {
                message = 'Unable to connect to server.';
            }
            else if (response.statusCode < 200 || response.statusCode > 299) {
                message = response.statusMessage || response.message;
            }
            callback(response.statusCode || 500, message, responseBody, responseHeaders);
        }
        var parsedHost = url.parse(config.serverUrl);
        var options = {
            auth: "client:" + config.apiKey,
            headers: {},
            hostname: parsedHost.hostname,
            method: method,
            port: parsedHost.port && parseInt(parsedHost.port),
            path: path
        };
        if (method === 'POST') {
            options.headers = {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            };
        }
        options.headers['User-Agent'] = config.userAgent;
        var request = (parsedHost.protocol === 'https' ? https : http).request(options, function (response) {
            var body = '';
            response.setEncoding('utf8');
            response.on('data', function (chunk) { return body += chunk; });
            response.on('end', function () { return complete(response, body, response.headers); });
        });
        request.on('error', function (error) { return callback(500, error.message); });
        request.end(data);
    };
    return NodeSubmissionClient;
})(DefaultSubmissionClient);
exports.NodeSubmissionClient = NodeSubmissionClient;
var BEFORE_EXIT = 'BEFORE_EXIT';
var UNCAUGHT_EXCEPTION = 'UNCAUGHT_EXCEPTION';
var defaults = Configuration.defaults;
defaults.environmentInfoCollector = new NodeEnvironmentInfoCollector();
defaults.errorParser = new NodeErrorParser();
defaults.requestInfoCollector = new NodeRequestInfoCollector();
defaults.submissionClient = new NodeSubmissionClient();
process.on(UNCAUGHT_EXCEPTION, function (error) {
    ExceptionlessClient.default.submitUnhandledException(error, UNCAUGHT_EXCEPTION);
});
process.on(BEFORE_EXIT, function (code) {
    function getExitCodeReason(code) {
        if (code === 1) {
            return 'Uncaught Fatal Exception';
        }
        if (code === 3) {
            return 'Internal JavaScript Parse Error';
        }
        if (code === 4) {
            return 'Internal JavaScript Evaluation Failure';
        }
        if (code === 5) {
            return 'Fatal Exception';
        }
        if (code === 6) {
            return 'Non-function Internal Exception Handler ';
        }
        if (code === 7) {
            return 'Internal Exception Handler Run-Time Failure';
        }
        if (code === 8) {
            return 'Uncaught Exception';
        }
        if (code === 9) {
            return 'Invalid Argument';
        }
        if (code === 10) {
            return 'Internal JavaScript Run-Time Failure';
        }
        if (code === 12) {
            return 'Invalid Debug Argument';
        }
        if (code > 128) {
            return 'Signal Exits';
        }
        return null;
    }
    var client = ExceptionlessClient.default;
    var message = getExitCodeReason(code);
    if (message !== null) {
        client.submitLog(BEFORE_EXIT, message, 'Error');
    }
    client.config.queue.process();
});
Error.stackTraceLimit = Infinity;

//# sourceMappingURL=exceptionless.node.js.map