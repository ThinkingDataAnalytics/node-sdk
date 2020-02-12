var querystring = require('querystring'),
  Buffer = require('buffer').Buffer,
  _ = require('./utils');

/**
 * DebugConsumer 会逐条向 TA 服务器上报数据. 当出错时会返回详细的出错原因数据.
 */
class DebugConsumer {
  constructor(appId, serverConfig) {
    this.config = serverConfig;
    this.appId = appId;
  }

  add(msg, callback) {
    _.log('adding the following message: \n', msg);
    callback = callback || function () {};

    // 上报数据
    const postData = querystring.stringify({
      'data': JSON.stringify(msg),
      'source': 'server',
      'appid': this.appId,
      'dryRun': this.config.dryRun,
    });

    var request_options = {
      host: this.config.hostname,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
      method: 'POST',
      path: '/data_debug',
    };

    var request = this.config.requestLib.request(request_options, function (res) {
      if (res.statusCode === 200) {
        var data = "";
        res.on('data', function (chunk) {
          data += chunk;
        });

        res.on('end', function () {
          var e;
          try {
            var result = JSON.parse(data);
            _.log('Response from TA server: ', result);

            if (result.errorLevel != 0) {
              e = new Error('Unexpected result code: ' + result.errorLevel + ', msg: ' + JSON.stringify(result));
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

    request.write(postData);
    request.end();
  }

  flush() {}

  close() {}
}

module.exports = {
  init: function (appId, serverConfig) {
    return new DebugConsumer(appId, serverConfig);
  }
}