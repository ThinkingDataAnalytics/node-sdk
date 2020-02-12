const http = require('http'),
  https = require('https'),
  url = require('url');

const _ = require('./utils');
const LoggingConsumer = require('./LoggingConsumer');
const DebugConsumer = require('./DebugConsumer');
const BatchConsumer = require('./BatchConsumer');

const DEFAULT_PROPERTIES = {
  '#lib': 'node',
  '#lib_version': '1.1.0',
};

/**
 * 内部函数，创建 ta 实例
 */
var _createClient = function (consumer) {
  var ta = {};
  ta.consumer = consumer;
  ta.superProperties = {};

  ta._basicCheck = function (params) {
    if (!_.check.isObject(params)) {
      return new Error('params for track must be an object');
    }

    if (!_.properties.userId(params.accountId) && !_.properties.userId(params.distinct_id)) {
      return new Error('account ID and distinct ID cannot be empty at the same time');
    }

    return undefined;
  };

  /**
   * 上报事件. 在上传事件数据（名称、属性）的时候，需要同时在参数对象中指明该事件关联的用户 ID.
   *
   * params 为参数对象，其属性包括:
   * - event: required {string} 事件名称
   * - accountId: optional 账号 ID
   * - distinctId: optional 访客 ID，账号 ID 和访客 ID 不能同时为空
   * - time: optional {Date} 事件时间
   * - ip: optional 事件发生的 IP 地址
   * - properties: optional {object} 事件属性
   * - callback {function} 回调, 参数为 Error 对象. 出错时会调用该回调
   *
   * 默认情况下，事件属性会经过本地检查，不符合预定设置的格式的数据将不会发起上报。在某些情况下，用户希望跳过本地检查，
   * 则需要传入 skipLocalCheck 参数，并将其值设为 true.
   *
   * @param {object} params 事件相关参数
   * @param {boolean} skipLocalCheck 跳过本地属性检查
   */
  ta.track = function (params, skipLocalCheck) {
    var callback = params.callback || function () {};

    var err = this._basicCheck(params);
    if (err) {
      callback(err);
      return;
    }

    if (!_.properties.name(params.event)) {
      callback(new Error('invalid event name'));
      return;
    }

    if (!skipLocalCheck && !_.properties.properties(params.properties)) {
      callback(new Error('invalid properties'));
      return;
    }

    ta._sendRequest({
      type: 'track',
      event: params.event,
      accountId: params.accountId,
      distinctId: params.distinctId,
      ip: params.ip,
      time: _.check.isDate(params.time) ? params.time : new Date(),
      properties: params.properties,
    }, callback);
  };

  /**
   * 设置用户属性. 如果属性值已存在，则会覆盖之前属性值.
   *
   * params 为参数对象，其属性包括:
   * - accountId: optional 账号 ID
   * - distinctId: optional 访客 ID，账号 ID 和访客 ID 不能同时为空
   * - properties: required {object} 用户属性
   * - callback: optional {function} 回调, 参数为 Error 对象. 出错时会调用该回调
   *
   * @param {object} params 参数对象
   */
  ta.userSet = function (params) {
    var callback = params.callback || function () {};

    var err = this._basicCheck(params);
    if (err) {
      callback(err);
      return;
    }

    if (!_.properties.propertiesMust(params.properties)) {
      callback(new Error('invalid properties'));
      return;
    }

    ta._sendRequest({
      type: 'user_set',
      accountId: params.accountId,
      distinctId: params.distinctId,
      ip: params.ip,
      properties: params.properties,
    }, callback);
  };

  /**
   * 设置用户属性. 如果属性值已存在， 则丢弃本次操作.
   *
   * params 为参数对象，其属性包括:
   * - accountId: optional 账号 ID
   * - distinctId: optional 访客 ID，账号 ID 和访客 ID 不能同时为空
   * - properties: required {object} 用户属性
   * - callback: optional {function} 回调, 参数为 Error 对象. 出错时会调用该回调
   *
   * @param {object} params 参数对象
   */
  ta.userSetOnce = function (params) {
    var callback = params.callback || function () {};

    var err = this._basicCheck(params);
    if (err) {
      callback(err);
      return;
    }

    if (!_.properties.propertiesMust(params.properties)) {
      callback(new Error('invalid properties'));
      return;
    }

    ta._sendRequest({
      type: 'user_setOnce',
      accountId: params.accountId,
      distinctId: params.distinctId,
      ip: params.ip,
      properties: params.properties,
    }, callback);
  };

  /**
   * 删除用户属性.
   *
   * params 的属性包括:
   * - accountId: optional 账号 ID
   * - distinctId: optional 访客 ID，账号 ID 和访客 ID 不能同时为空
   * - property: optional {string} 需要删除的用户属性名称
   * - callback: optional {function} 回调, 参数为 Error 对象. 出错时会调用该回调
   *
   * @param {object} params
   */
  ta.userUnset = function (params) {
    var callback = params.callback || function () {};

    var err = this._basicCheck(params);
    if (err) {
      callback(err);
      return;
    }

    if (!_.properties.name(params.property)) {
      callback(new Error('invalid property name: ' + params.property));
      return;
    }

    var properties = {};
    properties[params.property] = 0;
    ta._sendRequest({
      type: 'user_unset',
      accountId: params.accountId,
      distinctId: params.distinctId,
      properties,
    }, callback);
  };

  /**
   * 累加数值类型的用户属性.
   *
   * params 为参数对象，其属性包括:
   * - accountId: optional 账号 ID
   * - distinctId: optional 访客 ID，账号 ID 和访客 ID 不能同时为空
   * - properties: required {object} 用户属性，属性值需为数值类型
   * - callback: optional {function} 回调, 参数为 Error 对象. 出错时会调用该回调
   *
   * @param {object} params 参数对象
   */
  ta.userAdd = function (params) {
    var callback = params.callback || function () {};

    var err = this._basicCheck(params);
    if (err) {
      callback(err);
      return;
    }

    if (!_.properties.propertiesMust(params.properties)) {
      callback(new Error('invalid properties'));
      return;
    }

    ta._sendRequest({
      type: 'user_add',
      accountId: params.accountId,
      distinctId: params.distinct_id,
      properties: params.properties,
    }, callback);
  };

  /**
   * 追加 Array/List 类型的用户属性.
   *
   * params 为参数对象，其属性包括:
   * - accountId: optional 账号 ID
   * - distinctId: optional 访客 ID，账号 ID 和访客 ID 不能同时为空
   * - properties: required {object} 用户属性，属性值需为 Array 类型
   * - callback: optional {function} 回调, 参数为 Error 对象. 出错时会调用该回调
   *
   * @param {object} params 参数对象
   */
  ta.userAppend = function (params) {
    var callback = params.callback || function () {};

    var err = this._basicCheck(params);
    if (err) {
      callback(err);
      return;
    }

    if (!_.properties.propertiesMust(params.properties)) {
      callback(new Error('invalid properties'));
      return;
    }

    ta._sendRequest({
      type: 'user_append',
      accountId: params.accountId,
      distinctId: params.distinct_id,
      properties: params.properties,
    }, callback);
  };

  /**
   * 删除用户. 删除用户表中的数据，但是之前事件表中的数据不会被删除.
   *
   * params 为参数对象，其属性包括:
   * - accountId: optional 账号 ID
   * - distinctId: optional 访客 ID，账号 ID 和访客 ID 不能同时为空
   * - callback: optional {function} 回调, 参数为 Error 对象. 出错时会调用该回调
   *
   * @param {object} params 参数对象
   */
  ta.userDel = function (params) {
    var callback = params.callback || function () {};

    var err = this._basicCheck(params);
    if (err) {
      callback(err);
      return;
    }

    ta._sendRequest({
      type: 'user_del',
      accountId: params.accountId,
      distinctId: params.distinct_id,
    }, callback);
  };


  /**
   * 设置公共事件属性, 公共事件属性是所有事件都会带上的属性.
   *
   * @param {object} superProperties 公共事件属性
   * @param {funciton} callback 回调函数，出错时调用
   */
  ta.setSuperProperties = function (superProperties, callback) {
    if (_.properties.properties(superProperties)) {
      _.extend(ta.superProperties, superProperties);
    } else if (callback) {
      callback(new Error('Invalid superProperties'));
    }
  };

  /**
   * 清空公共事件属性
   */
  ta.clearSuperProperties = function () {
    ta.superProperties = {};
  }

  /**
   * 设置动态公共属性. 动态公共属性传入一个 function, 其优先级高于公共事件属性.
   *
   * @param {funciton} getDynamicProperties
   * @param {funciton} callback 回调函数，出错时调用
   */
  ta.setDynamicSuperProperties = function (getDynamicProperties, callback) {
    var err;
    if (typeof getDynamicProperties === 'function') {
      if (_.properties.properties(getDynamicProperties())) {
        ta.getDynamicProperties = getDynamicProperties;
      } else {
        err = new Error('Invalid return type of getDynamicProperties');
      }
    } else {
      err = new Error('getDynamicProperties must be a funciton');
    }

    if (callback && err) {
      callback(err);
    }
  };

  // 内部函数，组织数据格式，并发送给对应的 consumer 去处理
  ta._sendRequest = function (eventData, callback) {
    var time = _.check.isUndefined(eventData.time) || !_.check.isDate(eventData.time) ? new Date() : eventData.time;

    var data = {
      '#type': eventData.type,
      '#time': _.formatDate(time),
    };

    if (eventData.distinctId) {
      data['#distinct_id'] = eventData.distinctId;
    }

    if (eventData.accountId) {
      data['#account_id'] = eventData.accountId;
    }

    if (eventData.ip) {
      data['#ip'] = eventData.ip;
    }

    if (eventData.type === 'track') {
      data['#event_name'] = eventData.event;
      data['properties'] = _.extend({},
        DEFAULT_PROPERTIES,
        ta.superProperties,
        ta.getDynamicProperties ? ta.getDynamicProperties() : {},
      );
    } else {
      data['properties'] = {};
    }

    if (_.check.isObject(eventData.properties) && !_.check.isEmptyObject(eventData.properties)) {
      _.extend(data.properties, eventData.properties);
    }

    _.searchObjDate(data);

    this.consumer.add(data, callback);
  };

  /**
   * 立即上报数据。目前只针对 Batch Mode 有效. 
   */
  ta.flush = function (callback) {
    ta.consumer.flush(callback);
  };

  /**
   * 退出 ta 数据采集. 在关闭应用时调用此接口.
   */
  ta.close = function () {
    ta.consumer.close();
  };

  return ta;
};

