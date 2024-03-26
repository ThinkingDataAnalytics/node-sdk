const ThinkingData = require("../lib/thinkingdata-node");

ThinkingData.enableLog(true);

// // Debug
// let teSDK = ThinkingData.initWithDebugMode('appId', 'https://receiver-ta-uat.thinkingdata.cn/', {
//     dryRun: false, // report data to TE or not
//     deviceId: "123456789"
// });

// // report by http
// let teSDK = ThinkingData.initWithBatchMode('appid', 'https://receiver-ta-uat.thinkingdata.cn/', {
//     batchSize: 2,
//     compress: false // enable compress or not, default true
// });

// // report async by http
// let teSDK = ThinkingData.initWithAsyncBatchMode('appid', 'https://receiver-ta-uat.thinkingdata.cn/', {
//     batchSize: 10,
//     compress: false // enable compress or not, default true
// });

// write data to file, it works with LogBus
let teSDK = ThinkingData.initWithLoggingMode('./log', {
    filePrefix: 'test',
    rotateHourly: true
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
// testTrack();
// testUserProperty();

module.exports = {
    configSuperProperty,
    testTrack,
    testUserProperty,
}
