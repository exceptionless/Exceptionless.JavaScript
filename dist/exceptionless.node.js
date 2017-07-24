"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var os = require("os");
var nodestacktrace = require("stack-trace");
var child = require("child_process");
var path = require("path");
var Fs = require("fs");
var Path = require("path");
var http = require("http");
var https = require("https");
var url = require("url");
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
}());
exports.DefaultLastReferenceIdManager = DefaultLastReferenceIdManager;
var ConsoleLog = (function () {
    function ConsoleLog() {
    }
    ConsoleLog.prototype.trace = function (message) {
        this.log('debug', message);
    };
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
        if (console) {
            var msg = "[" + level + "] Exceptionless: " + message;
            if (console[level]) {
                console[level](msg);
            }
            else if (console.log) {
                console["log"](msg);
            }
        }
    };
    return ConsoleLog;
}());
exports.ConsoleLog = ConsoleLog;
var NullLog = (function () {
    function NullLog() {
    }
    NullLog.prototype.trace = function (message) { };
    NullLog.prototype.info = function (message) { };
    NullLog.prototype.warn = function (message) { };
    NullLog.prototype.error = function (message) { };
    return NullLog;
}());
exports.NullLog = NullLog;
var HeartbeatPlugin = (function () {
    function HeartbeatPlugin(heartbeatInterval) {
        if (heartbeatInterval === void 0) { heartbeatInterval = 30000; }
        this.priority = 100;
        this.name = 'HeartbeatPlugin';
        this._interval = heartbeatInterval;
    }
    HeartbeatPlugin.prototype.run = function (context, next) {
        clearInterval(this._intervalId);
        var user = context.event.data['@user'];
        if (user && user.identity) {
            this._intervalId = setInterval(function () { return context.client.submitSessionHeartbeat(user.identity); }, this._interval);
        }
        next && next();
    };
    return HeartbeatPlugin;
}());
exports.HeartbeatPlugin = HeartbeatPlugin;
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
}());
exports.ReferenceIdPlugin = ReferenceIdPlugin;
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
}());
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
        config.addPlugin(new DuplicateCheckerPlugin());
        config.addPlugin(new EventExclusionPlugin());
        config.addPlugin(new ModuleInfoPlugin());
        config.addPlugin(new RequestInfoPlugin());
        config.addPlugin(new EnvironmentInfoPlugin());
        config.addPlugin(new SubmissionMethodPlugin());
    };
    return EventPluginManager;
}());
exports.EventPluginManager = EventPluginManager;
var DefaultEventQueue = (function () {
    function DefaultEventQueue(config) {
        this._handlers = [];
        this._processingQueue = false;
        this._config = config;
    }
    DefaultEventQueue.prototype.enqueue = function (event) {
        var eventWillNotBeQueued = 'The event will not be queued.';
        var config = this._config;
        var log = config.log;
        if (!config.enabled) {
            log.info("Configuration is disabled. " + eventWillNotBeQueued);
            return;
        }
        if (!config.isValid) {
            log.info("Invalid Api Key. " + eventWillNotBeQueued);
            return;
        }
        if (this.areQueuedItemsDiscarded()) {
            log.info("Queue items are currently being discarded. " + eventWillNotBeQueued);
            return;
        }
        this.ensureQueueTimer();
        var timestamp = config.storage.queue.save(event);
        var logText = "type=" + event.type + " " + (!!event.reference_id ? 'refid=' + event.reference_id : '');
        if (timestamp) {
            log.info("Enqueuing event: " + timestamp + " " + logText);
        }
        else {
            log.error("Could not enqueue event " + logText);
        }
    };
    DefaultEventQueue.prototype.process = function (isAppExiting) {
        var _this = this;
        var queueNotProcessed = 'The queue will not be processed.';
        var config = this._config;
        var log = config.log;
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
        this.ensureQueueTimer();
        try {
            var events_1 = config.storage.queue.get(config.submissionBatchSize);
            if (!events_1 || events_1.length === 0) {
                this._processingQueue = false;
                return;
            }
            log.info("Sending " + events_1.length + " events to " + config.serverUrl + ".");
            config.submissionClient.postEvents(events_1.map(function (e) { return e.value; }), config, function (response) {
                _this.processSubmissionResponse(response, events_1);
                _this.eventsPosted(events_1.map(function (e) { return e.value; }), response);
                log.info('Finished processing queue.');
                _this._processingQueue = false;
            }, isAppExiting);
        }
        catch (ex) {
            log.error("Error processing queue: " + ex);
            this.suspendProcessing();
            this._processingQueue = false;
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
            this._discardQueuedItemsUntil = this._suspendProcessingUntil;
        }
        if (clearQueue) {
            config.storage.queue.clear();
        }
    };
    DefaultEventQueue.prototype.onEventsPosted = function (handler) {
        !!handler && this._handlers.push(handler);
    };
    DefaultEventQueue.prototype.eventsPosted = function (events, response) {
        var handlers = this._handlers;
        for (var _i = 0, handlers_1 = handlers; _i < handlers_1.length; _i++) {
            var handler = handlers_1[_i];
            try {
                handler(events, response);
            }
            catch (ex) {
                this._config.log.error("Error calling onEventsPosted handler: " + ex);
            }
        }
    };
    DefaultEventQueue.prototype.areQueuedItemsDiscarded = function () {
        return this._discardQueuedItemsUntil && this._discardQueuedItemsUntil > new Date();
    };
    DefaultEventQueue.prototype.ensureQueueTimer = function () {
        var _this = this;
        if (!this._queueTimer) {
            this._queueTimer = setInterval(function () { return _this.onProcessQueue(); }, 10000);
        }
    };
    DefaultEventQueue.prototype.isQueueProcessingSuspended = function () {
        return this._suspendProcessingUntil && this._suspendProcessingUntil > new Date();
    };
    DefaultEventQueue.prototype.onProcessQueue = function () {
        if (!this.isQueueProcessingSuspended() && !this._processingQueue) {
            this.process();
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
    DefaultEventQueue.prototype.removeEvents = function (events) {
        for (var index = 0; index < (events || []).length; index++) {
            this._config.storage.queue.remove(events[index].timestamp);
        }
    };
    return DefaultEventQueue;
}());
exports.DefaultEventQueue = DefaultEventQueue;
var InMemoryStorageProvider = (function () {
    function InMemoryStorageProvider(maxQueueItems) {
        if (maxQueueItems === void 0) { maxQueueItems = 250; }
        this.queue = new InMemoryStorage(maxQueueItems);
        this.settings = new InMemoryStorage(1);
    }
    return InMemoryStorageProvider;
}());
exports.InMemoryStorageProvider = InMemoryStorageProvider;
var DefaultSubmissionClient = (function () {
    function DefaultSubmissionClient() {
        this.configurationVersionHeader = 'x-exceptionless-configversion';
    }
    DefaultSubmissionClient.prototype.postEvents = function (events, config, callback, isAppExiting) {
        var data = JSON.stringify(events);
        var request = this.createRequest(config, 'POST', config.serverUrl + "/api/v2/events", data);
        var cb = this.createSubmissionCallback(config, callback);
        return config.submissionAdapter.sendRequest(request, cb, isAppExiting);
    };
    DefaultSubmissionClient.prototype.postUserDescription = function (referenceId, description, config, callback) {
        var path = config.serverUrl + "/api/v2/events/by-ref/" + encodeURIComponent(referenceId) + "/user-description";
        var data = JSON.stringify(description);
        var request = this.createRequest(config, 'POST', path, data);
        var cb = this.createSubmissionCallback(config, callback);
        return config.submissionAdapter.sendRequest(request, cb);
    };
    DefaultSubmissionClient.prototype.getSettings = function (config, version, callback) {
        var request = this.createRequest(config, 'GET', config.serverUrl + "/api/v2/projects/config?v=" + version);
        var cb = function (status, message, data, headers) {
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
        };
        return config.submissionAdapter.sendRequest(request, cb);
    };
    DefaultSubmissionClient.prototype.sendHeartbeat = function (sessionIdOrUserId, closeSession, config) {
        var request = this.createRequest(config, 'GET', config.heartbeatServerUrl + "/api/v2/events/session/heartbeat?id=" + sessionIdOrUserId + "&close=" + closeSession);
        config.submissionAdapter.sendRequest(request);
    };
    DefaultSubmissionClient.prototype.createRequest = function (config, method, url, data) {
        if (data === void 0) { data = null; }
        return {
            method: method,
            url: url,
            data: data,
            apiKey: config.apiKey,
            userAgent: config.userAgent
        };
    };
    DefaultSubmissionClient.prototype.createSubmissionCallback = function (config, callback) {
        var _this = this;
        return function (status, message, data, headers) {
            var settingsVersion = headers && parseInt(headers[_this.configurationVersionHeader], 10);
            SettingsManager.checkVersion(settingsVersion, config);
            callback(new SubmissionResponse(status, message));
        };
    };
    return DefaultSubmissionClient;
}());
exports.DefaultSubmissionClient = DefaultSubmissionClient;
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
        for (var _a = 0, values_1 = values; _a < values_1.length; _a++) {
            var value = values_1[_a];
            if (value && target.indexOf(value) < 0) {
                target.push(value);
            }
        }
        return target;
    };
    Utils.getHashCode = function (source) {
        if (!source || source.length === 0) {
            return 0;
        }
        var hash = 0;
        for (var index = 0; index < source.length; index++) {
            var character = source.charCodeAt(index);
            hash = ((hash << 5) - hash) + character;
            hash |= 0;
        }
        return hash;
    };
    Utils.getCookies = function (cookies, exclusions) {
        var result = {};
        var parts = (cookies || '').split('; ');
        for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
            var part = parts_1[_i];
            var cookie = part.split('=');
            if (!Utils.isMatch(cookie[0], exclusions)) {
                result[cookie[0]] = cookie[1];
            }
        }
        return !Utils.isEmpty(result) ? result : null;
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
    Utils.parseQueryString = function (query, exclusions) {
        if (!query || query.length === 0) {
            return null;
        }
        var pairs = query.split('&');
        if (pairs.length === 0) {
            return null;
        }
        var result = {};
        for (var _i = 0, pairs_1 = pairs; _i < pairs_1.length; _i++) {
            var pair = pairs_1[_i];
            var parts = pair.split('=');
            if (!Utils.isMatch(parts[0], exclusions)) {
                result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
            }
        }
        return !Utils.isEmpty(result) ? result : null;
    };
    Utils.randomNumber = function () {
        return Math.floor(Math.random() * 9007199254740992);
    };
    Utils.isMatch = function (input, patterns, ignoreCase) {
        if (ignoreCase === void 0) { ignoreCase = true; }
        if (!input || typeof input !== 'string') {
            return false;
        }
        var trim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
        input = (ignoreCase ? input.toLowerCase() : input).replace(trim, '');
        return (patterns || []).some(function (pattern) {
            if (typeof pattern !== 'string') {
                return false;
            }
            pattern = (ignoreCase ? pattern.toLowerCase() : pattern).replace(trim, '');
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
            if (startsWithWildcard && endsWithWildcard) {
                return pattern.length <= input.length && input.indexOf(pattern, 0) !== -1;
            }
            if (startsWithWildcard) {
                return Utils.endsWith(input, pattern);
            }
            if (endsWithWildcard) {
                return Utils.startsWith(input, pattern);
            }
            return input === pattern;
        });
    };
    Utils.isEmpty = function (input) {
        return input === null || (typeof (input) === 'object' && Object.keys(input).length === 0);
    };
    Utils.startsWith = function (input, prefix) {
        return input.substring(0, prefix.length) === prefix;
    };
    Utils.endsWith = function (input, suffix) {
        return input.indexOf(suffix, input.length - suffix.length) !== -1;
    };
    Utils.stringify = function (data, exclusions, maxDepth) {
        function stringifyImpl(obj, excludedKeys) {
            var cache = [];
            return JSON.stringify(obj, function (key, value) {
                if (Utils.isMatch(key, excludedKeys)) {
                    return;
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
        if (({}).toString.call(data) === '[object Object]') {
            var flattened = {};
            for (var prop in data) {
                var value = data[prop];
                if (value === data) {
                    continue;
                }
                flattened[prop] = data[prop];
            }
            return stringifyImpl(flattened, exclusions);
        }
        if (({}).toString.call(data) === '[object Array]') {
            var result = [];
            for (var index = 0; index < data.length; index++) {
                result[index] = JSON.parse(stringifyImpl(data[index], exclusions));
            }
            return JSON.stringify(result);
        }
        return stringifyImpl(data, exclusions);
    };
    Utils.toBoolean = function (input, defaultValue) {
        if (defaultValue === void 0) { defaultValue = false; }
        if (typeof input === 'boolean') {
            return input;
        }
        if (input === null || typeof input !== 'number' && typeof input !== 'string') {
            return defaultValue;
        }
        switch ((input + '').toLowerCase().trim()) {
            case 'true':
            case 'yes':
            case '1': return true;
            case 'false':
            case 'no':
            case '0':
            case null: return false;
        }
        return defaultValue;
    };
    return Utils;
}());
exports.Utils = Utils;
var SettingsManager = (function () {
    function SettingsManager() {
    }
    SettingsManager.onChanged = function (handler) {
        !!handler && this._handlers.push(handler);
    };
    SettingsManager.applySavedServerSettings = function (config) {
        if (!config || !config.isValid) {
            return;
        }
        var savedSettings = this.getSavedServerSettings(config);
        config.log.info("Applying saved settings: v" + savedSettings.version);
        config.settings = Utils.merge(config.settings, savedSettings.settings);
        this.changed(config);
    };
    SettingsManager.getVersion = function (config) {
        if (!config || !config.isValid) {
            return 0;
        }
        var savedSettings = this.getSavedServerSettings(config);
        return savedSettings.version || 0;
    };
    SettingsManager.checkVersion = function (version, config) {
        var currentVersion = this.getVersion(config);
        if (version <= currentVersion) {
            return;
        }
        config.log.info("Updating settings from v" + currentVersion + " to v" + version);
        this.updateSettings(config, currentVersion);
    };
    SettingsManager.updateSettings = function (config, version) {
        var _this = this;
        if (!config || !config.enabled) {
            return;
        }
        var unableToUpdateMessage = 'Unable to update settings';
        if (!config.isValid) {
            config.log.error(unableToUpdateMessage + ": ApiKey is not set.");
            return;
        }
        if (!version || version < 0) {
            version = this.getVersion(config);
        }
        config.log.info("Checking for updated settings from: v" + version + ".");
        config.submissionClient.getSettings(config, version, function (response) {
            if (!config || !response || !response.success || !response.settings) {
                config.log.warn(unableToUpdateMessage + ": " + response.message);
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
            var newSettings = {
                version: response.settingsVersion,
                settings: response.settings
            };
            config.storage.settings.save(newSettings);
            config.log.info("Updated settings: v" + newSettings.version);
            _this.changed(config);
        });
    };
    SettingsManager.changed = function (config) {
        var handlers = this._handlers;
        for (var _i = 0, handlers_2 = handlers; _i < handlers_2.length; _i++) {
            var handler = handlers_2[_i];
            try {
                handler(config);
            }
            catch (ex) {
                config.log.error("Error calling onChanged handler: " + ex);
            }
        }
    };
    SettingsManager.getSavedServerSettings = function (config) {
        var item = config.storage.settings.get()[0];
        if (item && item.value && item.value.version && item.value.settings) {
            return item.value;
        }
        return { version: 0, settings: {} };
    };
    return SettingsManager;
}());
SettingsManager._handlers = [];
exports.SettingsManager = SettingsManager;
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
}());
exports.SubmissionResponse = SubmissionResponse;
var ExceptionlessClient = (function () {
    function ExceptionlessClient(settingsOrApiKey, serverUrl) {
        var _this = this;
        this.config = typeof settingsOrApiKey === 'object'
            ? new Configuration(settingsOrApiKey)
            : new Configuration({ apiKey: settingsOrApiKey, serverUrl: serverUrl });
        this.updateSettingsTimer(5000);
        this.config.onChanged(function (config) { return _this.updateSettingsTimer(_this._timeoutId > 0 ? 5000 : 0); });
        this.config.queue.onEventsPosted(function (events, response) { return _this.updateSettingsTimer(); });
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
        if (level) {
            builder = builder.setSource(sourceOrMessage).setMessage(message).setProperty('@level', level);
        }
        else if (message) {
            builder = builder.setSource(sourceOrMessage).setMessage(message);
        }
        else {
            builder = builder.setMessage(sourceOrMessage);
            try {
                var caller = this.createLog.caller;
                builder = builder.setSource(caller && caller.caller && caller.caller.name);
            }
            catch (e) {
                this.config.log.trace('Unable to resolve log source: ' + e.message);
            }
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
    ExceptionlessClient.prototype.createSessionStart = function () {
        return this.createEvent().setType('session');
    };
    ExceptionlessClient.prototype.submitSessionStart = function (callback) {
        this.createSessionStart().submit(callback);
    };
    ExceptionlessClient.prototype.submitSessionEnd = function (sessionIdOrUserId) {
        if (sessionIdOrUserId) {
            this.config.log.info("Submitting session end: " + sessionIdOrUserId);
            this.config.submissionClient.sendHeartbeat(sessionIdOrUserId, true, this.config);
        }
    };
    ExceptionlessClient.prototype.submitSessionHeartbeat = function (sessionIdOrUserId) {
        if (sessionIdOrUserId) {
            this.config.log.info("Submitting session heartbeat: " + sessionIdOrUserId);
            this.config.submissionClient.sendHeartbeat(sessionIdOrUserId, false, this.config);
        }
    };
    ExceptionlessClient.prototype.createEvent = function (pluginContextData) {
        return new EventBuilder({ date: new Date() }, this, pluginContextData);
    };
    ExceptionlessClient.prototype.submitEvent = function (event, pluginContextData, callback) {
        function cancelled(context) {
            if (!!context) {
                context.cancelled = true;
            }
            return !!callback && callback(context);
        }
        var context = new EventPluginContext(this, event, pluginContextData);
        if (!event) {
            return cancelled(context);
        }
        if (!this.config.enabled) {
            this.config.log.info('Event submission is currently disabled.');
            return cancelled(context);
        }
        if (!event.data) {
            event.data = {};
        }
        if (!event.tags || !event.tags.length) {
            event.tags = [];
        }
        EventPluginManager.run(context, function (ctx) {
            var config = ctx.client.config;
            var ev = ctx.event;
            if (!ctx.cancelled) {
                if (!ev.type || ev.type.length === 0) {
                    ev.type = 'log';
                }
                if (!ev.date) {
                    ev.date = new Date();
                }
                config.queue.enqueue(ev);
                if (ev.reference_id && ev.reference_id.length > 0) {
                    ctx.log.info("Setting last reference id '" + ev.reference_id + "'");
                    config.lastReferenceIdManager.setLast(ev.reference_id);
                }
            }
            !!callback && callback(ctx);
        });
    };
    ExceptionlessClient.prototype.updateUserEmailAndDescription = function (referenceId, email, description, callback) {
        var _this = this;
        if (!referenceId || !email || !description || !this.config.enabled) {
            return !!callback && callback(new SubmissionResponse(500, 'cancelled'));
        }
        var userDescription = { email_address: email, description: description };
        this.config.submissionClient.postUserDescription(referenceId, userDescription, this.config, function (response) {
            if (!response.success) {
                _this.config.log.error("Failed to submit user email and description for event '" + referenceId + "': " + response.statusCode + " " + response.message);
            }
            !!callback && callback(response);
        });
    };
    ExceptionlessClient.prototype.getLastReferenceId = function () {
        return this.config.lastReferenceIdManager.getLast();
    };
    ExceptionlessClient.prototype.updateSettingsTimer = function (initialDelay) {
        var _this = this;
        this.config.log.info("Updating settings timer with delay: " + initialDelay);
        this._timeoutId = clearTimeout(this._timeoutId);
        this._timeoutId = clearInterval(this._intervalId);
        var interval = this.config.updateSettingsWhenIdleInterval;
        if (interval > 0) {
            var updateSettings = function () { return SettingsManager.updateSettings(_this.config); };
            if (initialDelay > 0) {
                this._timeoutId = setTimeout(updateSettings, initialDelay);
            }
            this._intervalId = setInterval(updateSettings, interval);
        }
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
    return ExceptionlessClient;
}());
ExceptionlessClient._instance = null;
exports.ExceptionlessClient = ExceptionlessClient;
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
}());
exports.ContextData = ContextData;
var Configuration = (function () {
    function Configuration(configSettings) {
        this.defaultTags = [];
        this.defaultData = {};
        this.enabled = true;
        this.lastReferenceIdManager = new DefaultLastReferenceIdManager();
        this.settings = {};
        this._serverUrl = 'https://collector.exceptionless.io';
        this._heartbeatServerUrl = 'https://heartbeat.exceptionless.io';
        this._updateSettingsWhenIdleInterval = 120000;
        this._dataExclusions = [];
        this._userAgentBotPatterns = [];
        this._plugins = [];
        this._handlers = [];
        function inject(fn) {
            return typeof fn === 'function' ? fn(this) : fn;
        }
        configSettings = Utils.merge(Configuration.defaults, configSettings);
        this.log = inject(configSettings.log) || new NullLog();
        this.apiKey = configSettings.apiKey;
        this.serverUrl = configSettings.serverUrl;
        this.heartbeatServerUrl = configSettings.heartbeatServerUrl;
        this.updateSettingsWhenIdleInterval = configSettings.updateSettingsWhenIdleInterval;
        this.environmentInfoCollector = inject(configSettings.environmentInfoCollector);
        this.errorParser = inject(configSettings.errorParser);
        this.lastReferenceIdManager = inject(configSettings.lastReferenceIdManager) || new DefaultLastReferenceIdManager();
        this.moduleCollector = inject(configSettings.moduleCollector);
        this.requestInfoCollector = inject(configSettings.requestInfoCollector);
        this.submissionBatchSize = inject(configSettings.submissionBatchSize) || 50;
        this.submissionAdapter = inject(configSettings.submissionAdapter);
        this.submissionClient = inject(configSettings.submissionClient) || new DefaultSubmissionClient();
        this.storage = inject(configSettings.storage) || new InMemoryStorageProvider();
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
            this.changed();
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
                this._heartbeatServerUrl = value;
                this.log.info("serverUrl: " + value);
                this.changed();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "heartbeatServerUrl", {
        get: function () {
            return this._heartbeatServerUrl;
        },
        set: function (value) {
            if (!!value) {
                this._heartbeatServerUrl = value;
                this.log.info("heartbeatServerUrl: " + value);
                this.changed();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "updateSettingsWhenIdleInterval", {
        get: function () {
            return this._updateSettingsWhenIdleInterval;
        },
        set: function (value) {
            if (typeof value !== 'number') {
                return;
            }
            if (value <= 0) {
                value = -1;
            }
            else if (value > 0 && value < 15000) {
                value = 15000;
            }
            this._updateSettingsWhenIdleInterval = value;
            this.log.info("updateSettingsWhenIdleInterval: " + value);
            this.changed();
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
            exclusions[_i] = arguments[_i];
        }
        this._dataExclusions = Utils.addRange.apply(Utils, [this._dataExclusions].concat(exclusions));
    };
    Object.defineProperty(Configuration.prototype, "userAgentBotPatterns", {
        get: function () {
            var patterns = this.settings['@@UserAgentBotPatterns'];
            return this._userAgentBotPatterns.concat(patterns && patterns.split(',') || []);
        },
        enumerable: true,
        configurable: true
    });
    Configuration.prototype.addUserAgentBotPatterns = function () {
        var userAgentBotPatterns = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            userAgentBotPatterns[_i] = arguments[_i];
        }
        this._userAgentBotPatterns = Utils.addRange.apply(Utils, [this._userAgentBotPatterns].concat(userAgentBotPatterns));
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
        for (var _i = 0, plugins_1 = plugins; _i < plugins_1.length; _i++) {
            var p = plugins_1[_i];
            if (p.name === plugin.name) {
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
            return 'exceptionless-node/1.5.4';
        },
        enumerable: true,
        configurable: true
    });
    Configuration.prototype.useSessions = function (sendHeartbeats, heartbeatInterval) {
        if (sendHeartbeats === void 0) { sendHeartbeats = true; }
        if (heartbeatInterval === void 0) { heartbeatInterval = 30000; }
        if (sendHeartbeats) {
            this.addPlugin(new HeartbeatPlugin(heartbeatInterval));
        }
    };
    Configuration.prototype.useReferenceIds = function () {
        this.addPlugin(new ReferenceIdPlugin());
    };
    Configuration.prototype.useLocalStorage = function () {
    };
    Configuration.prototype.useDebugLogger = function () {
        this.log = new ConsoleLog();
    };
    Configuration.prototype.onChanged = function (handler) {
        !!handler && this._handlers.push(handler);
    };
    Configuration.prototype.changed = function () {
        var handlers = this._handlers;
        for (var _i = 0, handlers_3 = handlers; _i < handlers_3.length; _i++) {
            var handler = handlers_3[_i];
            try {
                handler(this);
            }
            catch (ex) {
                this.log.error("Error calling onChanged handler: " + ex);
            }
        }
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
    return Configuration;
}());
Configuration._defaultSettings = null;
exports.Configuration = Configuration;
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
}());
exports.SettingsResponse = SettingsResponse;
var EventBuilder = (function () {
    function EventBuilder(event, client, pluginContextData) {
        this._validIdentifierErrorMessage = 'must contain between 8 and 100 alphanumeric or \'-\' characters.';
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
    EventBuilder.prototype.setReferenceId = function (referenceId) {
        if (!this.isValidIdentifier(referenceId)) {
            throw new Error("ReferenceId " + this._validIdentifierErrorMessage);
        }
        this.target.reference_id = referenceId;
        return this;
    };
    EventBuilder.prototype.setEventReference = function (name, id) {
        if (!name) {
            throw new Error('Invalid name');
        }
        if (!id || !this.isValidIdentifier(id)) {
            throw new Error("Id " + this._validIdentifierErrorMessage);
        }
        this.setProperty('@ref:' + name, id);
        return this;
    };
    EventBuilder.prototype.setMessage = function (message) {
        if (!!message) {
            this.target.message = message;
        }
        return this;
    };
    EventBuilder.prototype.setGeo = function (latitude, longitude) {
        if (latitude < -90.0 || latitude > 90.0) {
            throw new Error('Must be a valid latitude value between -90.0 and 90.0.');
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new Error('Must be a valid longitude value between -180.0 and 180.0.');
        }
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
    EventBuilder.prototype.setUserDescription = function (emailAddress, description) {
        if (emailAddress && description) {
            this.setProperty('@user_description', { email_address: emailAddress, description: description });
        }
        return this;
    };
    EventBuilder.prototype.setManualStackingInfo = function (signatureData, title) {
        if (signatureData) {
            var stack = { signature_data: signatureData };
            if (title) {
                stack.title = title;
            }
            this.setProperty('@stack', stack);
        }
        return this;
    };
    EventBuilder.prototype.setManualStackingKey = function (manualStackingKey, title) {
        if (manualStackingKey) {
            var data = { ManualStackingKey: manualStackingKey };
            this.setManualStackingInfo(data, title);
        }
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
            tags[_i] = arguments[_i];
        }
        this.target.tags = Utils.addRange.apply(Utils, [this.target.tags].concat(tags));
        return this;
    };
    EventBuilder.prototype.setProperty = function (name, value, maxDepth, excludedPropertyNames) {
        if (!name || (value === undefined || value == null)) {
            return this;
        }
        if (!this.target.data) {
            this.target.data = {};
        }
        var result = JSON.parse(Utils.stringify(value, this.client.config.dataExclusions.concat(excludedPropertyNames || []), maxDepth));
        if (!Utils.isEmpty(result)) {
            this.target.data[name] = result;
        }
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
}());
exports.EventBuilder = EventBuilder;
var ConfigurationDefaultsPlugin = (function () {
    function ConfigurationDefaultsPlugin() {
        this.priority = 10;
        this.name = 'ConfigurationDefaultsPlugin';
    }
    ConfigurationDefaultsPlugin.prototype.run = function (context, next) {
        var config = context.client.config;
        var defaultTags = config.defaultTags || [];
        for (var _i = 0, defaultTags_1 = defaultTags; _i < defaultTags_1.length; _i++) {
            var tag = defaultTags_1[_i];
            if (!!tag && context.event.tags.indexOf(tag) < 0) {
                context.event.tags.push(tag);
            }
        }
        var defaultData = config.defaultData || {};
        for (var key in defaultData) {
            if (!!defaultData[key]) {
                var result = JSON.parse(Utils.stringify(defaultData[key], config.dataExclusions));
                if (!Utils.isEmpty(result)) {
                    context.event.data[key] = result;
                }
            }
        }
        next && next();
    };
    return ConfigurationDefaultsPlugin;
}());
exports.ConfigurationDefaultsPlugin = ConfigurationDefaultsPlugin;
var DuplicateCheckerPlugin = (function () {
    function DuplicateCheckerPlugin(getCurrentTime, interval) {
        if (getCurrentTime === void 0) { getCurrentTime = function () { return Date.now(); }; }
        if (interval === void 0) { interval = 30000; }
        var _this = this;
        this.priority = 1010;
        this.name = 'DuplicateCheckerPlugin';
        this._mergedEvents = [];
        this._processedHashcodes = [];
        this._getCurrentTime = getCurrentTime;
        this._interval = interval;
        setInterval(function () {
            while (_this._mergedEvents.length > 0) {
                _this._mergedEvents.shift().resubmit();
            }
        }, interval);
    }
    DuplicateCheckerPlugin.prototype.run = function (context, next) {
        var _this = this;
        function getHashCode(error) {
            var hashCode = 0;
            while (error) {
                if (error.message && error.message.length) {
                    hashCode += (hashCode * 397) ^ Utils.getHashCode(error.message);
                }
                if (error.stack_trace && error.stack_trace.length) {
                    hashCode += (hashCode * 397) ^ Utils.getHashCode(JSON.stringify(error.stack_trace));
                }
                error = error.inner;
            }
            return hashCode;
        }
        var error = context.event.data['@error'];
        var hashCode = getHashCode(error);
        if (hashCode) {
            var count = context.event.count || 1;
            var now_1 = this._getCurrentTime();
            var merged = this._mergedEvents.filter(function (s) { return s.hashCode === hashCode; })[0];
            if (merged) {
                merged.incrementCount(count);
                merged.updateDate(context.event.date);
                context.log.info('Ignoring duplicate event with hash: ' + hashCode);
                context.cancelled = true;
            }
            if (!context.cancelled && this._processedHashcodes.some(function (h) { return h.hash === hashCode && h.timestamp >= (now_1 - _this._interval); })) {
                context.log.trace('Adding event with hash: ' + hashCode);
                this._mergedEvents.push(new MergedEvent(hashCode, context, count));
                context.cancelled = true;
            }
            if (!context.cancelled) {
                context.log.trace('Enqueueing event with hash: ' + hashCode + 'to cache.');
                this._processedHashcodes.push({ hash: hashCode, timestamp: now_1 });
                while (this._processedHashcodes.length > 50) {
                    this._processedHashcodes.shift();
                }
            }
        }
        next && next();
    };
    return DuplicateCheckerPlugin;
}());
exports.DuplicateCheckerPlugin = DuplicateCheckerPlugin;
var MergedEvent = (function () {
    function MergedEvent(hashCode, context, count) {
        this.hashCode = hashCode;
        this._context = context;
        this._count = count;
    }
    MergedEvent.prototype.incrementCount = function (count) {
        this._count += count;
    };
    MergedEvent.prototype.resubmit = function () {
        this._context.event.count = this._count;
        this._context.client.config.queue.enqueue(this._context.event);
    };
    MergedEvent.prototype.updateDate = function (date) {
        if (date > this._context.event.date) {
            this._context.event.date = date;
        }
    };
    return MergedEvent;
}());
var EnvironmentInfoPlugin = (function () {
    function EnvironmentInfoPlugin() {
        this.priority = 80;
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
}());
exports.EnvironmentInfoPlugin = EnvironmentInfoPlugin;
var ErrorPlugin = (function () {
    function ErrorPlugin() {
        this.priority = 30;
        this.name = 'ErrorPlugin';
    }
    ErrorPlugin.prototype.run = function (context, next) {
        var ERROR_KEY = '@error';
        var ignoredProperties = [
            'arguments',
            'column',
            'columnNumber',
            'description',
            'fileName',
            'message',
            'name',
            'number',
            'line',
            'lineNumber',
            'opera#sourceloc',
            'sourceId',
            'sourceURL',
            'stack',
            'stackArray',
            'stacktrace'
        ];
        var exception = context.contextData.getException();
        if (!!exception) {
            context.event.type = 'error';
            if (!context.event.data[ERROR_KEY]) {
                var config = context.client.config;
                var parser = config.errorParser;
                if (!parser) {
                    throw new Error('No error parser was defined.');
                }
                var result = parser.parse(context, exception);
                if (!!result) {
                    var additionalData = JSON.parse(Utils.stringify(exception, config.dataExclusions.concat(ignoredProperties)));
                    if (!Utils.isEmpty(additionalData)) {
                        if (!result.data) {
                            result.data = {};
                        }
                        result.data['@ext'] = additionalData;
                    }
                    context.event.data[ERROR_KEY] = result;
                }
            }
        }
        next && next();
    };
    return ErrorPlugin;
}());
exports.ErrorPlugin = ErrorPlugin;
var EventExclusionPlugin = (function () {
    function EventExclusionPlugin() {
        this.priority = 45;
        this.name = 'EventExclusionPlugin';
    }
    EventExclusionPlugin.prototype.run = function (context, next) {
        function getLogLevel(level) {
            switch ((level || '').toLowerCase().trim()) {
                case 'trace':
                case 'true':
                case '1':
                case 'yes':
                    return 0;
                case 'debug':
                    return 1;
                case 'info':
                    return 2;
                case 'warn':
                    return 3;
                case 'error':
                    return 4;
                case 'fatal':
                    return 5;
                case 'off':
                case 'false':
                case '0':
                case 'no':
                    return 6;
                default:
                    return -1;
            }
        }
        function getMinLogLevel(settings, loggerName) {
            if (loggerName === void 0) { loggerName = '*'; }
            return getLogLevel(getTypeAndSourceSetting(settings, 'log', loggerName, 'Trace') + '');
        }
        function getTypeAndSourceSetting(settings, type, source, defaultValue) {
            if (settings === void 0) { settings = {}; }
            if (!type) {
                return defaultValue;
            }
            var isLog = type === 'log';
            var sourcePrefix = "@@" + type + ":";
            var value = settings[sourcePrefix + source];
            if (value) {
                return !isLog ? Utils.toBoolean(value) : value;
            }
            for (var key in settings) {
                if (Utils.startsWith(key.toLowerCase(), sourcePrefix.toLowerCase()) && Utils.isMatch(source, [key.substring(sourcePrefix.length)])) {
                    return !isLog ? Utils.toBoolean(settings[key]) : settings[key];
                }
            }
            return defaultValue;
        }
        var ev = context.event;
        var log = context.log;
        var settings = context.client.config.settings;
        if (ev.type === 'log') {
            var minLogLevel = getMinLogLevel(settings, ev.source);
            var logLevel = getLogLevel(ev.data['@level']);
            if (logLevel >= 0 && (logLevel > 5 || logLevel < minLogLevel)) {
                log.info('Cancelling log event due to minimum log level.');
                context.cancelled = true;
            }
        }
        else if (ev.type === 'error') {
            var error = ev.data['@error'];
            while (!context.cancelled && error) {
                if (getTypeAndSourceSetting(settings, ev.type, error.type, true) === false) {
                    log.info("Cancelling error from excluded exception type: " + error.type);
                    context.cancelled = true;
                }
                error = error.inner;
            }
        }
        else if (getTypeAndSourceSetting(settings, ev.type, ev.source, true) === false) {
            log.info("Cancelling event from excluded type: " + ev.type + " and source: " + ev.source);
            context.cancelled = true;
        }
        next && next();
    };
    return EventExclusionPlugin;
}());
exports.EventExclusionPlugin = EventExclusionPlugin;
var ModuleInfoPlugin = (function () {
    function ModuleInfoPlugin() {
        this.priority = 50;
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
}());
exports.ModuleInfoPlugin = ModuleInfoPlugin;
var RequestInfoPlugin = (function () {
    function RequestInfoPlugin() {
        this.priority = 70;
        this.name = 'RequestInfoPlugin';
    }
    RequestInfoPlugin.prototype.run = function (context, next) {
        var REQUEST_KEY = '@request';
        var config = context.client.config;
        var collector = config.requestInfoCollector;
        if (!context.event.data[REQUEST_KEY] && !!collector) {
            var requestInfo = collector.getRequestInfo(context);
            if (!!requestInfo) {
                if (Utils.isMatch(requestInfo.user_agent, config.userAgentBotPatterns)) {
                    context.log.info('Cancelling event as the request user agent matches a known bot pattern');
                    context.cancelled = true;
                }
                else {
                    context.event.data[REQUEST_KEY] = requestInfo;
                }
            }
        }
        next && next();
    };
    return RequestInfoPlugin;
}());
exports.RequestInfoPlugin = RequestInfoPlugin;
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
}());
exports.SubmissionMethodPlugin = SubmissionMethodPlugin;
var InMemoryStorage = (function () {
    function InMemoryStorage(maxItems) {
        this.items = [];
        this.lastTimestamp = 0;
        this.maxItems = maxItems;
    }
    InMemoryStorage.prototype.save = function (value) {
        if (!value) {
            return null;
        }
        var items = this.items;
        var timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
        var item = { timestamp: timestamp, value: value };
        if (items.push(item) > this.maxItems) {
            items.shift();
        }
        this.lastTimestamp = timestamp;
        return item.timestamp;
    };
    InMemoryStorage.prototype.get = function (limit) {
        return this.items.slice(0, limit);
    };
    InMemoryStorage.prototype.remove = function (timestamp) {
        var items = this.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].timestamp === timestamp) {
                items.splice(i, 1);
                return;
            }
        }
    };
    InMemoryStorage.prototype.clear = function () {
        this.items = [];
    };
    return InMemoryStorage;
}());
exports.InMemoryStorage = InMemoryStorage;
var KeyValueStorageBase = (function () {
    function KeyValueStorageBase(maxItems) {
        this.lastTimestamp = 0;
        this.maxItems = maxItems;
    }
    KeyValueStorageBase.prototype.save = function (value, single) {
        if (!value) {
            return null;
        }
        this.ensureIndex();
        var items = this.items;
        var timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
        var key = this.getKey(timestamp);
        var json = JSON.stringify(value);
        try {
            this.write(key, json);
            this.lastTimestamp = timestamp;
            if (items.push(timestamp) > this.maxItems) {
                this.delete(this.getKey(items.shift()));
            }
        }
        catch (e) {
            return null;
        }
        return timestamp;
    };
    KeyValueStorageBase.prototype.get = function (limit) {
        var _this = this;
        this.ensureIndex();
        return this.items.slice(0, limit)
            .map(function (timestamp) {
            var key = _this.getKey(timestamp);
            try {
                var json = _this.read(key);
                var value = JSON.parse(json, parseDate);
                return { timestamp: timestamp, value: value };
            }
            catch (error) {
                _this.safeDelete(key);
                return null;
            }
        })
            .filter(function (item) { return item != null; });
    };
    KeyValueStorageBase.prototype.remove = function (timestamp) {
        this.ensureIndex();
        var items = this.items;
        var index = items.indexOf(timestamp);
        if (index >= 0) {
            var key = this.getKey(timestamp);
            this.safeDelete(key);
            items.splice(index, 1);
        }
    };
    KeyValueStorageBase.prototype.clear = function () {
        var _this = this;
        this.items.forEach(function (item) { return _this.safeDelete(_this.getKey(item)); });
        this.items = [];
    };
    KeyValueStorageBase.prototype.ensureIndex = function () {
        if (!this.items) {
            this.items = this.createIndex();
            this.lastTimestamp = Math.max.apply(Math, [0].concat(this.items)) + 1;
        }
    };
    KeyValueStorageBase.prototype.safeDelete = function (key) {
        try {
            this.delete(key);
        }
        catch (error) {
        }
    };
    KeyValueStorageBase.prototype.createIndex = function () {
        var _this = this;
        try {
            var keys = this.readAllKeys();
            return keys.map(function (key) {
                try {
                    var timestamp = _this.getTimestamp(key);
                    if (!timestamp) {
                        _this.safeDelete(key);
                        return null;
                    }
                    return timestamp;
                }
                catch (error) {
                    _this.safeDelete(key);
                    return null;
                }
            }).filter(function (timestamp) { return timestamp != null; })
                .sort(function (a, b) { return a - b; });
        }
        catch (error) {
            return [];
        }
    };
    return KeyValueStorageBase;
}());
exports.KeyValueStorageBase = KeyValueStorageBase;
function parseDate(key, value) {
    var dateRegx = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/g;
    if (typeof value === 'string') {
        var a = dateRegx.exec(value);
        if (a) {
            return new Date(value);
        }
    }
    return value;
}
var NodeFileStorage = (function (_super) {
    __extends(NodeFileStorage, _super);
    function NodeFileStorage(namespace, folder, prefix, maxItems, fs) {
        if (prefix === void 0) { prefix = 'ex-'; }
        if (maxItems === void 0) { maxItems = 20; }
        var _this = _super.call(this, maxItems) || this;
        if (!folder) {
            folder = Path.join(Path.dirname(require.main.filename), '.exceptionless');
        }
        var subfolder = Path.join(folder, namespace);
        _this.directory = Path.resolve(subfolder);
        _this.prefix = prefix;
        _this.fs = fs ? fs : Fs;
        _this.mkdir(_this.directory);
        return _this;
    }
    NodeFileStorage.prototype.write = function (key, value) {
        this.fs.writeFileSync(key, value);
    };
    NodeFileStorage.prototype.read = function (key) {
        return this.fs.readFileSync(key, 'utf8');
    };
    NodeFileStorage.prototype.readAllKeys = function () {
        var _this = this;
        return this.fs.readdirSync(this.directory)
            .filter(function (file) { return file.indexOf(_this.prefix) === 0; })
            .map(function (file) { return Path.join(_this.directory, file); });
    };
    NodeFileStorage.prototype.delete = function (key) {
        this.fs.unlinkSync(key);
    };
    NodeFileStorage.prototype.getKey = function (timestamp) {
        return Path.join(this.directory, "" + this.prefix + timestamp + ".json");
    };
    NodeFileStorage.prototype.getTimestamp = function (key) {
        return parseInt(Path.basename(key, '.json')
            .substr(this.prefix.length), 10);
    };
    NodeFileStorage.prototype.mkdir = function (path) {
        var dirs = path.split(Path.sep);
        var root = '';
        while (dirs.length > 0) {
            var dir = dirs.shift();
            if (dir === '') {
                root = Path.sep;
            }
            if (!this.fs.existsSync(root + dir)) {
                this.fs.mkdirSync(root + dir);
            }
            root += dir + Path.sep;
        }
    };
    return NodeFileStorage;
}(KeyValueStorageBase));
exports.NodeFileStorage = NodeFileStorage;
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
}());
exports.NodeEnvironmentInfoCollector = NodeEnvironmentInfoCollector;
var NodeErrorParser = (function () {
    function NodeErrorParser() {
    }
    NodeErrorParser.prototype.parse = function (context, exception) {
        function getStackFrames(stackFrames) {
            var frames = [];
            for (var _i = 0, stackFrames_1 = stackFrames; _i < stackFrames_1.length; _i++) {
                var frame = stackFrames_1[_i];
                frames.push({
                    name: frame.getMethodName() || frame.getFunctionName(),
                    file_name: frame.getFileName(),
                    line_number: frame.getLineNumber() || 0,
                    column: frame.getColumnNumber() || 0,
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
            type: exception.name || 'Error',
            message: exception.message,
            stack_trace: getStackFrames(stackFrames)
        };
    };
    return NodeErrorParser;
}());
exports.NodeErrorParser = NodeErrorParser;
var NodeModuleCollector = (function () {
    function NodeModuleCollector() {
        this.initialized = false;
        this.installedModules = {};
    }
    NodeModuleCollector.prototype.getModules = function (context) {
        var _this = this;
        this.initialize();
        if (!require.main) {
            return [];
        }
        var modulePath = path.dirname(require.main.filename) + '/node_modules/';
        var pathLength = modulePath.length;
        var loadedKeys = Object.keys(require.cache);
        var loadedModules = {};
        loadedKeys.forEach(function (key) {
            var id = key.substr(pathLength);
            id = id.substr(0, id.indexOf('/'));
            loadedModules[id] = true;
        });
        return Object.keys(loadedModules)
            .map(function (key) { return _this.installedModules[key]; })
            .filter(function (m) { return m !== undefined; });
    };
    NodeModuleCollector.prototype.initialize = function () {
        var _this = this;
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        var output = child.spawnSync('npm', ['ls', '--depth=0', '--json']).stdout;
        if (!output) {
            return;
        }
        var json;
        try {
            json = JSON.parse(output.toString());
        }
        catch (e) {
            return;
        }
        var items = json.dependencies;
        if (!items) {
            return;
        }
        var id = 0;
        this.installedModules = {};
        Object.keys(items).forEach(function (key) {
            var item = items[key];
            var theModule = {
                module_id: id++,
                name: key,
                version: item.version
            };
            _this.installedModules[key] = theModule;
        });
    };
    return NodeModuleCollector;
}());
exports.NodeModuleCollector = NodeModuleCollector;
var NodeRequestInfoCollector = (function () {
    function NodeRequestInfoCollector() {
    }
    NodeRequestInfoCollector.prototype.getRequestInfo = function (context) {
        var REQUEST_KEY = '@request';
        if (!context.contextData[REQUEST_KEY]) {
            return null;
        }
        var exclusions = context.client.config.dataExclusions;
        var request = context.contextData[REQUEST_KEY];
        var requestInfo = {
            client_ip_address: request.ip,
            user_agent: request.headers['user-agent'],
            is_secure: request.secure,
            http_method: request.method,
            host: request.hostname || request.host,
            path: request.path,
            post_data: JSON.parse(Utils.stringify(request.body || {}, exclusions)),
            cookies: Utils.getCookies(request.headers.cookie, exclusions),
            query_string: JSON.parse(Utils.stringify(request.params || {}, exclusions))
        };
        var host = request.headers.host;
        var port = host && parseInt(host.slice(host.indexOf(':') + 1), 10);
        if (port > 0) {
            requestInfo.port = port;
        }
        return requestInfo;
    };
    return NodeRequestInfoCollector;
}());
exports.NodeRequestInfoCollector = NodeRequestInfoCollector;
var NodeFileStorageProvider = (function () {
    function NodeFileStorageProvider(folder, prefix, maxQueueItems) {
        if (maxQueueItems === void 0) { maxQueueItems = 250; }
        this.queue = new NodeFileStorage('q', folder, prefix, maxQueueItems);
        this.settings = new NodeFileStorage('settings', folder, prefix, 1);
    }
    return NodeFileStorageProvider;
}());
exports.NodeFileStorageProvider = NodeFileStorageProvider;
var NodeSubmissionAdapter = (function () {
    function NodeSubmissionAdapter() {
    }
    NodeSubmissionAdapter.prototype.sendRequest = function (request, callback, isAppExiting) {
        var _this = this;
        if (isAppExiting) {
            this.sendRequestSync(request, callback);
            return;
        }
        var parsedHost = url.parse(request.url);
        var options = {
            auth: "client:" + request.apiKey,
            headers: {},
            hostname: parsedHost.hostname,
            method: request.method,
            port: parsedHost.port && parseInt(parsedHost.port, 10),
            path: request.url
        };
        options.headers['User-Agent'] = request.userAgent;
        if (request.method === 'POST') {
            options.headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(request.data)
            };
        }
        var protocol = (parsedHost.protocol === 'https' ? https : http);
        var clientRequest = protocol.request(options, function (response) {
            var body = '';
            response.setEncoding('utf8');
            response.on('data', function (chunk) { return body += chunk; });
            response.on('end', function () { return _this.complete(response, body, response.headers, callback); });
        });
        clientRequest.on('error', function (error) { return callback && callback(500, error.message); });
        clientRequest.end(request.data);
    };
    NodeSubmissionAdapter.prototype.complete = function (response, responseBody, responseHeaders, callback) {
        var message;
        if (response.statusCode === 0) {
            message = 'Unable to connect to server.';
        }
        else if (response.statusCode < 200 || response.statusCode > 299) {
            message = response.statusMessage || response.message;
        }
        callback && callback(response.statusCode || 500, message, responseBody, responseHeaders);
    };
    NodeSubmissionAdapter.prototype.sendRequestSync = function (request, callback) {
        var requestJson = JSON.stringify(request);
        var res = child.spawnSync(process.execPath, [require.resolve('./submitSync.js')], {
            input: requestJson,
            stdio: ['pipe', 'pipe', process.stderr]
        });
        var out = res.stdout.toString();
        var result = JSON.parse(out);
        callback && callback(result.status, result.message, result.data, result.headers);
    };
    return NodeSubmissionAdapter;
}());
exports.NodeSubmissionAdapter = NodeSubmissionAdapter;
(function init() {
    if (typeof process === 'undefined') {
        return;
    }
    var defaults = Configuration.defaults;
    defaults.environmentInfoCollector = new NodeEnvironmentInfoCollector();
    defaults.errorParser = new NodeErrorParser();
    defaults.moduleCollector = new NodeModuleCollector();
    defaults.requestInfoCollector = new NodeRequestInfoCollector();
    defaults.submissionAdapter = new NodeSubmissionAdapter();
    Configuration.prototype.useLocalStorage = function () {
        this.storage = new NodeFileStorageProvider();
        SettingsManager.applySavedServerSettings(this);
        this.changed();
    };
    process.addListener('uncaughtException', function (error) {
        ExceptionlessClient.default.submitUnhandledException(error, 'uncaughtException');
    });
    process.on('exit', function (code) {
        function getExitCodeReason(exitCode) {
            if (exitCode === 1) {
                return 'Uncaught Fatal Exception';
            }
            if (exitCode === 3) {
                return 'Internal JavaScript Parse Error';
            }
            if (exitCode === 4) {
                return 'Internal JavaScript Evaluation Failure';
            }
            if (exitCode === 5) {
                return 'Fatal Exception';
            }
            if (exitCode === 6) {
                return 'Non-function Internal Exception Handler ';
            }
            if (exitCode === 7) {
                return 'Internal Exception Handler Run-Time Failure';
            }
            if (exitCode === 8) {
                return 'Uncaught Exception';
            }
            if (exitCode === 9) {
                return 'Invalid Argument';
            }
            if (exitCode === 10) {
                return 'Internal JavaScript Run-Time Failure';
            }
            if (exitCode === 12) {
                return 'Invalid Debug Argument';
            }
            return null;
        }
        var client = ExceptionlessClient.default;
        var message = getExitCodeReason(code);
        if (message !== null) {
            client.submitLog('exit', message, 'Error');
        }
        client.config.queue.process(true);
    });
    Error.stackTraceLimit = Infinity;
})();
//# sourceMappingURL=exceptionless.node.js.map