var _parseUrl = function (urlString) {
  var urlObj = url.parse(urlString);
  var requestLib;
  if (urlObj.protocol === 'http:') {
    requestLib = http;
  } else if (urlObj.protocol === 'https:') {
    requestLib = https;
  } else {
    throw new Error('Unsupported url protocol: ' + urlObj.protocol);
  }

  return {
    hostname: urlObj.hostname,
    requestLib,
  }
};

// module exporting
module.exports = {
  /**
   * 初始化 Debug Mode 的实例。Debug 实例逐条发送数据并返回详细的出错信息.
   *
   * 如果希望仅仅校验数据格式而不真正入库，可以通过 config 传入:
   * {
   *   dryRun: true
   * }
   *
   * @param {string} appId 项目的 APP ID
   * @param {string} serverUrl 接收端地址
   * @param {string} config (Optional) 配置
   */
  initWithDebugMode: function (appId, serverUrl, config) {
    var serverConfig = _parseUrl(serverUrl);
    config = config || {};
    serverConfig.dryRun = config.dryRun ? 1 : 0;
    return _createClient(DebugConsumer.init(appId, serverConfig));
  },

  /**
   * 初始化 Batch Mode 的实例。该实例会批量上报数据到服务端。网络异常的情况下有可能导致发送失败.
   *
   * 默认情况下，数据会先缓存在内存中，当数据超过 20 条时会发起上报。您可以主动调用 ta.flush() 接口去发起上报.
   * 退出的时候需要调用 ta.flush() 或者 ta.close() 保证数据上报.
   *
   * 可以通过 config 参数配置触发上报的条数和是否打印数据发送日志:
   *   {
   *     batchSize: 30, // 默认 20 条
   *     enableLog: true, // 打印发送日志，默认关闭
   *   }
   *
   * @param {string} appId (required) 项目的 APP ID
   * @param {string} serverUrl (required) 接收端地址
   * @param {object} config (optional) 相关配置
   */
  initWithBatchMode: function (appId, serverUrl, config) {
    var serverConfig = _parseUrl(serverUrl);
    return _createClient(BatchConsumer.init(appId, serverConfig, config));
  },

  /**
   * 初始化 Loggging Mode 的实例. 该实例需要配合 LogBus 上报数据.
   *
   * Logging Mode 使用 log4js 将数据实时保存为本地日志文件，后续需要配合 LogBus 将日志文件导入
   * 到 TA 数据库中。默认情况下日志按天切分。如果应用运行在 pm2 模式下，需要传入对应的配置，并且
   * 安装 pm2-intercom: pm2 install pm2-intercom
   *
   * config(optional) 支持的参数有：
   * - rotateHourly: false(默认) 按天切分；true 按小时切分.
   * - pm2: 当使用 pm2 的时候，需要设置
   * - pm2InstanceVar: 默认为 'NODE_APP_INSTANCE', 如果改变了该配置，需要传入对应的变量名.
   *
   * @param {string} path 日志存放路径
   * @param {object} config logging 模式相关配置
   */
  initWithLoggingMode: function (path, config) {
    return _createClient(LoggingConsumer.init(path, config));
  },
};
