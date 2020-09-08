var ThinkingAnalytics = require('./lib/thinkingdata-node');
//只能初始化一次

//选择是否压缩
consumerConfig = {
    compress : false
};
/*
var taBatch = ThinkingAnalytics.initWithBatchMode('appid', 'URL', {
    batchSize: 2,
    enableLog: true,
    compress :false//默认true 代表gzip压缩，false适合在内网设置
});
*/
//如果希望仅仅校验数据格式而不真正入库，可以通过 config 传入:
config = {
    dryRun: false
};
//var taDebug = ThinkingAnalytics.initWithDebugMode('appid', 'URL',config);

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
  distinctId: 'node_test',
  properties: {
    prop_date: new Date(),
    prop_double: 134.12,
    prop_string: 'hello',
    prop_int: 666,
    prop_array:['str1','str2'],
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
    properties:{
      prop_array:['str3','str4']
    }
});

ta.flush();
ta.close();
