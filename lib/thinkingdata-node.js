const http = require("http"),
    https = require("https"),
    url = require("url");

const _ = require("./tdUtils");
const LoggingConsumer = require("./tdLoggingConsumer");
const DebugConsumer = require("./tdDebugConsumer");
const BatchConsumer = require("./tdBatchConsumer");
const AsyncBatchConsumer = require("./tdAsyncBatchConsumer");
const {TDLog, TDLogLevel} = require("./tdLog");

const DEFAULT_PROPERTIES = {
    "#lib": "node",
    "#lib_version": _.version,
};

/**
 * Base event
 * @private
 */
class _TDBaseEvent {
    /**
     * Constructor track event
     * @param accountId {string} Account id. Distinct ID and account ID cannot be both empty
     * @param distinctId {string} Distinct id. Distinct ID and account ID cannot be both empty
     * @param properties {object} Custom properties
     * @param callback {function} Callback. Optional
     * @param appId {string} AppId. Optional
     */
    constructor(accountId, distinctId, properties, callback, appId) {
        this.accountId = accountId;
        this.distinctId = distinctId;
        this.properties = properties;
        this.callback = callback;
        this.appId = appId;
    }
}

/**
 * Track event
 */
class TDTrackEvent extends _TDBaseEvent {
    /**
     * Constructor track event
     * @param accountId {string} Account id. Distinct ID and account ID cannot be both empty
     * @param distinctId {string} Distinct id. Distinct ID and account ID cannot be both empty
     * @param properties {object} Custom properties
     * @param callback {function} Callback. Optional
     * @param appId {string} AppId. Optional
     * @param event {string} Event name
     * @param time {Date} Event time. Optional
     * @param ip {string} IP address: "123.123.123.123". Optional
     */
    constructor(accountId, distinctId, properties, callback, appId, event, time, ip) {
        super(accountId, distinctId, properties, callback, appId);
        this.event = event;
        this.time = time;
        this.ip = ip;
    }
}

/**
 * First event
 */
class TDTrackFirstEvent extends TDTrackEvent {
    /**
     * Constructor track event
     * @param accountId {string} Account id. Distinct ID and account ID cannot be both empty
     * @param distinctId {string} Distinct id. Distinct ID and account ID cannot be both empty
     * @param properties {object} Custom properties
     * @param callback {function} Callback. Optional
     * @param appId {string} AppId. Optional
     * @param event {string} Event name
     * @param time {Date} Event time. Optional
     * @param ip {string} IP address: "123.123.123.123". Optional
     * @param firstCheckId {string} First check id
     */
    constructor(accountId, distinctId, properties, callback, appId, event, time, ip, firstCheckId) {
        super(accountId, distinctId, properties, callback, appId, event, time, ip);
        this.firstCheckId = firstCheckId;
    }
}

/**
 * Updatable event
 */
class TDTrackUpdateEvent extends TDTrackEvent {
    /**
     * Constructor track event
     * @param accountId {string} Account id. Distinct ID and account ID cannot be both empty
     * @param distinctId {string} Distinct id. Distinct ID and account ID cannot be both empty
     * @param properties {object} Custom properties
     * @param callback {function} Callback. Optional
     * @param appId {string} AppId. Optional
     * @param event {string} Event name
     * @param time {Date} Event time. Optional
     * @param ip {string} IP address: "123.123.123.123". Optional
     * @param eventId {string} Event id
     */
    constructor(accountId, distinctId, properties, callback, appId, event, time, ip, eventId) {
        super(accountId, distinctId, properties, callback, appId, event, time, ip);
        this.eventId = eventId;
    }
}

/**
 * Overridable event
 */
class TDTrackOverwriteEvent extends TDTrackEvent {
    /**
     * Constructor track event
     * @param accountId {string} Account id. Distinct ID and account ID cannot be both empty
     * @param distinctId {string} Distinct id. Distinct ID and account ID cannot be both empty
     * @param properties {object} Custom properties
     * @param callback {function} Callback. Optional
     * @param appId {string} AppId. Optional
     * @param event {string} Event name
     * @param time {Date} Event time. Optional
     * @param ip {string} IP address: "123.123.123.123". Optional
     * @param eventId {string} Event id
     */
    constructor(accountId, distinctId, properties, callback, appId, event, time, ip, eventId) {
        super(accountId, distinctId, properties, callback, appId, event, time, ip);
        this.eventId = eventId;
    }
}

/**
 * User property event
 */
