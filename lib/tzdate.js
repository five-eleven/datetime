/**
 * Times and Dates with timezones.
 *
 * Note that in general, all input and output is 0 based. Thus January
 * is month 0, and the first day of a month is day 0. The only time we
 * convert to 1-based is when outputting a string: e.g. .toString(),
 * .toISO8601() and .toISO8601WeekDate() will all return strings in
 * which values are 1-based were appropriate. All other input and
 * output functions are 0-based in order to aid calculations of dates.
 *
 * Also note we consistently talk about the plural of units,
 * i.e. years, months, days, hours, minutes, seconds, milliseconds.
 **/
(function (global) {
    'use strict';

    var util = require('./util'),
        timezone = require('./timezone'),
        months, monthsOfYear, days, daysOfWeek;

    // adapted from:
    // http://blog.redfin.com/devblog/2007/08/getting_the_time_zone_from_a_web_browser.html
    function guessTimezoneName () {
        var so = (-1) *
              (new Date(Date.UTC(2005, 6, 30, 0, 0, 0, 0))).getTimezoneOffset(),
            wo = (-1) *
              (new Date(Date.UTC(2005, 12, 30, 0, 0, 0, 0))).getTimezoneOffset();

        if (-660 == so && -660 == wo) return 'Pacific/Midway';
        if (-600 == so && -600 == wo) return 'Pacific/Tahiti';
        if (-570 == so && -570 == wo) return 'Pacific/Marquesas';
        if (-540 == so && -600 == wo) return 'America/Adak';
        if (-540 == so && -540 == wo) return 'Pacific/Gambier';
        if (-480 == so && -540 == wo) return 'US/Alaska';
        if (-480 == so && -480 == wo) return 'Pacific/Pitcairn';
        if (-420 == so && -480 == wo) return 'US/Pacific';
        if (-420 == so && -420 == wo) return 'US/Arizona';
        if (-360 == so && -420 == wo) return 'US/Mountain';
        if (-360 == so && -360 == wo) return 'America/Guatemala';
        if (-360 == so && -300 == wo) return 'Pacific/Easter';
        if (-300 == so && -360 == wo) return 'US/Central';
        if (-300 == so && -300 == wo) return 'America/Bogota';
        if (-240 == so && -300 == wo) return 'US/Eastern';
        if (-240 == so && -240 == wo) return 'America/Caracas';
        if (-240 == so && -180 == wo) return 'America/Santiago';
        if (-180 == so && -240 == wo) return 'Canada/Atlantic';
        if (-180 == so && -180 == wo) return 'America/Montevideo';
        if (-180 == so && -120 == wo) return 'America/Sao_Paulo';
        if (-150 == so && -210 == wo) return 'America/St_Johns';
        if (-120 == so && -180 == wo) return 'America/Godthab';
        if (-120 == so && -120 == wo) return 'America/Noronha';
        if (-60 == so && -60 == wo) return 'Atlantic/Cape_Verde';
        if (0 == so && -60 == wo) return 'Atlantic/Azores';
        if (0 == so && 0 == wo) return 'Africa/Casablanca';
        if (60 == so && 0 == wo) return 'Europe/London';
        if (60 == so && 60 == wo) return 'Africa/Algiers';
        if (60 == so && 120 == wo) return 'Africa/Windhoek';
        if (120 == so && 60 == wo) return 'Europe/Amsterdam';
        if (120 == so && 120 == wo) return 'Africa/Harare';
        if (180 == so && 120 == wo) return 'Europe/Athens';
        if (180 == so && 180 == wo) return 'Africa/Nairobi';
        if (240 == so && 180 == wo) return 'Europe/Moscow';
        if (240 == so && 240 == wo) return 'Asia/Dubai';
        if (270 == so && 210 == wo) return 'Asia/Tehran';
        if (270 == so && 270 == wo) return 'Asia/Kabul';
        if (300 == so && 240 == wo) return 'Asia/Baku';
        if (300 == so && 300 == wo) return 'Asia/Karachi';
        if (330 == so && 330 == wo) return 'Asia/Calcutta';
        if (345 == so && 345 == wo) return 'Asia/Katmandu';
        if (360 == so && 300 == wo) return 'Asia/Yekaterinburg';
        if (360 == so && 360 == wo) return 'Asia/Colombo';
        if (390 == so && 390 == wo) return 'Asia/Rangoon';
        if (420 == so && 360 == wo) return 'Asia/Almaty';
        if (420 == so && 420 == wo) return 'Asia/Bangkok';
        if (480 == so && 420 == wo) return 'Asia/Krasnoyarsk';
        if (480 == so && 480 == wo) return 'Australia/Perth';
        if (540 == so && 480 == wo) return 'Asia/Irkutsk';
        if (540 == so && 540 == wo) return 'Asia/Tokyo';
        if (570 == so && 570 == wo) return 'Australia/Darwin';
        if (570 == so && 630 == wo) return 'Australia/Adelaide';
        if (600 == so && 540 == wo) return 'Asia/Yakutsk';
        if (600 == so && 600 == wo) return 'Australia/Brisbane';
        if (600 == so && 660 == wo) return 'Australia/Sydney';
        if (630 == so && 660 == wo) return 'Australia/Lord_Howe';
        if (660 == so && 600 == wo) return 'Asia/Vladivostok';
        if (660 == so && 660 == wo) return 'Pacific/Guadalcanal';
        if (690 == so && 690 == wo) return 'Pacific/Norfolk';
        if (720 == so && 660 == wo) return 'Asia/Magadan';
        if (720 == so && 720 == wo) return 'Pacific/Fiji';
        if (720 == so && 780 == wo) return 'Pacific/Auckland';
        if (765 == so && 825 == wo) return 'Pacific/Chatham';
        if (780 == so && 780 == wo) return 'Pacific/Enderbury'
        if (840 == so && 840 == wo) return 'Pacific/Kiritimati';
        return 'US/Pacific';
    }

    months = {January:   0,
              February:  1,
              March:     2,
              April:     3,
              May:       4,
              June:      5,
              July:      6,
              August:    7,
              September: 8,
              October:   9,
              November:  10,
              December:  11};

    monthsOfYear =
        ['January',
         'February',
         'March',
         'April',
         'May',
         'June',
         'July',
         'August',
         'September',
         'October',
         'November',
         'December'];

    /**
     * daysInMonth(month, isLeapYear) -> number
     *
     * month is 0-based, i.e. january is 0. You can use the months
     * object to do the mapping from month name to number.
     *
     **/
    function daysInMonth (month, isLeapYear) {
        switch (month) {
        case 0: return 31;
        case 1: return isLeapYear ? 29 : 28;
        case 2: return 31;
        case 3: return 30;
        case 4: return 31;
        case 5: return 30;
        case 6: return 31;
        case 7: return 31;
        case 8: return 30;
        case 9: return 31;
        case 10: return 30;
        case 11: return 31;
        default: throw ("Illegal month: " + month);
        }
    }

    days = {'Sunday':    0,
            'Monday':    1,
            'Tuesday':   2,
            'Wednesday': 3,
            'Thursday':  4,
            'Friday':    5,
            'Saturday':  6},

    daysOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ];

    /**
     * @constructor
     *
     * If 0 args, represents now in the current locale
     *
     * If 1 arg which is a string or number, the arg is parsed by
     * Date, and then we return a TZDate object based around that, in
     * the current locale.
     *
     * If 1 arg which is a TZDate instance, clones that instance in
     * the locale of the TZDate instance.
     *
     * If 2 args, the first can be a TZDate instance, and the 2nd a
     * locale: either locale name or Timezone instance. The TZDate
     * instance is cloned and then adjusted for the indicated locale.
     * Thus this is how you convent from one timezone to another.
     *
     * Otherwise, 9 args:
     * Years, Months (0-based), Days (0-based), Hours, Minutes, Seconds,
     * Milliseconds, Offset from GMT in Seconds, Locale (either locale
     * name as string, or Timezone instance)
     *
     **/
    function TZDate () {
        var args = Array.prototype.slice.call(arguments, 0),
            date;
        switch (args.length) {
        case 0:
            date = new Date();
            break;
        case 1:
            if (util.isPrimitive(args[0]) || typeof args[0] === "string") {
                date = new Date(args[0]);
            } else if (args[0] instanceof TZDate) {
                date = args[0];
                this.years = date.years;
                this.months = date.months;
                this.days = date.days;
                this.hours = date.hours;
                this.minutes = date.minutes;
                this.seconds = date.seconds;
                this.milliseconds = date.milliseconds;
                this.offset = date.offset;
                this.timezoneName = date.timezoneName;
                this.timezone = date.timezone;
                date = undefined;
            } else {
                throw ("Illegal constructor args: " + args);
            }
            break;
        case 2:
            if (args[0] instanceof TZDate &&
                (typeof args[1] === "string" ||
                 args[1] instanceof timezone.Timezone)) {
                date = args[0];
                this.years = date.years;
                this.months = date.months;
                this.days = date.days;
                this.hours = date.hours;
                this.minutes = date.minutes;
                this.seconds = date.seconds;
                this.milliseconds = date.milliseconds;
                this.offset = date.offset;
                this.setTimezone(args[1]);
                date = undefined;
            } else {
                throw ("Illegal constructor args: " + args);
            }
            break;
        case 9:
            this.setYears(args[0]);
            this.setMonths(args[1]);
            this.setDays(args[2]);
            this.setHours(args[3]);
            this.setMinutes(args[4]);
            this.setSeconds(args[5]);
            this.setMilliseconds(args[6]);
            this.setOffset(args[7]);
            this.setTimezone(args[8]);
            break;
        default:
            throw ("Illegal constructor args: " + args);
        }
        if (date === undefined) {
            this._ready = true;
            this.adjustForOffset();
        } else {
            return new TZDate(date.getFullYear(),
                              date.getMonth(),
                              date.getDate() - 1,
                              date.getHours(),
                              date.getMinutes(),
                              date.getSeconds(),
                              date.getMilliseconds(),
                              (-date.getTimezoneOffset()) * 60,
                              guessTimezoneName());
        }
    }

    TZDate.prototype = {
        constructor: TZDate,

        _ready: false,

        /**
         * Returns true iff the date's year is a leap year.
         **/
        isLeapYear: function () {
            return (this.years % 4 === 0) &&
                !((this.years % 100 === 0) && !(this.years % 400 === 0))
        },

        /**
         * Set the years of this date.
         **/
        setYears: function (years) {
            this.years = years;
            this._clampDays();
        },

        /**
         * Set the months of this date. 0-based, i.e. 0 is January.
         * Will explode if you provide < 0 or > 11.  Will clamp the
         * number of days if the existing number of days is greater
         * than allowed for the new month.
         **/
        setMonths: function (months) {
            if (typeof months === "string") {
                months = this.months[months.toLowerCase()];
            }
            if (months < 0 || months > 11) {
                throw ("Illegal month: " + months);
            }
            this.months = months;
            this._clampDays();
        },

        /**
         * Set the days-of-the-month of this date. 0-based, i.e. 0 is
         * the first day of the month.
         * Will explode if you provide < 0 or > days-in-month-minus-1
         **/
        setDays: function (days) {
            if (days < 0 ||
                days >= daysInMonth(this.months, this.isLeapYear())) {
                throw ("Illegal date: " + days);
            }
            this.days = days;
            this.resetOffset();
        },

        _clampDays: function () {
            if (!this._ready) {
                return;
            }
            if (this.days >= daysInMonth(this.months, this.isLeapYear())) {
                this.days = daysInMonth(this.months, this.isLeapYear()) - 1;
            } else if (this.days < 0) {
                this.days = 0;
            }
            this.resetOffset();
        },

        /**
         * Set the hours, 24-hour clock, of this date. Will explode if
         * you provide < 0 or > 23.
         **/
        setHours: function (hours) {
            if (hours < 0 || hours > 23) {
                throw ("Illegal hour: " + hour);
            }
            this.hours = hours;
        },

        /**
         * Set the minutes of this date. Will explode if you provide <
         * 0 or > 59.
         **/
        setMinutes: function (minutes) {
            if (minutes < 0 || minutes > 59) {
                throw ("Illegal minutes: " + minutes);
            }
            this.minutes = minutes;
        },

        /**
         * Set the seconds of this date. Will explode if you provide <
         * 0 or > 59.
         **/
        setSeconds: function (seconds) {
            if (seconds < 0 || seconds > 59) {
                throw ("Illegal seconds: " + seconds);
            }
            this.seconds = seconds;
        },

        /**
         * Set the milliseconds of this date. Will explode if you
         * provide < 0 or > 999.
         **/
        setMilliseconds: function (millis) {
            if (millis < 0 || millis > 999) {
                throw ("Illegal milliseconds: " + millis);
            }
            this.milliseconds = millis;
        },

        /**
         * Set the timezone of this date. This can either be a string
         * representing the timezone name (eg "Europe/London") or a
         * Timezone instance. Upon setting, this date will adjust
         * itself so as to represent the local time for the timezone
         * supplied maintaining the same UTC time.
         **/
        setTimezone: function (tz) {
            if (typeof tz === "string") {
                this.timezone = new timezone.Timezone(tz);
                this.timezoneName = tz;
                this.adjustForOffset();
            } else if (tz instanceof timezone.Timezone) {
                this.timezone = tz;
                this.timezoneName = tz.name;
                this.adjustForOffset();
            } else {
                throw ("Illegal timezone: " + tz);
            }
        },

        /**
         * Set the offset, in seconds for the current date from UTC.
         **/
        setOffset: function (offset) {
            this.offset = offset;
            delete this.abbreviation;
        },

        /**
         * If the date's offset is not the correct offset for the
         * locale/timezone at the currently indicated date, this
         * method will adjust the date to the relevant correct offset
         * for the timezone whilst maintaining the UTC time. E.g., the
         * offset is set to 7200, but for the time and date indicated,
         * an offset of 3600 should be being used. Thus this will
         * adjust the date to represent the same UTC time, but at a
         * 3600 offset.
         **/
        adjustForOffset: function () {
            if (!this._ready) {
                return;
            }
            var tzinfo = this.getTimezoneInfo(),
                offset;
            this.abbreviation = tzinfo.abbreviation;
            if (this.offset !== tzinfo.offset) {
                offset = tzinfo.offset - this.offset;
                // Must store the new correct offset before calling
                // add() to avoid recursion issue
                this.offset = tzinfo.offset;
                this.add({seconds: offset});
            }
        },

        /**
         * Overwrite this date's offset with the relevant offset for
         * the date. This may alter the corresponding UTC time.
         **/
        resetOffset: function () {
            if (!this._ready) {
                return;
            }
            var tzinfo = this.getTimezoneInfo();
            this.abbreviation = tzinfo.abbreviation;
            this.offset = tzinfo.offset;
        },

        /**
         * Returns an object of {offset: o, isDST: d, abbreviation: a}
         * indicating for this date, the offset, in seconds, from UTC,
         * whether or not Daylight Saving is in use, and the
         * abbreviated form of the relevant timezone name.
         **/
        getTimezoneInfo: function () {
            return this.timezone.getApplicableZone(
                this.years, this.months, this.days,
                this.hours, this.minutes, this.seconds - this.offset, false);
        },

        /**
         * Returns the milliseconds since epoch (00:00am 1st Jan, 1970
         * UTC) represented by this date.
         **/
        toUTC: function () {
            return Date.UTC(
                this.years, this.months, this.days + 1,
                this.hours, this.minutes, this.seconds - this.offset,
                this.milliseconds);
        },

        /**
         * Adjust the current date by a specified amount.  The amount
         * is indicated by the object passed, which can have none or
         * more of the fields: years, months, days, hours, minutes,
         * seconds, milliseconds.
         *
         * Both positive and negative values are allowed, but values
         * must be integers.
         *
         * An attempt is made to keep the resultant date as close as
         * possible to the starting date. E.g. if the date represents
         * 29th Feb on a leap year, adding either 1 year or 12 months
         * will result in 28th Feb the following year.
         *
         * Similarly, if you're at the 31st Jan and you add one month,
         * you end up at the 28th (or 29th) Feb. From there, if you
         * add one month, you'll end up at the 28th (or 29th) Mar. But
         * if you add 2 months to the 31st Jan then you'll end up at
         * the 31st Mar. I.e. clamping to the size of the month is
         * done only when the correct month has been reached.
         *
         * Adding 1 day is not the same as adding 24 hours: some days
         * are 23 hours long and some are 25 hours long (e.g. when
         * daylight savings start or stop).
         *
         * This will correctly roll all fields. E.g. adding 12 months
         * is the same as adding 1 year.
         **/
        add: function (origObj) {
            var obj = {}, x;
            util.shallowCopy(origObj, obj);
            if (obj.years !== undefined) {
                this.setYears(obj.years + this.years);
                delete obj.years;
                this.resetOffset();
            }
            if (obj.months !== undefined) {
                this._simpleAdd(obj, 'months', 'years', 12,
                                this.setMonths.bind(this));
                this.resetOffset();
            }
            if (obj.weeks !== undefined) {
                obj.days = (obj.days === undefined ? 0 : obj.days) +
                           obj.weeks * 7;
                delete obj.weeks;
            }
            if (obj.days !== undefined) {
                // Because both months and years can have variable
                // numbers of days, it's much simpler to iterate
                // through rather than trying to directly calculate
                // the adjustment years, months and days
                if (obj.days > 0) {
                    x = daysInMonth(this.months, this.isLeapYear());
                    obj.days += this.days;
                    this.setDays(0);
                    while (obj.days >= x) {
                        this.add({months: 1});
                        obj.days -= x;
                        x = daysInMonth(this.months, this.isLeapYear());
                    }
                    this.setDays(obj.days);
                } else if (obj.days < 0) {
                    obj.days = -obj.days; // easier to work with +ve numbers
                    obj.days -= this.days;
                    this.setDays(0);
                    while (obj.days > 0) {
                        this.add({months: -1});
                        obj.days -= daysInMonth(this.months, this.isLeapYear());
                    }
                    this.setDays(-obj.days);
                }
                delete obj.days;
                this.resetOffset();
            }
            if (obj.hours !== undefined) {
                // Hours can be discontinuous. E.g. in some areas, in
                // Spring, the clocks spring forwards an hour, thus
                // after 00:59am comes 02:00am. Thus at such a time,
                // 00:30am + 1 hour = 2:30am. Similarly, in autumn,
                // time repeats itself: as the clocks fall backwards,
                // after 01:59am comes 01:00am again. Thus at such a
                // time, 01:30am + 1 hour = 01:30am.
                if (obj.hours > 0) {
                    while (obj.hours > 0) {
                        if (this.hours === 23) {
                            this.setHours(0);
                            this.add({days: 1});
                        } else {
                            this.setHours(this.hours + 1);
                        }
                        obj.hours -= 1;
                        this.adjustForOffset();
                    }
                } else if (obj.hours < 0) {
                    while (obj.hours < 0) {
                        if (this.hours === 0) {
                            this.setHours(23);
                            this.add({days: -1});
                        } else {
                            this.setHours(this.hours - 1);
                        }
                        obj.hours += 1;
                        this.adjustForOffset();
                    }
                }
                delete obj.hours;
            }
            if (obj.minutes !== undefined) {
                this._simpleAdd(obj, 'minutes', 'hours', 60,
                                this.setMinutes.bind(this));
                this.adjustForOffset();
            }
            if (obj.seconds !== undefined) {
                this._simpleAdd(obj, 'seconds', 'minutes', 60,
                                this.setSeconds.bind(this));
                this.adjustForOffset();
            }
            if (obj.milliseconds !== undefined) {
                this._simpleAdd(obj, 'milliseconds', 'seconds', 1000,
                                this.setMilliseconds.bind(this));
                this.adjustForOffset();
            }
        },

        _simpleAdd: function (obj, name, nextUnitName, upperBound,
                              simpleSetFun) {
            if (obj[name] === 0) {
                return;
            }
            var obj2 = {};
            obj2[name] = obj[name] + this[name];
            simpleSetFun(0);
            obj2[nextUnitName] = Math.floor(obj2[name] / upperBound);
            obj2[name] = obj2[name] % upperBound;
            obj2[name] = obj2[name] < 0 ? obj2[name] + upperBound : obj2[name];
            if (obj2[nextUnitName] === 0) {
                simpleSetFun(obj2[name]);
            } else {
                this.add(obj2);
            }
            delete obj[name];
        },

        /**
         * Returns the ordinal date, i.e. the number of days since the
         * start of the year. Note this is 0-based, i.e. 1st Jan is
         * day 0, not day 1. 0-based is much easier for maths, even
         * though ISO 8601 prefers 1-based.
         **/
        daysOfYear: function () {
            var sum = 0, isLeap = this.isLeapYear(),
                idx;
            for (idx = 0; idx < this.months; idx += 1) {
                sum += daysInMonth(idx, isLeap);
            }
            return sum + this.days;
        },

        /**
         * Returns the day of the week represented by this date, where
         * 0 is Sunday, 1 is Monday etc. This is done as it's more
         * useful for array indexing operations than if 1 was Sunday,
         * 2 Monday etc.
         **/
        daysOfWeek: function () {
            if (!this._ready) {
                return;
            }
            // See "Gaussian Algorithm" on
            // https://en.wikipedia.org/wiki/Determination_of_the_day_of_the_week
            var Y = this.months < 2 ? this.years - 1 : this.years,
                d = this.days + 1,
                m = ((this.months + 10) % 12) + 1,
                y = Y % 100,
                c = Y - y,
                w = (d + Math.floor(2.6 * m - 0.2) + y +
                     Math.floor(y/4) + Math.floor(c/4) - (2*c)) % 7;
            return w < 0 ? w + 7 : w;
        },

        /**
         * Returns the ISO 8601 Week Date number as an object with
         * fields 'years' and 'weeks'. This is because the first week
         * is defined as "the week with the year's first Thursday in
         * it". Consequently, if January 1st is a Friday, that Friday,
         * Saturday and Sunday are all considered to belong to the
         * last week of the previous year. Equally, if January 1st is
         * a Thursday, the preceding Monday, Tuesday and Wednesday in
         * the previous year (end of December) are considered to be
         * part of the first week of the current year.
         *
         * ISO 8601 defines that a week starts on a Monday, which is
         * what we implement here.
         *
         * Note that in violation of ISO 8601, the week number here is
         * 0-based. I.e. the first week is called week 0, not week
         * 1. 0-based is much easier for maths.
         **/
        weeksOfYear: function () {
            // We start by finding the first Thursday in the year, and
            // then back it off to get to the Monday. Yes, this really
            // might (correctly) reduce the date to the previous year.
            var firstWeek = new TZDate(this),
                extraDays, tmp, dow;
            firstWeek.setMonths(0);
            firstWeek.setDays(0);
            extraDays = (days.Thursday - firstWeek.daysOfWeek() + 7) % 7;
            firstWeek.add({days: extraDays - 3});
            if (firstWeek.compare(this) === 'gt') {
                tmp = new TZDate(this);
                tmp.add({weeks: -1});
                tmp = tmp.weeksOfYear();
                tmp.weeks += 1;
                return tmp;
            } else {
                tmp = firstWeek.daysOfYear();
                if (firstWeek.years !== this.years) {
                    tmp -= firstWeek.isLeapYear() ? 366 : 365;
                }
                tmp = Math.floor((this.daysOfYear() - tmp) / 7);
                if (tmp === 52) {
                    // Most years are 52 weeks long, not 53. We need
                    // to check to see if we're actually already in
                    // the first week of the next year. Years with 53
                    // weeks in them are defined by: "all years
                    // starting with Thursday, and leap years starting
                    // with Wednesday"
                    firstWeek = new TZDate(this);
                    firstWeek.setMonths(0);
                    firstWeek.setDays(0);
                    dow = firstWeek.daysOfWeek();
                    if (dow === days.Thursday ||
                        (firstWeek.isLeapYear() && dow === days.Wednesday)) {
                        return {years: this.years,
                                weeks: tmp};
                    } else {
                        // Year was only 52 weeks long, so we're
                        // actually in the first week of the next
                        // year.
                        return {years: this.years + 1,
                                weeks: 0};
                    }
                }
                return {years: this.years,
                        weeks: tmp};
            }
        },

        compare: function (date) {
            var us = this.toUTC(), them = date.toUTC();

            if (us < them) {
                return 'lt';
            } else if (us > them) {
                return 'gt';
            } else {
                return 'eq';
            }
        },

        _pad: function (str, prefix, width) {
            if (typeof str !== 'string') {
                str = '' + str;
            }
            if (typeof prefix !== 'string') {
                prefix = '' + prefix;
            }
            while (str.length < width) {
                str = prefix + str;
            }
            return str;
        },

        toISO8601: function (basic) {
            var yy = this._pad(this.years, 0, 4),
                mm = this._pad(this.months + 1, 0, 2),
                dd = this._pad(this.days + 1, 0, 2),
                h = this._pad(this.hours, 0, 2),
                m = this._pad(this.minutes, 0, 2),
                s = this._pad(this.seconds, 0, 2),
                ms = this._pad(this.milliseconds, 0, 3),
                tzSign = this.offset < 0 ? '-' : '+',
                tzOffset = Math.abs(this.offset),
                tzHours = this._pad(Math.floor(tzOffset / 3600), 0, 2),
                tzMinutes = this._pad(tzOffset % 3600, 0, 2);
            if (basic) {
                return yy + mm + dd + 'T' +
                    h + m + s + '.' + ms +
                    tzSign + tzHours + tzMinutes;
            } else {
                return yy + '-' + mm + '-' + dd + 'T' +
                    h + ':' + m + ':' + s + '.' + ms +
                    tzSign + tzHours + ':' + tzMinutes;
            }
        },

        toISO8601WeekDate: function (basic) {
            var woy = this.weeksOfYear(),
                yy = this._pad(woy.years, 0, 4),
                ww = this._pad(woy.weeks + 1, 0, 2),
                dow = this.daysOfWeek();
            if (dow === 0) {
                dow = 7;
            }
            if (basic) {
                return yy + 'W' + ww + dow;
            } else {
                return yy + '-W' + ww + '-' + dow;
            }
        },

        toString: function () {
            var dayName = daysOfWeek[this.daysOfWeek()],
                day = this.days + 1,
                monthName = monthsOfYear[this.months],
                year = this.years,
                hour = this.hours,
                minute = this._pad(this.minutes, 0, 2),
                second = this._pad(this.seconds, 0, 2),
                milli = this._pad(this.milliseconds, 0, 3),
                tzSign = this.offset < 0 ? '-' : '+',
                tzOffset = Math.abs(this.offset),
                tzHours = this._pad(Math.floor(tzOffset / 3600), 0, 2),
                tzMinutes = this._pad(tzOffset % 3600, 0, 2);
            return dayName + ' ' + day + ' ' + monthName + ' ' + year + ', ' +
                hour + ':' + minute + ':' + second + '.' + milli + ' ' +
                this.abbreviation + ' (' + tzSign + tzHours + ':' +
                tzMinutes + ') (' + this.timezoneName + ')';
        }
    };

    exports.TZDate = TZDate;
    exports.days = days;
    exports.daysOfWeek = daysOfWeek;
    exports.months = months;
    exports.monthsOfYear = monthsOfYear;
    exports.daysInMonth = daysInMonth;
}(this));
