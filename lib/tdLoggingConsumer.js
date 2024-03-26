const {TDLog} = require("./tdLog");
const winston = require("winston");
require("winston-daily-rotate-file");

class TDLoggingConsumer {
    constructor(filePath, config) {
        this.logger = null;
        if (!config || !config.filePrefix) {
            this.filePrefix = filePath + '/log';
        } else {
            this.filePrefix = filePath + '/' + config.filePrefix + '.log';
        }
        this._init(config);
    }

    _init(config) {
        const myFormat = winston.format.printf(({ message }) => message);
        const taLogConfiguration = {
            transports: [
                new winston.transports.DailyRotateFile({
                    filename: this.filePrefix,
                    datePattern: config.rotateHourly === true ? 'yyyy-MM-DD-HH' : 'yyyy-MM-DD',
                    format: myFormat,
                    level: "info",
                    zippedArchive: false
                })
            ]
        };
        this.logger = winston.createLogger(taLogConfiguration);
    }

    flush() {
    }

    add(msg, callback) {
        let eventStr = JSON.stringify(msg);
        TDLog.info('Enqueue event:', eventStr);

        try {
            this.logger.info(eventStr);
            TDLog.info('flush event');
        } catch (e) {
            if (callback) {
                callback(e);
            }
        }
    }

    close(callback) {
        callback = callback || function () {
        };
        this.logger.close(callback);
    }
}

module.exports = {
    init: function (path, config) {
        return new TDLoggingConsumer(path, config);
    }
}
