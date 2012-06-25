(function (global) {
    'use strict';

    var events = require('events'),
        util = require('./util'),
        tzdate = require('./tzdate'),
        intervalUnits, filterUnits, relativeToValues, resetForUnits;

    intervalUnits =
        ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];
    filterUnits =
        ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'daysOfWeek'];
    relativeToValues = ['beginning', 'end', 'const'];


    resetForUnits = function (date, units) {
        // deliberately no 'breaks' here
        switch (units) {
        case 'years':
            date.setMonths(0);
        case 'months':
            date.setDays(0);
        case 'days':
            date.setHours(0);
        case 'hours':
            date.setMinutes(0);
        case 'minutes':
            date.setSeconds(0);
        case 'seconds':
            date.setMilliseconds(0);
        }
    };

    /**
     * Constructor. 3 params: initial starting date; interval unit;
     * interval value. If initial is undefined then the current local
     * time is used. The other 2 params can also be undefined if you
     * don't want an interval (sometimes it's not necessary).
     **/
    function RecurringEvent (initial, unit, value) {
        var idx, u;
        this.filters = {};
        for (idx = 0; idx < filterUnits.length; idx += 1) {
            u = filterUnits[idx];
            this.filters[u] = [];
        }
        this.initial = initial;
        if (initial === undefined) {
            this.initial = new tzdate.TZDate();
        }
        if (unit !== undefined && value !== undefined) {
            this.interval = new Interval(new tzdate.TZDate(this.initial),
                                         unit, value);
        }
    }

    RecurringEvent.prototype = {
        constructor: RecurringEvent,

        addFilter: function (unit, values, relativeTo) {
            if (undefined === this.filters[unit]) {
                throw "Illegal arguments to add filter: unit: " + unit;
            }
            this.filters[unit].push(new Filter(unit, values, relativeTo));
        },

        /**
         * Returns the next date that satisfies the restrictions of
         * the RecurringEvent. 3 params: the date from which to search
         * forwards; a bool indicating whether or not the interval
         * should be applied to the date (defaults to false); a bool
         * indicating if the date should be considered as an
         * acceptable solution (defaults to false). If the date is
         * undefined, the initial date supplied to the constructor is
         * used.
         **/
        nextSatisfyingDate: function (date, applyInterval, orAt) {
            var found = false,
                moved, candidate, candidateOld, x, y, unit, filters, cmp;
            applyInterval = applyInterval === undefined ? false : applyInterval;
            orAt = orAt === undefined ? false : orAt;
            moved = orAt;
            if (date === undefined) {
                date = this.initial;
            }
            if (this.interval === undefined || !applyInterval) {
                candidate = new tzdate.TZDate(date);
            } else {
                candidate = this.interval.soonestAfter(date);
            }
            candidateOld = new tzdate.TZDate(candidate);
            while (!found) {
                found = true;
                for (x = 0; x < filterUnits.length && found; x += 1) {
                    unit = filterUnits[x];
                    filters = this.filters[unit];
                    for (y = 0; y < filters.length && found; y += 1) {
                        candidate = filters[y].soonestAfter(candidateOld, moved);
                        cmp = candidate.compare(candidateOld);
                        candidateOld = candidate;
                        found = cmp === 'eq';
                        moved = moved || !found;
                    }
                }
            }
            return candidate;
        }
    };

    /**
     * Constructor.
     * 3 params: time unit; values (or value); relativeTo string.
     *
     * The unit is one of the valid time units - see Filter.units.
     *
     * Values can be a single value or an array of values. If an
     * array, during search for a soonest date, the soonest satisfying
     * value is the one returned.
     *
     * RelativeTo is dependent on the unit, and defaults to
     * 'beginning'.
     *
     *  'years': values are always absolute, so relativeTo is n/a
     *  'months': relativeTo can be 'beginning' or 'end' to refer
     *      "months since the beginning of the year", or "months since
     *      the end of the year". Thus 'beginning' is also an
     *      absolute. Note that 'beginning' with a value of 0 refers
     *      to January, and 'end' with a value of 0 refers to
     *      December.
     *  'days': Days of the month. Like 'months', relativeTo can be
     *      'beginning' or 'end'. Again, 0 is either the first day of
     *      the month, or the last day of the month. Doing things like
     *      [0,1,2,3,4,5,6] and 'end' allows you to search within the
     *      last week of the month, for example, regardless of month
     *      length.
     *  'daysOfWeek': Uses tzdate.days, or values 0 to 6 where 0 is
     *      Sunday. Technically, 'end' does work, but it's a bit odd
     *      to want the "3rd day from the end of the week" as weeks
     *      are always the same length. So normally just rely on the
     *      default of 'beginning'.
     *  'hours': The only unit which supports 'beginning', 'end', and
     *      'const'. 'beginning' and 'end' work as you'd expect, with
     *      0 being the first hour of the day, or the last. Whilst
     *      many days are 24 hours long, some are 23 (spring, clocks
     *      go forwards), and some are 25 (autumn, clocks go
     *      back). What this means is that if you do "9 hours from the
     *      start of the day", most of the time, you'll get 9am. But
     *      on one day in spring, you'll get 10am (because the clocks
     *      tend to change at 1am) and on one day in autumn, you'll
     *      get 8am. Thus the existence of 'const', which says "the
     *      hours field must be equal to X". Note that if you try and
     *      do a filter for 1:30am, with hours as 'const', then in
     *      autumn, when the clocks go back, and thus the hour from
     *      1am to 2am repeats, you will get 2 events in the same day!
     *  'minutes', 'seconds', 'milliseconds'. These all behave the
     *      same way: each of these support 'beginning' and 'end',
     *      though it's a bit perverse to use 'end'. Note that POSIX
     *      unix time (upon which these libraries are built) doesn't
     *      support leap seconds: in the event of a leap second being
     *      added, one second's-worth of unix time values are
     *      repeated. Consequently, you'd see the hh:mm:59 occur
     *      twice, and would never see hh:mm:60. As a result, you can
     *      not express a filter which matches only on the addition of
     *      leap seconds. I'm really very sorry. And if you have your
     *      computer configured for TAI time rather than POSIX unix
     *      time then none of this will work anyway. As expected,
     *      minutes and seconds are 0 to 59, and milliseconds is 0 to
     *      999.
     **/
    function Filter (unit, values, relativeTo) {
        if (filterUnits.indexOf(unit) === -1) {
            throw "Illegal constructor args: unit: " + unit;
        }
        if (Array.isArray(values)) {
            if (values.length === 0) {
                throw "Illegal constructor args: values: " + values;
            }
        } else {
            values = [values];
        }
        this.values = [];
        var value, v, idx;
        for (idx = 0; idx < values.length; idx += 1) {
            value = values[idx];
            var v = Math.floor(Math.abs(value));
            if (typeof value !== 'number' || (! (0 <= v)) || (v + 1 === v)) {
                // slightly strange test here to try and filter out
                // Number.NaN, and Number.POSITIVE_INFINITY
                throw "Illegal constructor args: value: " + value;
            }
            this.values.push(value);
        }
        this.unit = unit;
        this.values.sort();
        this.relativeTo = relativeTo === undefined ? 'beginning' : relativeTo;
        if (relativeToValues.indexOf(this.relativeTo) === -1) {
            throw "Illegal constructor args: relativeTo: " + relativeTo;
        }
        if (this.relativeTo === 'end') {
            this.values.reverse();
        }
    }

    Filter.prototype = {
        constructor: Filter,

        soonestAfter: function (date, orAt) {
            var d = new tzdate.TZDate(date),
                idx, value, incrd, lim;
            switch (this.unit) {
            case 'years':
                for (idx = 0; idx < this.values.length; idx += 1) {
                    value = this.values[idx];
                    if (orAt && value === d.years) {
                        return d;
                    } else if (value > d.years) {
                        resetForUnits(d, 'years');
                        d.setYears(value);
                        return d;
                    }
                }
                return undefined;
                break;
            case 'months':
                incrd = false;
                while (true) {
                    for (idx = 0; idx < this.values.length; idx += 1) {
                        value = this.values[idx];
                        if (this.relativeTo === 'end') {
                            value = 11 - value;
                        }
                        if (incrd || value > d.months) {
                            resetForUnits(d, 'months');
                            d.setMonths(value);
                            return d;
                        }
                        if (orAt && value === d.months) {
                            return d;
                        }
                    }
                    d.setMonths(0);
                    d.add({years: 1});
                    incrd = true;
                }
                break;
            case 'days':
                incrd = false;
                while (true) {
                    for (idx = 0; idx < this.values.length; idx += 1) {
                        value = this.values[idx];
                        lim = tzdate.daysInMonth(d.months, d.isLeapYear());
                        if (this.relativeTo === 'end') {
                            value = lim - value - 1;
                        }
                        if (incrd || (value > d.days && value < lim)) {
                            resetForUnits(d, 'days');
                            d.setDays(value);
                            return d;
                        }
                        if (orAt && value === d.days) {
                            return d;
                        }
                    }
                    d.setDays(0);
                    d.add({months: 1});
                    incrd = true;
                }
                break;
            case 'hours':
                if (this.relativeTo === 'beginning' ||
                    this.relativeTo === 'end') {
                    incrd = false;
                    while (true) {
                        for (idx = 0; idx < this.values.length; idx += 1) {
                            value = this.values[idx];
                            lim = new tzdate.TZDate(d);
                            lim.setHours(0);
                            if (this.relativeTo === 'beginning') {
                                lim.add({hours: value});
                            } else if (this.relativeTo === 'end') {
                                lim.add({days: 1, hours: -value});
                            }
                            if (incrd || lim.compare(date) === 'gt') {
                                resetForUnits(lim, 'hours');
                                return lim;
                            }
                            if (orAt && lim.compare(date) === 'eq') {
                                return lim;
                            }
                        }
                        d.setHours(0);
                        d.add({days: 1});
                        incrd = true;
                    }
                } else if (this.relativeTo === 'const') {
                    incrd = false;
                    while (true) {
                        for (idx = 0; idx < this.values.length; idx += 1) {
                            value = this.values[idx];
                            lim = new tzdate.TZDate(d);
                            lim.setHours(0);
                            while (lim.hours < value) {
                                lim.add({hours: 1});
                            }
                            if (value === lim.hours) {
                                if (incrd || lim.compare(date) === 'gt') {
                                    resetForUnits(lim, 'hours');
                                    return lim;
                                }
                                if (orAt && lim.compare(date) === 'eq') {
                                    return lim;
                                }
                            }
                        }
                        incrd = true;
                        lim = d.hours;
                        d.add({hours: 1});
                        // if the clocks go back, adding an hour will
                        // not change the 'hours' field
                        if (d.hours !== lim) {
                            d.setHours(0);
                            d.add({days: 1});
                        }
                    }
                }
                break;
            case 'minutes':
                incrd = false;
                while (true) {
                    for (idx = 0; idx < this.values.length; idx += 1) {
                        value = this.values[idx];
                        if (this.relativeTo === 'end') {
                            value = 59 - value;
                        }
                        if (incrd || value > d.minutes) {
                            resetForUnits(d, 'minutes');
                            d.setMinutes(value);
                            return d;
                        }
                        if (orAt && value === d.minutes) {
                            return d;
                        }
                    }
                    d.setMinutes(0);
                    d.add({hours: 1});
                    incrd = true;
                }
                break;
            case 'seconds':
                incrd = false;
                while (true) {
                    for (idx = 0; idx < this.values.length; idx += 1) {
                        value = this.values[idx];
                        if (this.relativeTo === 'end') {
                            value = 59 - value;
                        }
                        if (incrd || value > d.seconds) {
                            resetForUnits(d, 'seconds');
                            d.setSeconds(value);
                            return d;
                        }
                        if (orAt && value === d.seconds) {
                            return d;
                        }
                    }
                    d.setSeconds(0);
                    d.add({minutes: 1});
                    incrd = true;
                }
                break;
            case 'milliseconds':
                incrd = false;
                while (true) {
                    for (idx = 0; idx < this.values.length; idx += 1) {
                        value = this.values[idx];
                        if (this.relativeTo === 'end') {
                            value = 999 - value;
                        }
                        if (incrd || value > d.milliseconds) {
                            d.setMilliseconds(value);
                            return d;
                        }
                        if (orAt && value === d.milliseconds) {
                            return d;
                        }
                    }
                    d.setMilliseconds(0);
                    d.add({seconds: 1});
                    incrd = true;
                }
                break;
            case 'daysOfWeek':
                incrd = false;
                while (true) {
                    for (idx = 0; idx < this.values.length; idx += 1) {
                        value = this.values[idx];
                        if (this.relativeTo === 'end') {
                            value = 6 - value;
                        }
                        lim = d.daysOfWeek();
                        if (value === lim && orAt && !incrd) {
                            return d;
                        }
                        if (incrd) {
                            if (value < lim) {
                                value += 7;
                            }
                            resetForUnits(d, 'days');
                            d.add({days: value - lim});
                            return d;
                        }
                    }
                    d.add({days: 1});
                    incrd = true;
                }
                break;

            }
        }
    };

    function Interval (initial, unit, value) {
        if (initial.constructor !== tzdate.TZDate) {
            throw "Illegal constructor args: initial date: " + initial;
        }
        if (intervalUnits.indexOf(unit) === -1) {
            throw "Illegal constructor args: unit: " + unit;
        }
        var v = Math.floor(Math.abs(value));
        if (typeof value !== 'number' || (! (0 < v)) || (v + 1 === v)) {
            // slightly strange test here to try and filter out
            // Number.NaN, and Number.POSITIVE_INFINITY
            throw "Illegal constructor args: value: " + value;
        }
        this.initial = initial;
        this.unit = unit;
        this.value = v;
        resetForUnits(this.initial, unit);
    }

    Interval.prototype = {
        constructor: Interval,

        soonestAfter: function (after, orAt) {
            var d = new tzdate.TZDate(this.initial),
                addition = {}, cmp;
            orAt = orAt === undefined ? false : orAt;
            addition[this.unit] = this.value;
            cmp = d.compare(after);
            while (cmp === 'lt' || (cmp === 'eq' && !orAt)) {
                d.add(addition);
                cmp = d.compare(after);
            }
            return d;
        }
    };

    exports.RecurringEvent = RecurringEvent;
    exports.Filter = Filter;
    exports.Filter.units = filterUnits;
    exports.Filter.relativeTo = relativeToValues;
    exports.Interval = Interval;
    exports.Interval.units = intervalUnits;

}(this));
