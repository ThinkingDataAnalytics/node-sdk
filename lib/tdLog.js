
const TDLogLevel = {
    OFF: 0,
    ERROR: 1,
    WARNING: 2,
    INFO: 3,
    DEBUG: 4,
};

const LOG_PREFIX = '[ThinkingData]';

class TDLog {
    static level = TDLogLevel.OFF;

    static info(message, ...optionalParams) {
        this._print(TDLogLevel.INFO, message, ...optionalParams);
    }

    static debug(message, ...optionalParams) {
        this._print(TDLogLevel.DEBUG, message, ...optionalParams);
    }

    static warning(message, ...optionalParams) {
        this._print(TDLogLevel.WARNING, message, ...optionalParams);
    }

    static error(message, ...optionalParams) {
        this._print(TDLogLevel.ERROR, message, ...optionalParams);
    }

    static _print(level, message, ...optionalParams) {
        if (level > this.level) {
            return;
        }
        let modeStr = ''
        switch (level) {
            case TDLogLevel.ERROR: {
                modeStr = '[Error]'
            } break;
            case TDLogLevel.WARNING: {
                modeStr = '[Warning]'
            } break;
            case TDLogLevel.INFO: {
                modeStr = '[Info]'
            } break;
            case TDLogLevel.DEBUG: {
                modeStr = '[Debug]'
            } break;
            default: {
                return;
            }
        }
        let timeNow = new Date();
        let logTime = '[' + timeNow.toLocaleDateString() + ' ' + timeNow.toLocaleTimeString() + '.' + timeNow.getMilliseconds() + ']';
        console.log(logTime + LOG_PREFIX + modeStr, message, ...optionalParams);
    }
}

module.exports = {
    TDLog,
    TDLogLevel,
}