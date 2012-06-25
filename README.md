# DateTime

This library exports four modules:

1. `timezone`: a module that represents timezones
2. `tzdate`: a module that represents dates and times, understands
 timezones, can convert between different timezones, and perform
 timezone-respecting arithmetic on datetimes.
3. `recurringevent`: a module that allows you to represent recurring
 events using a rich range of filters (for example, "6pm in the
 evening on the third thursday from the end of the month with every
 satisfying date must be at least 4 months apart"), and the ability to
 search for the next satisfying tzdate.
4. `timeline`: a generic discrete event simulation timeline. Works
 with any monotonically increasing series and unit: does not
 explicitly require the use of `tzdate` or `Date`, nor real-time
 operation.

`timezone`, `tzdate` and `recurringevent` are internally heavily
documented. `timeline` is not so much, but the API is dead simple.

    var dt = require('datetime');
    var now = new dt.tzdate.TZDate();
    var re = new dt.recurringevent.RecurringEvent(now, 'months', 4);
    re.addFilter('hours', 18, 'const');
    re.addFilter('daysOfWeek', dt.tzdate.days.Thursday);
    re.addFilter('days', [14,15,16,17,18,19,20]);
    var d = now;
    console.log(d.toString());
    // Saturday 23 June 2012, 12:29:40.565 BST (+01:00) (Europe/London)
    d = re.nextSatisfyingDate(d, true, true); console.log(d.toString());
    // Thursday 18 October 2012, 18:00:00.000 BST (+01:00) (Europe/London)
    d = re.nextSatisfyingDate(d, true, true); console.log(d.toString());
    // Thursday 21 February 2013, 18:00:00.000 GMT (+00:00) (Europe/London)
    d = re.nextSatisfyingDate(d, true, true); console.log(d.toString());
    // Thursday 20 June 2013, 18:00:00.000 BST (+01:00) (Europe/London)
    d = re.nextSatisfyingDate(d, true, true); console.log(d.toString());
    // Thursday 17 October 2013, 18:00:00.000 BST (+01:00) (Europe/London)
