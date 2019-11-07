var ThinkingAnalytics = require('./lib/thinkingdata-node');

var taBatch = ThinkingAnalytics.initWithBatchMode('b2a61feb9e56472c90c5bcb320dfb4ef', 'https://sdk.tga.thinkinggame.cn', {
  batchSize: 2,
  enableLog: true
});
var taDebug = ThinkingAnalytics.initWithDebugMode('b2a61feb9e56472c90c5bcb320dfb4ef', 'https://sdk.tga.thinkinggame.cn');
var taLogging = ThinkingAnalytics.initWithLoggingMode('.'); //, { rotateHourly: true, });

var ta = taLogging;

var event = {
  accountId: 'node_test',
  distinctId: 'node_distinct_id',
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
  var date = new Date();
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


for (var i = 0; i < 5; i++) {
  event.event = event.event + i;
  ta.track(event);
}


var userData = {
  accountId: 'node_test',
  properties: {
    prop_date: new Date(),
    prop_double: 134.12,
    prop_string: 'hello',
    prop_int: 666,
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

ta.close();