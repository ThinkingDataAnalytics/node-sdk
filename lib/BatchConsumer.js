var Buffer = require('buffer').Buffer,
  zlib = require('zlib'),
  _ = require('./utils');

const DEFAULT_BATCH_SIZE = 20;

class BatchConsumer {
  constructor(appId, serverConfig, consumerConfig) {
    this.config = serverConfig;
    this.appId = appId;
    this.buffer = [];
    var consumerConfig = consumerConfig || {};
    this.batchSize = consumerConfig.batchSize || DEFAULT_BATCH_SIZE;
    this.enableLog = consumerConfig.enableLog;
  }

  add(msg, callback) {
    if (this.enableLog) {
      _.log('adding the following data to buffer: \n', msg);
    }
    this.buffer.push(JSON.stringify(msg));
    if (this.buffer.length >= this.batchSize) {
      this.flush(callback);
    }
  }

  flush(callback) {
    callback = callback || function () {};

    var request_options = {
      host: this.config.hostname,
      headers: {
        'Content-Type': 'application/plaintext',
        'appid': this.appId,
      },
      method: 'POST',
      path: '/logagent',
    };

    var requestLib = this.config.requestLib;

    const content = Buffer.from('[' + this.buffer.join(',') + ']', 'utf-8');
    if (this.enableLog) {
      _.log('Sending: ' + content.toString('utf-8'));
    }
    this.buffer = [];

    var enableLog = this.enableLog;

    zlib.gzip(content, (err, buffer) => {
      if (err) {
        callback(err);
        return;
      }

      request_options.headers['Content-Length'] = Buffer.byteLength(buffer.toString('base64'));

      var request = requestLib.request(request_options, function (res) {
        if (res.statusCode === 200) {
          var data = "";
          res.on('data', function (chunk) {
            data += chunk;
          });

          res.on('end', function () {
            var e;
            try {
              var result = JSON.parse(data);
              if (enableLog) {
                _.log('Response from TA server: ', result);
              }

              if (result.code != 0) {
                e = new Error('Unexpected result code: ' + result.code + ', msg: ' + result.msg);
              }
            } catch (ex) {
              e = new Error("Could not parse response from ThinkingAnalytics");
            }

            callback(e);
          });

        } else {
          callback(new Error("Unexpected status code: " + res.statusCode));
        }
      });

      request.on('error', function (e) {
        _.log("Got Error: " + e.message);
        callback(e);
      });

      request.write(buffer.toString('base64'));
      request.end();
    });
  }

  close() {
    this.flush();
  }
}

module.exports = {
  init: function (appId, serverConfig, consumerConfig) {
    _.log('Initializing BatchConsumer with: ', appId, serverConfig, consumerConfig);
    return new BatchConsumer(appId, serverConfig, consumerConfig);
  }
}