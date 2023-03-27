const ThinkingEngine = require("../lib/thinkingdata-node");

// // Debug
// let teSDK = ThinkingEngine.initWithDebugMode('appId', 'serverUrl', {
//     dryRun: false, // report data to TE or not
//     deviceId: "123456789"
// });

// // report by http
// let teSDK = ThinkingEngine.initWithBatchMode('appid', 'serverUrl', {
//     batchSize: 2,
//     enableLog: true,
//     compress: false // enable compress or not, default true
// });

// // report async by http
// let teSDK = ThinkingEngine.initWithAsyncBatchMode('appid', 'serverUrl', {
//     batchSize: 10,
//     enableLog: true,
//     compress: false // enable compress or not, default true
// });

// // If you are also using log4js in your project you will need to pass in your own config file
// // otherwise it will fail to write to the log
// let yourOwnLog4jsConfigExample = {
//     appenders: {
//         you_console: {
//             type: 'console',
//             layout: {
//                 type: 'pattern', pattern: '%[[%d{yyyy-MM-dd hh:mm:ss.SSS}]-[%p]-[pid=%z]-[%f{1}-%l] %m%]'
//             }
//         },
//     },
//     categories: {
//         you_categories: {
//             appenders: ['you_console'],
//             level: 'info'
//         }
//     },
// };
// let teSDK = ThinkingEngine.initWithLoggingMode('./log/te', {
//     filePrefix: 'test',
//     rotateHourly: true,
//     pm2: false,
// }, yourOwnLog4jsConfigExample);

// write data to file, it works with LogBus
let teSDK = ThinkingEngine.initWithLoggingMode('./log/te', {
    filePrefix: 'test',
    rotateHourly: true,
    pm2: false,
});

function configSuperProperty() {
    // dynamic common properties
    teSDK.setDynamicSuperProperties(() => {
        let date = new Date();
        return {
            super_date: date,
            super_int: 5,
        }
    });

    // common properties
    teSDK.setSuperProperties({
        super_int: 8,
        super_debug_string: 'hello',
    });
}

function testTrack() {
    let trackEvent = {
        accountId: '2222',
        distinctId: '1111',
        event: 'test_event',
        time: new Date(),
        ip: '202.38.64.1',
        properties: {
            prop_double: 134.1,
        },
        callback(e) {
            if (e) {
                console.log(e);
            }
        }
    };

    teSDK.track(trackEvent)

    let trackFirstEvent = {
        accountId: '2222',
        distinctId: '1111',
        event: 'test_event',
        firstCheckId: 'first_check_id',
        time: new Date(),
        properties: {
            prop_date: new Date(),
            prop_double: 134.1,
            prop_string: 'hello world',
            prop_int: 67,
        },
        callback(e) {
            if (e) {
                console.log(e);
            }
        }
    };

    teSDK.trackFirst(trackFirstEvent);


    let trackUpdateEvent = {
        accountId: '2222',
        distinctId: '1111',
        event: 'test_event',
        eventId: 'event_id',
        time: new Date(),
        properties: {
            prop_date: new Date(),
            prop_double: 134.1,
            prop_string: 'hello world',
            prop_int: 67,
        },
        callback(e) {
            if (e) {
                console.log(e);
            }
        }
    };

    teSDK.trackUpdate(trackUpdateEvent);


    let trackOverwriteEvent = {
        accountId: '2222',
        distinctId: '1111',
        event: 'test_event',
        eventId: 'event_id',
        time: new Date(),
        properties: {
            prop_date: new Date(),
            prop_double: 134.1,
            prop_string: 'hello world',
            prop_int: 67,
        },
        callback(e) {
            if (e) {
                console.log(e);
            }
        }
    };

    teSDK.trackOverWrite(trackOverwriteEvent);

    teSDK.flush();
}

function testUserProperty() {
    let userSetData = {
        accountId: 'node_test',
        properties: {
            prop_date: new Date(),
            prop_double: 134.12,
            prop_string: 'hello',
            prop_int: 666,
            prop_array: ['str1', 'str2'],
        },
        callback(e) {
            if (e) {
                console.log(e);
            }
        }
    };

    teSDK.userSet(userSetData);

    teSDK.userUnset({
        accountId: 'node_test',
        property: 'set_once_property'
    });

    teSDK.userSetOnce({
        accountId: 'node_test',
        properties: {
            setOnceProperty: "set_once",
        }
    });

    teSDK.userAdd({
        accountId: 'node_test',
        properties: {
            prop_double: 0.6,
            prop_int: 222,
        }
    });

    teSDK.userAppend({
        accountId: 'node_test',
        properties: {
            prop_array: ['str3', 'str4']
        }
    });

    teSDK.userUniqAppend({
        accountId: 'node_test',
        properties: {
            prop_array: ['str3', 'str4']
        }
    });

    teSDK.flush();
}

// configSuperProperty();
testTrack();
// testUserProperty();

module.exports = {
    configSuperProperty,
    testTrack,
    testUserProperty,
}