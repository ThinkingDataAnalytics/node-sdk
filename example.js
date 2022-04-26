let ThinkingAnalytics = require('./lib/thinkingdata-node');
//只能初始化一次

//选择是否压缩
consumerConfig = {
    compress: false
};

let taBatch = ThinkingAnalytics.initWithBatchMode('cf918051b394495ca85d1b7787ad7243', 'https://receiver.ta.thinkingdata.cn', {
    batchSize: 2,
    enableLog: true,
    compress: false//默认true 代表gzip压缩，false适合在内网设置
});

// let taAsyncBatch = ThinkingAnalytics.initWithAsyncBatchMode('cf918051b394495ca85d1b7787ad7243', 'https://receiver.ta.thinkingdata.cn', {
//     batchSize: 10,
//     enableLog: true,
//     compress: false//默认true 代表gzip压缩，false适合在内网设置
// });
//如果希望仅仅校验数据格式而不真正入库，可以通过 config 传入:
config = {
    dryRun: false
};
//let taDebug = ThinkingAnalytics.initWithDebugMode('appid', 'URL',config);

// let taLogging = ThinkingAnalytics.initWithLoggingMode('.', { filePrefix: 'test' }); //, { rotateHourly: true, });

let ta = taBatch;

let event = {
    accountId: '',
    distinctId: 'a123213213213a123213213213a123213213213a123213213213a123213213213a123213213213a123213213213a123213213213a123213213213a123213213213',
    event: 'test_event',
    time: new Date(),
    ip: '202.38.64.1',
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

// 设置动态公共属性
ta.setDynamicSuperProperties(() => {
    let date = new Date();
    date.setYear(2018);
    return {
        super_date: date,
        super_int: 5,
    }
});

// 设置公共事件属性
ta.setSuperProperties({
    super_int: 8, // 不会出现在最终上报数据，因为会被动态公共属性覆盖.
    super_debug_string: 'hahahaha',
});

// setInterval(() => {
//     console.log('定时开始')
//     for (let i = 0; i < 5; i++) {
//         ta.track(event);
//     }
// }, 5000);

for (let i = 0; i < 5; i++) {
    event.event = event.event + i;
    ta.track(event);
}


let userData = {
    distinctId: 'node_test',
    uuid: 'f5394eef-e576-4709-9e4b-a7c231bd34a4',
    properties: {
        prop_date: new Date(),
        prop_double: 134.12,
        prop_string: 'hello',
        prop_int: 666,
        prop_array: ['str1', 'str2'],
        data: {
            "_id": "GPA.3311-4836-3043-35961",
            "platform": "googleplay",
            "productId": "com.superant.tripeaksadventure.level_sale",
            "purchaseToken": "okhgglkdpbfeiphjchdioedn.AO-J1OxesPpm03Zz2rb05o7Og-32xUzVaHD7Tpe3zXnA0s7OyFlJCblb9M8mYDx3ulIPSxvPgAH82Qbu6-oTB7X6i-jlQaNbdftx5EjxG8dIbjJcqYm9ufA",
            "purchaseTokenOriginal": "okhgglkdpbfeiphjchdioedn.AO-J1OxesPpm03Zz2rb05o7Og-32xUzVaHD7Tpe3zXnA0s7OyFlJCblb9M8mYDx3ulIPSxvPgAH82Qbu6-oTB7X6i-jlQaNbdftx5EjxG8dIbjJcqYm9ufA",
            "coin": 12000,
            "numPrice": 1.99,
            "group": 1,
            "couponId": -1,
            "canPlayLevel": 5425,
            "currentLevel": 4735,
            "isRandomLevel": 0,
            "status": "completed",
            "client_status": "uncompleted",
            "userId": "UzWxTsS*8",
            "datetime": "2021-04-23T09:22:12.691Z",
            "date": {
                "year": 2021,
                "month": 4,
                "day": 23
            }
        },
    },
    callback(e) {
        if (e) {
            console.log(e);
        }
    }
};

// 设置用户属性
ta.userSet(userData);

// 累加用户属性
ta.userAdd({
    accountId: 'node_test',
    properties: {
        prop_double: 0.6,
        prop_int: 222,
    }
});


//删除用户某一个属性
ta.userUnset({
    accountId: 'node_test',
    property: 'prop_double'
});

ta.userAppend({
    accountId: 'node_test',
    properties: {
        prop_array: ['str3', 'str4']
    }
});

ta.userUniqAppend({
    accountId: 'node_test',
    properties: {
        prop_array: ['str3', 'str4']
    }
});

ta.flush();
ta.close();
