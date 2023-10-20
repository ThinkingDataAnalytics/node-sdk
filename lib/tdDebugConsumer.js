let querystring = require('querystring'),
  Buffer = require('buffer').Buffer,
  _ = require('./tdUtils');
const {TDLog} = require("./tdLog");

class TDDebugConsumer {
  /**
   * Construct debug consumer. You don't need call it directly
   * @param appId app id
   * @param serverConfig config
   */
  constructor(appId, serverConfig) {
    this.config = serverConfig;
    this.appId = appId;
  }

  add(msg, callback) {
    let eventStr = JSON.stringify(msg);
    TDLog.info('Enqueue event:', eventStr);

    callback = callback || function () {};

    let postObject = {
      'data': eventStr,
      'source': 'server',
      'appid': this.appId,
      'dryRun': this.config.dryRun,
    };

    if (this.config.deviceId) {
      postObject["deviceId"] = this.config.deviceId;
    }

    // 上报数据
    const postData = querystring.stringify(postObject);

    let request_options = {
      host: this.config.hostname,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
      port: this.config.port,
      method: 'POST',
      path: '/data_debug',
    };

    let request = this.config.requestLib.request(request_options, function (res) {
      if (res.statusCode === 200) {
        let data = "";
        res.on('data', function (chunk) {
          data += chunk;
        });

        res.on('end', function () {
          let e;
          try {
            let result = JSON.parse(data);
            TDLog.info('Send event, response =', result);

            if (result.errorLevel !== 0) {
              e = new Error('Unexpected result code: ' + result.errorLevel + ', msg: ' + JSON.stringify(result));
            }
          } catch (ex) {
            TDLog.error('parse response error:', ex);
            e = new Error("Could not parse response from ThinkingAnalytics");
          }

          callback(e);
        });

      } else {
        TDLog.error('Unexpected status code =', res.statusCode);
        callback(new Error("Unexpected status code: " + res.statusCode));
      }
    });

    request.on('error', function (e) {
      TDLog.error('http error:', e.message);
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
    return new TDDebugConsumer(appId, serverConfig);
  }
}