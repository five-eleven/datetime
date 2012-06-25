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

`timezone`, `tzdate` and `recurringevent` are internally
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


## Notes

### Concerning leapseconds and the timeline

- Don't need to worry about leap seconds because unixtime can't
  represent leap seconds: every day is the same number of seconds and
  leap seconds cause a unixtime (seconds since epoch) to be repeated.

- Thus in the event of the addition of a leapsecond, the unixtime will
  repeat (actually, it'll go backwards by 1000 and then increase again
  as normal). The timeline removes already fired events, so there'll
  be no duplication.

- An event that's meant to fire every second will therefore not fire
  every second in the event of the addition of a leapsecond - during
  the leap second, it will not fire.

- But it means that if you schedule an event for "an hour's time" and
  there happens to be a leap second in between now and then, then the
  event will fire at the "correct time" - i.e. the minutes and seconds
  values will match their current values, and the hour value will be
  current+1, even though there have been 3601 seconds between now and
  then, rather than the normal 3600.

- In other words, because unixtime cannot represent leap seconds at
  all, you cannot use Timeline to schedule an event to occur on a leap
  second.

- In theory, leap seconds can be both added and removed. In practise,
  they've only ever been added. There have been 25 leap seconds added
  between 1970 and July 2012 - roughly one every 18 months. They
  cannot be predicted.


### Timezones and JavaScript

- The JS `Date.parse(string)` function will correctly parse strings
  that include a timezone (in a GMT+0100) format and will return
  milliseconds since epoch UTC correctly.

- The problem is that we do want to work in terms of the client's
  timezone when doing time calculations. E.g. we want to be able to
  work out when "9am tomorrow" is for the client bearing in mind there
  could be a DST transition between now and then.

- Thus we cannot just add on a particular number of seconds. We need
  to do arithmetic knowing what the client's TZ is.

- `date.setDate(N)` does take into account DST changes (London "sprung
  forwards" at 1am on Sunday 25th March 2012) (performed on nodejs):

      var date = new Date(1332637100000);
      date;                                         // Sun, 25 Mar 2012 00:58:20 GMT
      date.getTimezoneOffset();                     // 0
      var date2 = new Date(1332637100000);
      date2.setDate(26);
      date2;                                        // Sun, 25 Mar 2012 23:58:20 GMT
      date2.getTimezoneOffset();                    // -60
      (date2.getTime() - date.getTime()) / 3600000  // 23 hours, not 24!
      date.toLocaleString();                        // 'Sun Mar 25 2012 00:58:20 GMT+0000 (GMT)'
      date2.toLocaleString();                       // 'Mon Mar 26 2012 00:58:20 GMT+0100 (BST)'

  It has clearly understood that Sunday 25th March 2012 in London was
  only 23 hours long

- The problem is that `Date` does not allow configuration of the
  timezone - it just uses the host's timezone. Very bad idea to rely
  on the server's TZ being the same as your clients'.

- Need to be able to say "I'm in Europe/London and the local date and
  time is X and Y, now give me the unixtime of that."
