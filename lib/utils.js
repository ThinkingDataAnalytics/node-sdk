const util = require('util');

const ArrayProto = Array.prototype,
  ObjProto = Object.prototype,
  slice = ArrayProto.slice;
toString = ObjProto.toString,
  hasOwnProperty = ObjProto.hasOwnProperty,
  nativeForEach = ArrayProto.forEach,
  breaker = {};

const KEY_NAME_MATCH_REGEX = /^[a-zA-Z#][a-zA-Z0-9_]+$/;

let _ = {};

_.version = "1.3.9";
_.log = util.debuglog('tda');

_.each = function (obj, iterator, context) {
  if (obj === null) {
    return;
  }
  if (nativeForEach && obj.forEach === nativeForEach) {
    obj.forEach(iterator, context);
  } else if (obj.length === +obj.length) {
    for (let i = 0, l = obj.length; i < l; i++) {
      if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
        return;
      }
    }
  } else {
    for (let key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        if (iterator.call(context, obj[key], key, obj) === breaker) {
          return;
        }
      }
    }
  }
};

_.extend = function (obj) {
  _.each(slice.call(arguments, 1), function (source) {
    for (let prop in source) {
      if (source[prop] !== void 0) {
        obj[prop] = source[prop];
      }
    }
  });
  return obj;
};


_.formatDate = function (d) {
  function pad(n) {
    return n < 10 ? '0' + n : n;
  }

  function padMilliseconds(n) {
    if (n < 10) {
      return '00' + n;
    } else if (n < 100) {
      return '0' + n;
    } else {
      return n;
    }
  }
  return d.getFullYear() + '-' +
    pad(d.getMonth() + 1) + '-' +
    pad(d.getDate()) + ' ' +
    pad(d.getHours()) + ':' +
    pad(d.getMinutes()) + ':' +
    pad(d.getSeconds()) + '.' +
    padMilliseconds(d.getMilliseconds());
};

_.searchObjDate = function (o) {
  if (_.check.isObject(o) || _.check.isArray(o)) {
    _.each(o, function (a, b) {
      if (_.check.isObject(a) || _.check.isArray(a)) {
        _.searchObjDate(o[b]);
      } else {
        if (_.check.isDate(a)) {
          o[b] = _.formatDate(a);
        }
      }
    });
  }
};

_.check = {
  isUndefined: function (obj) {
    return obj === void 0;
  },

  isObject: function (obj) {
    return (toString.call(obj) === '[object Object]') && (obj !== null);
  },

  isEmptyObject: function (obj) {
    if (_.check.isObject(obj)) {
      for (let key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          return false;
        }
      }
      return true;
    }
    return false;
  },

  isArray: function (obj) {
    return toString.call(obj) === '[object Array]';
  },

  isString: function (obj) {
    return toString.call(obj) === '[object String]';
  },

  isDate: function (obj) {
    return toString.call(obj) === '[object Date]';
  },

  isNumber: function (obj) {
    return toString.call(obj) === '[object Number]';
  },

  isBoolean: function (obj) {
    return toString.call(obj) === '[object Boolean]';
  },

  isJSONString: function (str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
};

_.properties = {
  _strip: function (prop) {
    if (!_.check.isObject(prop)) {
      return prop;
    }
    _.each(prop, function (v, k) {
      if (!(_.check.isString(v) || _.check.isNumber(v) || _.check.isDate(v) || _.check.isBoolean(v) || _.check.isArray(v) || _.check.isObject(v))) {
        _.log('your data -', k, v, '- is does not meet requirements, SDK would remove it. only support String, Number, Date, Boolean, Array, Object');
        delete prop[k];
      }
    });
    return prop;
  },

  _checkPropertiesKey: function (obj) {
    let flag = true;
    _.each(obj, (v, k) => {
      if (!KEY_NAME_MATCH_REGEX.test(k)) {
        _.log('invalid KEY: ' + k);
        flag = false;
      }
    });
    return flag;
  },

  name: function (s) {
    if (!_.check.isString(s) || !KEY_NAME_MATCH_REGEX.test(s)) {
      _.log('pleace check property name. A string of letters and digits that starts with _, \'#\' or a letter: ' + s);
      return false;
    } else {
      return true;
    }
  },

  properties: function (p) {
    this._strip(p);
    if (p) {
      if (_.check.isObject(p)) {
        if (this._checkPropertiesKey(p)) {
          return true;
        } else {
          _.log('pleace check property name. A string of letters and digits that starts with _, \'#\' or a letter');
          return false;
        }
      } else {
        _.log('properties must be null or object');
        return false;
      }
    } else {
      return true;
    }
  },

  propertiesMust: function (p) {
    this._strip(p);
    if (p === undefined || !_.check.isObject(p) || _.check.isEmptyObject(p)) {
      _.log('properties be object and not null');
      return false;
    } else {
      if (this._checkPropertiesKey(p)) {
        return true;
      } else {
        _.log('pleace check property name. A string of letters and digits that starts with _, \'#\' or a letter');
        return false;
      }
    }
  },

  userId: function (id) {
    if (_.check.isString(id) && /^.+$/.test(id)) {
      return true;
    } else {
      _.log('account id is not null');
      return false;
    }
  }
}

_.UUID = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

module.exports = _;
