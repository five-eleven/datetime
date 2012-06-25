(function (global) {
    'use strict';

    var events = require('events'),
        util = require('./util');

    function Timeline () {
        this.now = Date.now();
        this.scheduled = {};
        this.events = [];
        this.emitter = new events.EventEmitter();

        util.liftFunctions(
            this.emitter, this,
            ['on', 'once', 'removeListener', 'removeAllListeners']);

        var intervalId;

        this.runByClock = function (interval) {
            var fun;
            if (undefined === intervalId) {
                if (interval === undefined || interval === null ||
                    ! util.isPrimitive(interval)) {
                    interval = this.defaultClockInterval;
                }
                fun = function () {
                    this.advanceTo(Date.now());
                }.bind(this);
                intervalId = setInterval(fun, interval);
            }
        };

        this.stopRunByClock = function () {
            if (undefined !== intervalId) {
                clearInterval(intervalId);
                intervalId = undefined;
            }
        };

    }

    Timeline.prototype = {

        _add: function (at, event) {
            var container;
            if (at < this.now) {
                this.emitter.emit('add_in_past', event);
            } else if (at === this.now) {
                this.emitter.emit('event', event);
            } else {
                if (util.hasOwnProp(this.scheduled, at)) {
                    container = this.scheduled[at];
                } else {
                    container = [];
                    this.scheduled[at] = container;
                }
                container.push(event);

                if (this.events.length === 0 || at < this.events[0]) {
                    this.events.unshift(at);
                } else {
                    this.events.push(at);
                    if (at < this.events[this.events.length - 1]) {
                        this.events.sort();
                    }
                }
            }
        },

        advanceBy: function (adv) {
            if (adv === undefined || adv === null || ! util.isPrimitive(adv)) {
                adv = 1;
            }
            advanceTo(this.now + adv);
        },

        advanceTo: function (now) {
            var at, container, idx;
            this.now = now;
            while (this.events[0] <= now) {
                at = this.events.shift();
                container = this.scheduled[at];
                delete this.scheduled[at];
                for (idx = 0; idx < container.length; idx += 1) {
                    this.emitter.emit('event', container[idx]);
                }
            }
        },

        scheduleIn: function (offset, event) {
            return this._add(this.now + offset, event);
        },

        scheduleAt: function (at, event) {
            return this._add(at, event);
        },

        clearAllEvents: function () {
            this.scheduled = {};
            this.events = [];
        },

        defaultClockInterval: 1000 // 1 second
    };

    exports.Timeline = Timeline;
}(this));
