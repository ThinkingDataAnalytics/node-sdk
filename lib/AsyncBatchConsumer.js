let Buffer = require('buffer').Buffer,
    zlib = require('zlib'),
    _ = require('./utils');

const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_INTERVAL = 3000;
let timerId;
class AsyncBatchConsumer {
    constructor(appId, serverConfig, consumerConfig = {}) {
        this.config = serverConfig;
        this.appId = appId;
        this.buffer = [];
        this.batchSize = consumerConfig.batchSize || DEFAULT_BATCH_SIZE;
        this.interval = consumerConfig.interval || DEFAULT_INTERVAL;
        this.enableLog = consumerConfig.enableLog;
        this.compress = consumerConfig.compress !== false;
        let timer = null;
        let run = () => {
            this.flush()
            timer = setTimeout(run, this.interval);
        };
        timerId = setTimeout(run, this.interval);
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

        if (this.buffer.length === 0) {
            return;
        }
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
        let enableLog = this.enableLog;
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
                        if (enableLog) {
                            _.log('Response from TA server: ', result);
                        }

                        if (result.code !== 0) {
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
        clearTimeout(timerId)
        this.flush();
    }

}

module.exports = {
    init: function (appId, serverConfig, consumerConfig) {
        _.log('Initializing AsyncBatchConsumer with: ', appId, serverConfig, consumerConfig);
        return new AsyncBatchConsumer(appId, serverConfig, consumerConfig);
    }
}