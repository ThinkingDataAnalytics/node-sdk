# ThinkingData Analytics API for Node.js

thinkingdata-node 是数数科技提供给客户，方便客户导入用户数据的 Node.js 接口实现。如需了解详细信息，请参考 [数数科技官方网站](https://www.thinkingdata.cn).

### 一、集成 SDK

#### 1. 安装 SDK

```sh
# 获取 SDK
npm install thinkingdata-node --save
```
#### 2. 创建 SDK 实例
首先在代码文件开头引入 `thinkingdata-node`:
```js
var ThinkingAnalytics = require('thinkingdata-node')
```

为使用 SDK 上传数据，需首先初始化 SDK. 我们提供了三种初始化方法:
```js
// Debug Mode: 逐条发送，并返回详细的错误信息
var ta = ThinkingAnalytics.initWithDebugMode('APP-ID', 'https://SERVER_URL');

// Batch Mode：批量发送到接收端
var ta = ThinkingAnalytics.initWithBatchMode('APP-ID', 'https://SERVER_URL');

// Logging Mode: 将数据写入本地日志文件，需要配合 LogBus 使用
var ta = ThinkingAnalytics.initWithLoggingMode('/PATH/TO/DATA');
```

三种模式说明如下:

**(1) Debug Mode**: 逐条实时向 TA 服务器传输数据，当数据格式错误时会返回详细的错误信息。建议先使用 DebugConsumer 校验数据格式。初始化传入项目 APP ID 和接收端地址.

**(2) Batch Mode**: 批量实时地向 TA 服务器传输数据，不需要搭配传输工具。在网络条件不好的情况下有可能会导致数据丢失，因此不建议在生产环境中大量使用. 初始化传入项目 APP ID 和接收端地址.

Batch Mode 会先将数据存放在缓冲区中，当数据条数超过设定的值(batchSize, 默认为20)，触发上报. 您也可以在初始化 SDK 的时候指定传入配置:
```js
// 初始化 SDK, 指定接收端地址、APP ID、缓冲区大小
var ta = ThinkingAnalytics.initWithBatchMode('APP-ID', 'https://SERVER_URL', {
	batchSize: 10, // 缓存数据到达 10 条时触发上报
	enableLog: true // 允许打印发送数据. 当开启日志的时候会打印详细的发送日志
	});
```

**(3) Log Mode**: 将数据实时写入本地文件，文件以天/小时切分，并需要与 LogBus 搭配使用进行数据上传

 Logging Mode 使用 log4js 将数据实时保存为本地日志文件，后续需要配合 LogBus 将日志文件导入到 TA 数据库中。默认情况下日志按天切分。如果应用运行在 pm2 模式下，需要传入对应的配置，并且安装 pm2-intercom: `pm2 install pm2-intercom`

 可以在初始化 SDK 的时候传入 config 对象. config 对象支持的参数有：
 - rotateHourly: false(默认) 按天切分；true 按小时切分.
 - pm2: 当使用 pm2 的时候，需要设置
 - pm2InstanceVar: 默认为 'NODE_APP_INSTANCE', 如果改变了该配置，需要传入对应的变量名

```js
// 初始化 SDK，按小时切分日志文件.
var ta = ThinkingAnalytics.initWithLoggingMode('.', { rotateHourly: true});
```

#### 3. 上报数据
SDK 初始化完成后，后续即可使用 ta 的接口来上报数据.

### 使用示例

#### a. 发送事件
您可以调用 track 来上传事件，建议您根据预先梳理的文档来设置事件的属性以及发送信息的条件。上传事件示例如下：
```js
// 定义事件数据
var event = {
	// 账号 ID （可选)
	accountId: 'node_test',
	// 访客 ID （可选)，账号 ID 和访客 ID 不可以都为空
	distinctId: 'node_distinct_id',
	// 事件名称 （必填)
	event: 'test_event',
	// 事件时间 (可选) 如果不填，将以调用接口时的时间作为事件时间
	time: new Date(),
	// 事件 IP (可选) 当传入 IP 地址时，后台可以解析所在地
	ip: '202.38.64.1',
	// 事件属性 (可选)
    properties: {
        prop_date: new Date(),
        prop_double: 134.1,
        prop_string: 'hello world',
        prop_int: 67,
	},
	// 出错时回调 (可选)
    callback(e) {
        if (e) {
            console.log(e);
        }
    }
};

// 上传事件
ta.track(event);
```

参数说明：
* 事件的名称只能以字母开头，可包含数字，字母和下划线“_”，长度最大为 50 个字符，对字母大小写不敏感
* 事件的属性是 map 类型，其中每个元素代表一个属性
* 事件属性的 Key 值为属性的名称，为 string 类型，规定只能以字母开头，包含数字，字母和下划线“_”，长度最大为 50 个字符，对字母大小写不敏感
* 事件属性的 Value 值为该属性的值，支持支持 string、数值类型、bool、time.Time

SDK 会在本地对数据格式做校验，如果希望跳过本地校验，可以在调用 track 接口的时候传入 skipLocalCheck 参数:
```js
// 跳过本地数据校验
ta.track(event, true);
```

#### 2. 设置公共事件属性
公共事件属性是每个事件都会包含的属性. 也可以设置动态公共属性。如果有相同的属性，则动态公共属性会覆盖公共事件属性。

```js

// 设置动态公共属性
ta.setDynamicSuperProperties(()=>{
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

// 清空公共事件属性
ta.clearSuperProperties();
```

#### 3. 设置用户属性
对于一般的用户属性，您可以调用 userSet 来进行设置. 使用该接口上传的属性将会覆盖原有的属性值，如果之前不存在该用户属性，则会新建该用户属性:
```js
// 用户属性数据
var userData = {
	// 账号 ID （可选)
	accountId: 'node_test',
	// 访客 ID （可选)，账号 ID 和访客 ID 不可以都为空
	distinctId: 'node_distinct_id',
	// 用户属性
    properties: {
        prop_date: new Date(),
        prop_double: 134.12,
        prop_string: 'hello',
        prop_int: 666,
	},
	// 出错时回调 (可选)
    callback(e) {
        if (e) {
            console.log(e);
        }
    }
};

// 设置用户属性
ta.userSet(userData);
```
如果您要上传的用户属性只要设置一次，则可以调用 userSetOnce 来进行设置，当该属性之前已经有值的时候，将会忽略这条信息:
```js
ta.userSetOnce(userData);
```
当您要上传数值型的属性时，可以调用 userAdd 来对该属性进行累加操作，如果该属性还未被设置，则会赋值 0 后再进行计算:
```js
// 累加用户属性
ta.userAdd({
    accountId: 'node_test',
    properties: {
        Amount: 222,
    }
});

```
如果您要删除某个用户，可以调用 userDelete 将这名用户删除. 之后您将无法再查询该用户的用户属性，但该用户产生的事件仍然可以被查询到:
```js
// 删除用户
ta.userDel({
	// 账号 ID （可选)
	accountId: 'node_test',
	// 访客 ID （可选)，账号 ID 和访客 ID 不可以都为空
	distinctId: 'node_distinct_id',
});
```

#### 4. 立即进行数据 IO
此操作与具体的 Consumer 实现有关. 在收到数据时, Consumer 可以先将数据存放在缓冲区, 并在一定情况下触发真正的数据 IO 操作, 以提高整体性能. 在某些情况下需要立即提交数据，可以调用 Flush 接口:
```js
// 立即提交数据到相应的接收端
ta.flush();
```

#### 5. 关闭 SDK
请在退出程序前调用本接口，以避免缓存内的数据丢失:
```js
// 关闭并退出 SDK
ta.close();
```

#### 6 打开日志
设置环境变量 NODE_DEBUG=tda, 可以打开日志.