class TDUserProfileEvent extends _TDBaseEvent {
    /**
     * Constructor user event
     * @param accountId {string} Account id. Distinct ID and account ID cannot be both empty
     * @param distinctId {string} Distinct id. Distinct ID and account ID cannot be both empty
     * @param properties {object} Custom properties
     * @param callback {function} Callback. Optional
     * @param appId {string} AppId. Optional
     */
    constructor(accountId, distinctId, properties, callback, appId) {
        super(accountId, distinctId, properties, callback, appId);
    }
}

/**
 * User unset property event
 */
class TDUserUnsetEvent {
    /**
     * Constructor track event
     * @param accountId {string} Account id. Distinct ID and account ID cannot be both empty
     * @param distinctId {string} Distinct id. Distinct ID and account ID cannot be both empty
     * @param property {string} User property key
     * @param callback {function} Callback. Optional
     * @param appId {string} AppId. Optional
     */
    constructor(accountId, distinctId, property, callback, appId) {
        this.accountId = accountId;
        this.distinctId = distinctId;
        this.property = property;
        this.callback = callback;
        this.appId = appId;
    }
}

/**
 * Entry of SDK
 */
class TDAnalytics {
    /**
     * Construct SDK instance
     * @param consumer
     */
    constructor(consumer) {
        /**
         * Data consumer: DebugConsumer, BatchConsumer, LoggingConsumer, AsyncBatchConsumer
         * @type {Object}
         */
        this.consumer = consumer;
        /**
         * Super properties
         * @type {Object}
         */
        this.superProperties = {};
    }

    _basicCheck(params) {
        if (!_.check.isObject(params)) {
            return new Error("params for track must be an object");
        }

        if (!_.properties.userId(params.accountId) && !_.properties.userId(params.distinctId)) {
            return new Error("account ID and distinct ID cannot be empty at the same time");
        }

        return undefined;
    };

    /**
     * Report ordinary event
     * @param {TDTrackEvent} params Track event
     * @param {boolean} skipLocalCheck Skip local check or not, default is false
     */
    track(params, skipLocalCheck = false) {
        let callback = params.callback || function () {
        };
        if (!this._trackCheck(params, skipLocalCheck, callback)) {
            return;
        }
        this._sendRequest("track", params, callback);
    };

    /**
     * Report updatable event
     * @param {TDTrackUpdateEvent} params Update event
     * @param {boolean} skipLocalCheck Skip local check or not, default is false
     */
    trackUpdate(params, skipLocalCheck = false) {
        let callback = params.callback || function () {
        };
        if (!this._trackCheck(params, skipLocalCheck, callback)) {
            return;
        }
        if (!params.eventId) {
            callback(new Error("eventId cannot be empty"));
            return;
        }
        this._sendRequest("track_update", params, callback);
    };

    /**
     * Report overridable event
     * @param {TDTrackOverwriteEvent} params Override event
     * @param {boolean} skipLocalCheck Skip local check or not, default is false
     */
    trackOverWrite(params, skipLocalCheck = false) {
        let callback = params.callback || function () {
        };
        if (!this._trackCheck(params, skipLocalCheck, callback)) {
            return;
        }
        if (!params.eventId) {
            callback(new Error("eventId cannot be empty"));
            return;
        }
        this._sendRequest("track_overwrite", params, callback);
    };

    /**
     * Report first event
     * @param {TDTrackFirstEvent} params First event
     * @param {boolean} skipLocalCheck Skip local check or not, default is false
     */
    trackFirst(params, skipLocalCheck = false) {
        let callback = params.callback || function () {
        };
        if (!this._trackCheck(params, skipLocalCheck, callback)) {
            return;
        }
        if (!params.firstCheckId) {
            callback(new Error("firstCheckId cannot be empty"));
            return;
        }
        this._sendRequest("track", params, callback);
    };

    _trackCheck(params, skipLocalCheck, callback) {
        let err = this._basicCheck(params);
        if (err) {
            callback(err);
            return false;
        }
        if (!_.properties.name(params.event)) {
            callback(new Error("invalid event name"));
            return false;
        }
        if (!skipLocalCheck && !_.properties.properties(params.properties)) {
            callback(new Error("invalid properties"));
            return false;
        }
        return true;
    };

    /**
     * Set user properties. would overwrite existing names
     * @param {TDUserProfileEvent} params User event
     */
    userSet(params) {
        let callback = params.callback || function () {
        };

        let err = this._basicCheck(params);
        if (err) {
            callback(err);
            return;
        }

        if (!_.properties.propertiesMust(params.properties)) {
            callback(new Error("invalid properties"));
            return;
        }

        this._sendRequest("user_set", params, callback);
    };

    /**
     * Set user properties, If such property had been set before, this message would be neglected
     * @param {TDUserProfileEvent} params User event
     */
    userSetOnce(params) {
        let callback = params.callback || function () {
        };

        let err = this._basicCheck(params);
        if (err) {
            callback(err);
            return;
        }

        if (!_.properties.propertiesMust(params.properties)) {
            callback(new Error("invalid properties"));
            return;
        }

        this._sendRequest("user_setOnce", params, callback);
    };

