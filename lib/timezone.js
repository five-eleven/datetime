(function (global) {
    'use strict';

    var fs = require('fs'),
        path = require('path'),
        util = require('./util'),
        timezones = {};

    function Timezone(name) {
        if (util.hasOwnProp(timezones, name)) {
            return timezones[name];
        }
        this.name = name;
        this.tzpath = path.join(this.path, name);
        try {
            var text = fs.readFileSync(this.tzpath, 'utf8'),
                obj = JSON.parse(text);
            this.transitions = obj.transitions;
            this.types = obj.types;
            this.leaps = obj.leaps;
            timezones[name] = this;
        } catch (err) {
            throw ("Failed to load timezone '" + name + "' ('" + this.tzpath + "'): " + err);
        }
    }

    Timezone.prototype = {
        constructor: Timezone,

        path: path.join(__dirname, 'i18n/zoneinfo'),

        _applicableTransition: function (millis, local) {
            var len = this.transitions.length,
                zoneinfo = this.types[0],
                seconds = Math.abs(millis / 1000),
                offset = 0,
                idx;
            for (idx = 0; idx < len; idx += 1) {
                if (local) {
                    offset = zoneinfo[0];
                }
                if (this.transitions[idx][0] > (seconds - offset)) {
                    break;
                } else {
                    zoneinfo = this.types[this.transitions[idx][1]];
                }
            }
            return zoneinfo;
        },

        /* Note: both month and day are 0-based
         *
         * Localised times repeat: for example in autumn when the
         * clocks go backwards an hour (in some areas), the localised
         * time will twice read from 1am to 1:59am. E.g. in London, after
         * 01:59am BST comes 01:00 GMT. Thus if you supply parameters
         * to this function that indicate a local time of 01:30am on
         * such a day, it's not clear whether you mean before or after
         * the clocks change.
         *
         * Similarly, some local times are impossible: for example in
         * spring when the clocks go forwards an hour (in some areas),
         * the localised time will never read 1am to 1:59am. E.g. in
         * London, after 00:59am GMT comes 02:00 BST. This function
         * will not complain however if you provide parameters that,
         * for example, indicate a local time of 01:30am on such a
         * day.
         */
        getApplicableZone: function (year, month, day, hour, minute, second, local) {
            var millis = Date.UTC(year, month, day + 1, hour, minute, second),
                zoneinfo = this._applicableTransition(millis, local);
            return {offset: zoneinfo[0],
                    isDST: zoneinfo[1],
                    abbreviation: zoneinfo[2]};
        },

        getApplicableZoneMillis: function (millis) {
            var zoneinfo = this._applicableTransition(millis, false);
            return {offset: zoneinfo[0],
                    isDST: zoneinfo[1],
                    abbreviation: zoneinfo[2]};
        }
    };

    exports.Timezone = Timezone;
}(this));
