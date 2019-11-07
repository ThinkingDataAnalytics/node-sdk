var log4js = require('log4js'),
  _ = require('./utils');

class LoggingConsumer {
  constructor(filePath, config) {
    this.currentFileName = null;
    this.logger = null;
    this.logName = 'TDAnalytics';
    this.filePrefix = filePath + '/log';
    this._init(config);
  }

  _init(config) {
    var config = config || {};
    var configuration = {
      appenders: {
        out: {
          type: 'dateFile',
          filename: this.filePrefix,
          pattern: config.rotateHourly === true ? 'yyyy-MM-dd-hh' : 'yyyy-MM-dd',
          alwaysIncludePattern: true,
          layout: {
            type: 'pattern',
            pattern: '%m',
          },
        },
      },
      categories: {
        default: {
          appenders: ['out'],
          level: 'info'
        },
      },
    };

    if (config.pm2 === true) {
      configuration.pm2 = true;
    }

    if (_.check.isString(config.pm2InstanceVar)) {
      configuration.pm2InstanceVar = config.pm2InstanceVar;
    }

    log4js.configure(configuration);
    this.logger = log4js.getLogger(this.logName);
  }

  flush() {}

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
    callback = callback || function () {};
    log4js.shutdown(callback);
  }
}

module.exports = {
  init: function (path, config) {
    _.log('Initializing LoggingConsumer with: ', path, config);
    return new LoggingConsumer(path, config);
  }
}