    /**
     * Clear the user properties of users
     * @param {TDUserUnsetEvent} params User unset event
     */
    userUnset(params) {
        let callback = params.callback || function () {
        };

        let err = this._basicCheck(params);
        if (err) {
            callback(err);
            return;
        }

        if (!_.properties.name(params.property)) {
            callback(new Error("invalid property name: " + params.property));
            return;
        }

        let properties = {};
        properties[params.property] = 0;

        let userPropertyEvent = new TDUserProfileEvent(params.accountId, params.distinctId, properties, params.callback, params.appId);
        this._sendRequest("user_unset", userPropertyEvent, callback);
    };

    /**
     * To accumulate operations against the property
     * @param {TDUserProfileEvent} params User event
     */
    userAdd(params) {
        let callback = params.callback || function () {
        };

        let err = this._basicCheck(params);
        if (err) {
            callback(err);
            return;
        }

        if (!_.properties.propertiesMust(params.properties)) {
            callback(new Error("invalid properties"));
            return;
        }

        this._sendRequest("user_add", params, callback);
    };

    /**
     * To add user properties of array type
     * @param {TDUserProfileEvent} params User event
     */
    userAppend(params) {
        let callback = params.callback || function () {
        };

        let err = this._basicCheck(params);
        if (err) {
            callback(err);
            return;
        }

        if (!_.properties.propertiesMust(params.properties)) {
            callback(new Error("invalid properties"));
            return;
        }

        this._sendRequest("user_append", params, callback);
    };

    /**
     * Append user properties to array type by unique.
     * @param params {TDUserProfileEvent} User event
     */
    userUniqAppend(params) {
        let callback = params.callback || function () {
        };
        let err = this._basicCheck(params);
        if (err) {
            callback(err);
            return;
        }
        if (!_.properties.propertiesMust(params.properties)) {
            callback(new Error("invalid properties"));
            return;
        }

        this._sendRequest("user_uniq_append", params, callback);
    }

    /**
     * Delete a user
     * @param params {TDUserProfileEvent} User event
     */
    userDel(params) {
        let callback = params.callback || function () {
        };

        let err = this._basicCheck(params);
        if (err) {
            callback(err);
            return;
        }

        this._sendRequest("user_del", params, callback);
    };

    /**
     * Set common properties
     * @param {object} superProperties Common properties
     * @param {function} callback Callback error
     */
    setSuperProperties(superProperties, callback) {
        if (_.properties.properties(superProperties)) {
            _.extend(this.superProperties, superProperties);
        } else if (callback) {
            callback(new Error("Invalid superProperties"));
        }
    };

    /**
     * Clear common properties
     */
    clearSuperProperties() {
        this.superProperties = {};
    };

    /**
     * Set dynamic common properties, It has a higher priority than common properties
     *
     * @param {function} getDynamicProperties
     * @param {function} callback
     */
    setDynamicSuperProperties(getDynamicProperties, callback) {
        let err;
        if (typeof getDynamicProperties === "function") {
            if (_.properties.properties(getDynamicProperties())) {
                this.getDynamicProperties = getDynamicProperties;
            } else {
                err = new Error("Invalid return type of getDynamicProperties");
            }
        } else {
            err = new Error("getDynamicProperties must be a function");
        }

        if (callback && err) {
            callback(err);
        }
    };

    /**
     * Send request
     * @param type {string} Event type
     * @param eventData {TDTrackEvent | TDTrackFirstEvent | TDTrackUpdateEvent | TDTrackOverwriteEvent | TDUserProfileEvent} Event data
     * @param callback {function} Callback
     * @private
     */
    _sendRequest(type, eventData, callback) {
        let time = _.check.isUndefined(eventData.time) || !_.check.isDate(eventData.time)
            ? new Date()
            : eventData.time;

        let data = {
            "#type": type,
            "#time": _.formatDate(time),
        };

        if (eventData.distinctId) {
            data["#distinct_id"] = eventData.distinctId;
        }

        if (eventData.accountId) {
            data["#account_id"] = eventData.accountId;
        }

        if (eventData.ip) {
            data["#ip"] = eventData.ip;
        }

        if (eventData.event) {
            data["#event_name"] = eventData.event;
        }

        if (eventData.eventId) {
            data["#event_id"] = eventData.eventId;
        }

        if (eventData.firstCheckId) {
            data["#first_check_id"] = eventData.firstCheckId;
        }

        if (eventData.uuid) {
            data["#uuid"] = eventData.uuid;
        } else {
            data["#uuid"] = _.UUID();
        }

        if (eventData.appId) {
            data["#app_id"] = eventData.appId;
        }

        if (type === "track" ||
            type === "track_update" ||
            type === "track_overwrite") {
            data["properties"] = _.extend(
                {},
                DEFAULT_PROPERTIES,
                this.superProperties,
                this.getDynamicProperties ? this.getDynamicProperties() : {}
            );
        } else {
            data["properties"] = {};
        }

        if (
            _.check.isObject(eventData.properties) &&
            !_.check.isEmptyObject(eventData.properties)
        ) {
            _.extend(data.properties, eventData.properties);
        }

        _.searchObjDate(data);

        this.consumer.add(data, callback);
    };

