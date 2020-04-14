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

    this.compress = consumerConfig.compress === false ? false : true;
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
      port:this.config.port,
      headers: {
        'Content-Type': 'application/plaintext',
        'appid': this.appId,
        'compress': this.compress ? 'gzip' : 'none',
      },
      method: 'POST',
      path: '/sync_server',
    };

    const content = Buffer.from('[' + this.buffer.join(',') + ']', 'utf-8');
    if (this.enableLog) {
      _.log('Sending: ' + content.toString('utf-8'));
    }

    this.buffer = [];

    if (this.compress) {
      zlib.gzip(content, (err, buffer) => {
        if (err) {
            callback(err);
            return;
        }

        request_options.headers['Content-Length'] = Buffer.byteLength(buffer);
        this._request(request_options, buffer, callback);
      });
    } else {
      request_options.headers['Content-Length'] = content.length;
      this._request(request_options, content, callback);
    }
  }

  _request(request_options, data, callback) {
    var enableLog = this.enableLog;
    var request = this.config.requestLib.request(request_options, function (res) {
      if (res.statusCode === 200) {
        var resp = "";
        res.on('data', function (chunk) {
          resp += chunk;
        });
        res.on('end', function () {
          var e;
          try {
            var result = JSON.parse(resp);
            if (enableLog) {
              _.log('Response from TA server: ', result);
            }

            if (result.code != 0) {
              e = new Error('Unexpected result code: ' + result.code + ', msg: ' + result.msg);
            }
          } catch (ex) {
            _.log(ex);
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

    request.write(data);
    request.end();
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