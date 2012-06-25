(function (global) {
    'use strict';

    var o = {};

    exports.isPrimitive = function (obj) {
        return obj !== Object(obj);
    };

    exports.hasOwnProp = function (obj, name) {
        return o.hasOwnProperty.call(obj, name);
    };

    exports.shallowCopy = function (src, dest) {
        var keys = Object.keys(src),
            i;
        for (i = 0; i < keys.length; i += 1) {
            dest[keys[i]] = src[keys[i]];
        }
    };

    exports.liftFunctions = function (src, dest, fields) {
        var i, field;
        for (i = 0; i < fields.length; i += 1) {
            field = fields[i];
            if (undefined !== src[field] &&
                undefined !== src[field].call) {
                dest[field] = src[field].bind(src);
            }
        }
    }

}(this));