    /**
     * Report data immediately. it is available on BatchMode.
     */
    flush(callback) {
        TDLog.info("flush by manual");
        this.consumer.flush(callback);
    };

    /**
     * Close and exit SDK.
     */
    close() {
        TDLog.info("SDK close");
        this.consumer.close();
    };
}

let _parseUrl = function (urlString) {
    let urlObj = new url.URL(urlString);
    let requestLib;
    if (urlObj.protocol === "http:") {
        requestLib = http;
    } else if (urlObj.protocol === "https:") {
        requestLib = https;
    } else {
        throw new Error("Unsupported url protocol: " + urlObj.protocol);
    }

    return {
        port: urlObj.port,
        hostname: urlObj.hostname,
        requestLib,
    };
};


/**
 * The data is reported one by one, and when an error occurs, the log will be printed on the console
 *
 * config include:
 *  - dryRun: true // you could set dryRun if you want check data only and don't report data to TE
 *  - deviceId: debug deviceId
 *
 * @param {string} appId app id
 * @param {string} serverUrl server url
 * @param {object} config (Optional) config
 * @return {TDAnalytics} SDK instance
 */
function initWithDebugMode(appId, serverUrl, config) {
    TDLog.info("consumer: debug consumer. AppId: " + appId + ", receiverUrl: " + serverUrl + ", deviceId: " + config.deviceId);

    let serverConfig = _parseUrl(serverUrl);
    config = config || {};
    serverConfig.dryRun = config.dryRun ? 1 : 0;
    serverConfig.deviceId = config.deviceId;
    return new TDAnalytics(DebugConsumer.init(appId, serverConfig));
}

/**
 * Upload data to TE by http
 *
 * config include:
 *  - batchSize: 30, // flush event count each time, default 20
 *  - compress: false, // enable http compress
 *
 * @param {string} appId (required) app id
 * @param {string} serverUrl (required) server url
 * @param {object} config (optional) config
 * @return {TDAnalytics} SDK instance
 */
function initWithBatchMode(appId, serverUrl, config) {
    let serverConfig = _parseUrl(serverUrl);
    TDLog.info("consumer: batch consumer. AppId: " + appId + ", receiverUrl: " + serverUrl);
    return new TDAnalytics(BatchConsumer.init(appId, serverConfig, config));
}

/**
 * Upload data to TE async by http
 *
 * config include:
 *  - batchSize: 30, // flush event count each time, default 20
 *  - compress: false, // enable http compress
 *
 * @param {string} appId App id
 * @param {string} serverUrl Server url
 * @param {object} config Config
 * @return {TDAnalytics} SDK instance
 */
function initWithAsyncBatchMode(appId, serverUrl, config) {
    let serverConfig = _parseUrl(serverUrl);
    TDLog.info("consumer: async batch consumer. AppId: " + appId + ", receiverUrl: " + serverUrl);
    return new TDAnalytics(AsyncBatchConsumer.init(appId, serverConfig, config));
}


/**
 * Write data to file, it works with LogBus
 *
 * The Logging Mode uses Winston to save data, you need to report data by LogBus.
 *
 * config(optional) include：
 * - rotateHourly: false(default) by the day; true by the hour.
 * - filePrefix:  file prefix
 *
 * @param {string} path File path
 * @param {object} config Consumer config
 * @return {TDAnalytics} SDK instance
 */
function initWithLoggingMode(path, config) {
    TDLog.info("consumer: log consumer. Log path: " + path);
    return new TDAnalytics(LoggingConsumer.init(path, config));
}

/**
 * Enable SDK log
 * @param enable
 */
function enableLog(enable) {
    if (enable === true) {
        TDLog.level = TDLogLevel.INFO;
    } else {
        TDLog.level = TDLogLevel.OFF;
    }
}

module.exports = {
    initWithDebugMode,
    initWithBatchMode,
    initWithAsyncBatchMode,
    initWithLoggingMode,
    enableLog
};
