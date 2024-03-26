let Buffer = require('buffer').Buffer,
    zlib = require('zlib'),
    _ = require('./tdUtils');
const {TDLog} = require("./tdLog");

const DEFAULT_BATCH_SIZE = 20;

class TDBatchConsumer {
    /**
     * Construct batch consumer. You don't need call it directly
     * @param appId {string} app id
     * @param serverConfig {object} server config
     * @param consumerConfig {object} config
     */
    constructor(appId, serverConfig, consumerConfig = {}) {
        this.config = serverConfig;
        this.appId = appId;
        this.buffer = [];
        this.batchSize = consumerConfig.batchSize || DEFAULT_BATCH_SIZE;
        this.compress = consumerConfig.compress !== false;
    }

    add(msg, callback) {
        let eventStr = JSON.stringify(msg);
        TDLog.info('Enqueue event:', eventStr);

        this.buffer.push(eventStr);
        if (this.buffer.length >= this.batchSize) {
            this.flush(callback);
        }
    }

    flush(callback) {
        if (this.buffer.length === 0) {
            return;
        }

        TDLog.info('flush buffer event, count:', this.buffer.length);

        callback = callback || function () {
        };

        let request_options = {
            host: this.config.hostname,
            port: this.config.port,
            headers: {
                'Content-Type': 'application/plaintext',
                'appid': this.appId,
                'compress': this.compress ? 'gzip' : 'none',
                'TA-Integration-Type': 'Node',
                'TA-Integration-Version': _.version,
                'TA-Integration-Count': this.buffer.length.toString()
            },
            method: 'POST',
            path: '/sync_server',
        };

        const content = Buffer.from('[' + this.buffer.join(',') + ']', 'utf-8');
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
        let request = this.config.requestLib.request(request_options, function (res) {
            if (res.statusCode === 200) {
                let resp = "";
                res.on('data', function (chunk) {
                    resp += chunk;
                });
                res.on('end', function () {
                    let e;
                    try {
                        let result = JSON.parse(resp);
                        TDLog.info('Send event, response =', result);

                        if (result.code !== 0) {
                            e = new Error('Unexpected result code: ' + result.code + ', msg: ' + result.msg);
                        }
                    } catch (ex) {
                        TDLog.error('parse response error:', ex);
                        e = new Error("Could not parse response from ThinkingAnalytics");
                    }

                    callback(e);
                });
            } else {
                callback(new Error("Unexpected status code: " + res.statusCode));
            }
        });

        request.on('error', function (e) {
            TDLog.error('http error:', e.message);
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
        return new TDBatchConsumer(appId, serverConfig, consumerConfig);
    }
}
