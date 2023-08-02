const taUtils = require('./utils');
const log4js = require('log4js');
const fs = require("fs");

// hook log4js.configure
let oldLog4jsConfigure = log4js.configure;
log4js.configure = function (configurationFileOrObject) {
    let configObject = configurationFileOrObject;
    if (typeof configObject === "string") {
        configObject = loadConfigurationFile(configurationFileOrObject);
    }
    configObject.appenders = Object.assign(taLog4jsConfiguration.appenders, configObject.appenders);
    configObject.categories = Object.assign(taLog4jsConfiguration.categories, configObject.categories);
    oldLog4jsConfigure(configObject);
}

function loadConfigurationFile(filename) {
    try {
        return JSON.parse(fs.readFileSync(filename, "utf8").toString());
    } catch (e) {
        throw new Error(
            `Problem reading config from file "${filename}". Error was ${e.message}`
        );
    }
}

// log4js 的配置文件
let taLog4jsConfiguration = {
    appenders: {},
    categories: {},
};

class LoggingConsumer {
    constructor(filePath, config, log4jsConfig) {
        this.logger = null;
        this.logName = 'TDAnalytics';

        this.customLog4jsConfig = log4jsConfig;
        if (typeof log4jsConfig === "string") {
            this.customLog4jsConfig = loadConfigurationFile(log4jsConfig);
        }

        if (!config || !config.filePrefix) {
            this.filePrefix = filePath + '/log';
        } else {
            this.filePrefix = filePath + '/' + config.filePrefix + '.log';
        }
        this._init(config);
    }

    _init(config) {
        config = config || {};
        taLog4jsConfiguration = {
            appenders: {
                ta_dateFile: {
                    type: 'dateFile',
                    filename: this.filePrefix,
                    pattern: config.rotateHourly === true ? 'yyyy-MM-dd-hh' : 'yyyy-MM-dd',
                    alwaysIncludePattern: true,
                    layout: {
                        type: 'pattern',
                        pattern: '%m',
                    },
                    numBackups: 10000000
                },
                ta_out: {
                    type: 'console',
                    layout: {
                        type: 'pattern', pattern: '%[[%d{yyyy-MM-dd hh:mm:ss.SSS}]-[%p]-[pid=%z]-[%f{1}-%l] %m%]'
                    }
                },
            },
            categories: {
                TDAnalytics: {
                    appenders: ['ta_dateFile'],
                    level: 'info'
                },
                default: {
                    appenders: ['ta_out'],
                    level: 'info'
                },
            },
        };

        if (config.disableClustering !== undefined) {
            taLog4jsConfiguration.disableClustering = config.disableClustering;
        }

        if (config.pm2 === true) {
            taLog4jsConfiguration.pm2 = true;
        }

        if (taUtils.check.isString(config.pm2InstanceVar)) {
            taLog4jsConfiguration.pm2InstanceVar = config.pm2InstanceVar;
        }

        if (this.customLog4jsConfig) {
            taLog4jsConfiguration.appenders = Object.assign(this.customLog4jsConfig.appenders, taLog4jsConfiguration.appenders);
            taLog4jsConfiguration.categories = Object.assign(this.customLog4jsConfig.categories, taLog4jsConfiguration.categories);
        }

        log4js.configure(taLog4jsConfiguration);
        this.logger = log4js.getLogger(this.logName);
    }

    flush() {
    }

    add(msg, callback) {
        try {
            this.logger.info(JSON.stringify(msg));
        } catch (e) {
            if (callback) {
                callback(e);
            }
        }
    }

    close(callback) {
        callback = callback || function () {
        };
        log4js.shutdown(callback);
    }
}

module.exports = {
    init: function (path, config, log4jsConfig) {
        taUtils.log('Initializing LoggingConsumer: ', path, config, log4jsConfig);
        return new LoggingConsumer(path, config, log4jsConfig);
    }
}