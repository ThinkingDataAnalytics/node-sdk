const http = require("http"),
    https = require("https"),
    url = require("url");

const _ = require("./utils");
const LoggingConsumer = require("./LoggingConsumer");
const DebugConsumer = require("./DebugConsumer");
const BatchConsumer = require("./BatchConsumer");
const AsyncBatchConsumer = require("./AsyncBatchConsumer");

const DEFAULT_PROPERTIES = {
    "#lib": "node",
    "#lib_version": _.version,
};

/**
 * create TE SDK instant
 */
let _createClient = function (consumer) {
    let ta = {};
    ta.consumer = consumer;
    ta.superProperties = {};

    ta._basicCheck = function (params) {
        if (!_.check.isObject(params)) {
            return new Error("params for track must be an object");
        }

        if (!_.properties.userId(params.accountId) && !_.properties.userId(params.distinctId)) {
            return new Error("account ID and distinct ID cannot be empty at the same time");
        }

        return undefined;
    };

    /**
     * report ordinary event.
     *
     * params include:
     * - event: required {string} : event name
     * - accountId: optional : account ID
     * - distinctId: optional : distinct ID and account ID cannot be both empty
     * - time: optional {Date} : event time
     * - ip: optional : event ip
     * - properties: optional {object} : properties
     * - callback {function} : callback error
     * @param {object} params 
     * @param {boolean} skipLocalCheck skip local check or not, default is false
     */
    ta.track = function (params, skipLocalCheck = false) {
        let callback = params.callback || function () {
        };
        if (!ta._trackCheck(params, skipLocalCheck, callback)) {
            return;
        }
        ta._sendRequest("track", params, callback);
    };

    /**
     * report updatable event.
     *
     * params include:
     * - event: required {string} : event name
     * - eventId : required {string} : event id
     * - accountId: optional : account ID
     * - distinctId: optional : distinct ID and account ID cannot be both empty
     * - time: optional {Date} : event time
     * - ip: optional : event ip
     * - properties: optional {object} : properties
     * - callback {function} : callback error
     * @param {object} params
     * @param {boolean} skipLocalCheck skip local check or not, default is false
     */
    ta.trackUpdate = function (params, skipLocalCheck = false) {
        let callback = params.callback || function () {
        };
        if (!ta._trackCheck(params, skipLocalCheck, callback)) {
            return;
        }
        if (!params.eventId) {
            callback(new Error("eventId cannot be empty"));
            return;
        }
        ta._sendRequest("track_update", params, callback);
    };

    /**
     * report overwritable event.
     *
     * params include:
     * - event: required {string} : event name
     * - eventId : required {string} : event id
     * - accountId: optional : account ID
     * - distinctId: optional : distinct ID and account ID cannot be both empty
     * - time: optional {Date} : event time
     * - ip: optional : event ip
     * - properties: optional {object} : properties
     * - callback {function} : callback error
     *
     * @param {object} params
     * @param {boolean} skipLocalCheck skip local check or not, default is false
     */
    ta.trackOverWrite = function (params, skipLocalCheck = false) {
        let callback = params.callback || function () {
        };
        if (!ta._trackCheck(params, skipLocalCheck, callback)) {
            return;
        }
        if (!params.eventId) {
            callback(new Error("eventId cannot be empty"));
            return;
        }
        ta._sendRequest("track_overwrite", params, callback);
    };

    /**
     * report first event.
     *
     * params include:
     * - event: required {string} : event name
     * - firstCheckId : required {string} : it is flag of the first event
     * - accountId: optional : accountId id
     * - distinctId: optional : distinct ID and account ID cannot be both empty
     * - time: optional {Date} : event time
     * - ip: optional : event ip
     * - properties: optional {object} : properties
     * - callback {function} : callback error
     *
     * @param {object} params
     * @param {boolean} skipLocalCheck skip local check or not, default is false
     */
    ta.trackFirst = function (params, skipLocalCheck = false) {
        let callback = params.callback || function () {
        };
        if (!ta._trackCheck(params, skipLocalCheck, callback)) {
            return;
        }
        if (!params.firstCheckId) {
            callback(new Error("firstCheckId cannot be empty"));
            return;
        }
        ta._sendRequest("track", params, callback);
    };

    ta._trackCheck = function (params, skipLocalCheck, callback) {
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
     * set user properties. would overwrite existing names
     *
     * params include:
     * - accountId: optional : accountId id
     * - distinctId: optional : distinct ID and account ID cannot be both empty
     * - properties: required {object} : properties
     * - callback: optional {function} : callback error
     *
     * @param {object} params
     */
    ta.userSet = function (params) {
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

        ta._sendRequest("user_set", params, callback);
    };

    /**
     * set user properties, If such property had been set before, this message would be neglected
     *
     * params include:
     * - accountId: optional : accountId id
     * - distinctId: optional : distinct ID and account ID cannot be both empty
     * - properties: required {object} : properties
     * - callback: optional {function} : callback error
     *
     * @param {object} params
     */
    ta.userSetOnce = function (params) {
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

        ta._sendRequest("user_setOnce", params, callback);
    };

    /**
     * clear the user properties of users
     *
     * params include:
     * - accountId: optional : accountId id
     * - distinctId: optional : distinct ID and account ID cannot be both empty
     * - property: optional {string} : properties
     * - callback: optional {function} : callback error
     *
     * @param {object} params
     */
    ta.userUnset = function (params) {
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
        params.properties = properties;
        ta._sendRequest("user_unset", params, callback);
    };

    /**
     * to accumulate operations against the property.
     *
     * params include:
     * - accountId: optional : accountId id
     * - distinctId: optional : distinct ID and account ID cannot be both empty
     * - properties: required {object} : properties
     * - callback: optional {function} : callback error
     *
     * @param {object} params
     */
    ta.userAdd = function (params) {
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

        ta._sendRequest("user_add", params, callback);
    };

    /**
     * to add user properties of array type
     *
     * params include:
     * - accountId: optional : accountId id
     * - distinctId: optional : distinct ID and account ID cannot be both empty
     * - properties: required {object} : properties
     * - callback: optional {function} : callback error
     *
     * @param {object} params
     */
    ta.userAppend = function (params) {
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

        ta._sendRequest("user_append", params, callback);
    };

    /**
     * append user properties to array type by unique.
     * @param {*} params 
     * - accountId: optional {string} : accountId id
     * - distinctId: optional {string} : distinct ID and account ID cannot be both empty
     * - properties: required {object} : properties must be array type
     * - callback: optional {function} : callback error
     */
    ta.userUniqAppend = function (params) {
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

        ta._sendRequest("user_uniq_append", params, callback);
    }

    /**
     * delete a user
     *
     * params include:
     * - accountId: optional {string} : accountId id
     * - distinctId: optional {string} : distinct ID and account ID cannot be both empty
     * - callback: optional {function} : callback error
     *
     * @param {object} params
     */
    ta.userDel = function (params) {
        let callback = params.callback || function () {
        };

        let err = this._basicCheck(params);
        if (err) {
            callback(err);
            return;
        }

        ta._sendRequest("user_del", params, callback);
    };

    /**
     * set common properties
     *
     * @param {object} superProperties common properties
     * @param {function} callback callback error
     */
    ta.setSuperProperties = function (superProperties, callback) {
        if (_.properties.properties(superProperties)) {
            _.extend(ta.superProperties, superProperties);
        } else if (callback) {
            callback(new Error("Invalid superProperties"));
        }
    };

    /**
     * clear common properties
     */
    ta.clearSuperProperties = function () {
        ta.superProperties = {};
    };

    /**
     * set dynamic common properties, It has a higher priority than common properties
     *
     * @param {function} getDynamicProperties
     * @param {function} callback
     */
    ta.setDynamicSuperProperties = function (getDynamicProperties, callback) {
        let err;
        if (typeof getDynamicProperties === "function") {
            if (_.properties.properties(getDynamicProperties())) {
                ta.getDynamicProperties = getDynamicProperties;
            } else {
                err = new Error("Invalid return type of getDynamicProperties");
            }
        } else {
            err = new Error("getDynamicProperties must be a funciton");
        }

        if (callback && err) {
            callback(err);
        }
    };

    ta._sendRequest = function (type, eventData, callback) {
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
                ta.superProperties,
                ta.getDynamicProperties ? ta.getDynamicProperties() : {}
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
     * report data immediately. it is available on BatchMode.
     */
    ta.flush = function (callback) {
        ta.consumer.flush(callback);
    };

    /**
     * close and exit SDK.
     */
    ta.close = function () {
        ta.consumer.close();
    };

    return ta;
};

let _parseUrl = function (urlString) {
    let urlObj = url.parse(urlString);
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

// module exporting
module.exports = {
    /**
     * The data is reported one by one, and when an error occurs, the log will be printed on the console
     *
     * you could set dryRun if you want check data only and don't report data to TE
     * {
     *   dryRun: true
     * }
     *
     * @param {string} appId app id
     * @param {string} serverUrl server url
     * @param {object} config (Optional) config
     */
    initWithDebugMode: function (appId, serverUrl, config) {
        let serverConfig = _parseUrl(serverUrl);
        config = config || {};
        serverConfig.dryRun = config.dryRun ? 1 : 0;
        serverConfig.deviceId = config.deviceId;
        return _createClient(DebugConsumer.init(appId, serverConfig));
    },

    /**
     * upload data to TE by http
     *
     * config include:
     *   {
     *     batchSize: 30, // flush event count each time, default 20
     *     enableLog: true, // enable log or not
     *   }
     *
     * @param {string} appId (required) app id
     * @param {string} serverUrl (required) server url
     * @param {object} config (optional) config
     */
    initWithBatchMode: function (appId, serverUrl, config) {
        let serverConfig = _parseUrl(serverUrl);
        return _createClient(BatchConsumer.init(appId, serverConfig, config));
    },

    /**
     * upload data to TE async by http
     * 
     * @param {string} appId
     * @param {string} serverUrl
     * @param {object} config
     * @returns 
     */
    initWithAsyncBatchMode: function (appId, serverUrl, config) {
        let serverConfig = _parseUrl(serverUrl);
        return _createClient(AsyncBatchConsumer.init(appId, serverConfig, config));
    },

    /**
     * write data to file, it works with LogBus
     *
     * The Logging Mode uses log4js to save data, you need to report data by LogBus.
     *
     * config(optional) include：
     * - rotateHourly: false(default) by the day; true by the hour.
     * - filePrefix:  file prefix
     * - pm2: This parameter must be set to true if the app runs in a pm2 environment
     * - pm2InstanceVar: You need to set this parameter, If you add the 'instance_var' in the pm2 configuration file
     *
     * @param {string} path
     * @param {object} config
     * @param {object | string} log4jsConfig If you are also using log4js in your project you will need to pass in your own config file.
     * otherwise it will fail to write to the log
     */
    initWithLoggingMode: function (path, config, log4jsConfig) {
        return _createClient(LoggingConsumer.init(path, config, log4jsConfig));
    },
};
