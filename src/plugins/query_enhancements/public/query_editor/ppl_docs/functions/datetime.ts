/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const datetimeFunction = `## Datetime
---

### Datetime functions

PPL functions use the search capabilities of the OpenSearch engine. However, these functions don't execute directly within the OpenSearch plugin's memory. Instead, they facilitate the global filtering of query results based on specific conditions, such as a \`WHERE\` or \`HAVING\` clause. 

The following sections describe the \`datetime\` PPL functions.

### ADDDATE

The \`adddate\` function add a time interval to a date. It supports two forms: adding a specified interval using \`INTERVAL\` keyword or adding an integer number of days directly.

**Argument type:** \`DATE/DATETIME/TIMESTAMP/STRING, INTERVAL/LONG\`

**Return type:** \`(DATE/DATETIME/TIMESTAMP/STRING, INTERVAL) -&gt; DATETIME\`, \`(DATE, LONG) -&gt; DATE\`, \`(DATETIME/TIMESTAMP/STRING, LONG) -&gt; DATETIME\`

**Synonyms**: \`[DATE\_ADD](#date_add)\`

#### Example

    os> source=people | eval \`ADDDATE(DATE('2020-08-26'), INTERVAL 1 HOUR)\` = ADDDATE(DATE('2020-08-26'), INTERVAL 1 HOUR), \`ADDDATE(DATE('2020-08-26'), 1)\` = ADDDATE(DATE('2020-08-26'), 1), \`ADDDATE(TIMESTAMP('2020-08-26 01:01:01'), 1)\` = ADDDATE(TIMESTAMP('2020-08-26 01:01:01'), 1) | fields \`ADDDATE(DATE('2020-08-26'), INTERVAL 1 HOUR)\`, \`ADDDATE(DATE('2020-08-26'), 1)\`, \`ADDDATE(TIMESTAMP('2020-08-26 01:01:01'), 1)\`
    fetched rows / total rows = 1/1
    +------------------------------------------------+----------------------------------+------------------------------------------------+
    | ADDDATE(DATE('2020-08-26'), INTERVAL 1 HOUR)   | ADDDATE(DATE('2020-08-26'), 1)   | ADDDATE(TIMESTAMP('2020-08-26 01:01:01'), 1)   |
    |------------------------------------------------+----------------------------------+------------------------------------------------|
    | 2020-08-26 01:00:00                            | 2020-08-27                       | 2020-08-27 01:01:01                            |
    +------------------------------------------------+----------------------------------+------------------------------------------------+

#### DATE

The \`date(expr)\` function converts strings to date types and extracts the date portion from existing date, datetime, and timestamp values.

**Argument type:** \`STRING/DATE/DATETIME/TIMESTAMP\`

**Return type:** \`DATE\`

#### Example

    >od source=people | eval \`DATE('2020-08-26')\` = DATE('2020-08-26'), \`DATE(TIMESTAMP('2020-08-26 13:49:00'))\` = DATE(TIMESTAMP('2020-08-26 13:49:00')) | fields \`DATE('2020-08-26')\`, \`DATE(TIMESTAMP('2020-08-26 13:49:00'))\`
    fetched rows / total rows = 1/1
    +----------------------+------------------------------------------+
    | DATE('2020-08-26')   | DATE(TIMESTAMP('2020-08-26 13:49:00'))   |
    |----------------------+------------------------------------------|
    | DATE '2020-08-26'    | DATE '2020-08-26'                        |
    +----------------------+------------------------------------------+

#### DATE\_ADD

The \`date\_add(date, INTERVAL expr unit)\` or \`date\_add(date, expr)\` adds
the time interval specified by \`expr\` to a given \`date\`. It supports adding a specific interval and adding an integer number of days.

**Argument type:** \`DATE/DATETIME/TIMESTAMP/STRING, INTERVAL/LONG\`

**Return type:** \`DATE/DATETIME/TIMESTAMP/STRING, INTERVAL -&gt;\`,  \`DATETIME\`, \`DATE, LONG -&gt; DATE\`, \`DATETIME/TIMESTAMP/STRING, LONG -&gt; DATETIME\`

**Synonyms:** \`[ADDDATE](#adddate)\`

#### Example

    os> source=people | eval \`DATE_ADD(DATE('2020-08-26'), INTERVAL 1 HOUR)\` = DATE_ADD(DATE('2020-08-26'), INTERVAL 1 HOUR), \`DATE_ADD(DATE('2020-08-26'), 1)\` = DATE_ADD(DATE('2020-08-26'), 1), \`DATE_ADD(TIMESTAMP('2020-08-26 01:01:01'), 1)\` = DATE_ADD(TIMESTAMP('2020-08-26 01:01:01'), 1) | fields \`DATE_ADD(DATE('2020-08-26'), INTERVAL 1 HOUR)\`, \`DATE_ADD(DATE('2020-08-26'), 1)\`, \`DATE_ADD(TIMESTAMP('2020-08-26 01:01:01'), 1)\`
    fetched rows / total rows = 1/1
    +-------------------------------------------------+-----------------------------------+-------------------------------------------------+
    | DATE_ADD(DATE('2020-08-26'), INTERVAL 1 HOUR)   | DATE_ADD(DATE('2020-08-26'), 1)   | DATE_ADD(TIMESTAMP('2020-08-26 01:01:01'), 1)   |
    |-------------------------------------------------+-----------------------------------+-------------------------------------------------|
    | 2020-08-26 01:00:00                             | 2020-08-27                        | 2020-08-27 01:01:01                             |
    +-------------------------------------------------+-----------------------------------+-------------------------------------------------+

### DATE\_FORMAT

The \`date\_format(date, format)\` function takes a date and a format string as arguments and returns the formatted date string according to the specified format.

The following table lists the available specifier arguments.

| Specifier | Description |
|-----------|-----------------------------------------------------------|
| %a        | Abbreviated weekday name (Sun..Sat) |
| %b        | Abbreviated month name (Jan..Dec)   |
| %c        | Month, numeric (0..12)              |
| %D        | Day of the month with English suffix (0th, 1st, 2nd, 3rd, …) |
| %d        | Day of the month, numeric (00..31)  |
| %e        | Day of the month, numeric (0..31)   |
| %f        | Microseconds (000000..999999)       |
| %H        | Hour (00..23)                       |
| %h        | Hour (01..12)                       |
| %I        | Hour (01..12)                       |
| %i        | Minutes, numeric (00..59)           |
| %j        | Day of year (001..366)              |
| %k        | Hour (0..23)                        |
| %l        | Hour (1..12)                        |
| %M        | Month name (January..December)      |
| %m        | Month, numeric (00..12)             |
| %p        | AM or PM                            |
| %r        | Time, 12-hour (hh:mm&#58;ss followed by AM or PM) |
| %S        | Seconds (00..59)                    |
| %s        | Seconds (00..59)                    |
| %T        | Time, 24-hour (hh:mm:ss)            |
| %U        | Week (00..53), where Sunday is the first day of the week; WEEK() mode 0                                            |
| %u        | Week (00..53), where Monday is the first day of the week; WEEK() mode 1                                            |
| %V        | Week (01..53), where Sunday is the first day of the week; WEEK() mode 2; used with %X                              |
| %v        | Week (01..53), where Monday is the first day of the week; WEEK() mode 3; used with %x                              |
| %W        | Weekday name (Sunday..Saturday)     |
| %w        | Day of the week (0=Sunday..6&#61;Saturday) |
| %X        | Year for the week where Sunday is the first day of the week, numeric, four digits; used with %V                |
| %x        | Year for the week, where Monday is the first day of the week, numeric, four digits; used with %v                |
| %Y        | Year, numeric, four digits          |
| %y        | Year, numeric (two digits)          |
| %%        | A literal % character               |
| %x        | x, for any “x” not listed above     |

**Argument type:** STRING/DATE/DATETIME/TIMESTAMP, STRING

**Return type:** STRING

#### Example

    >od source=people | eval \`DATE_FORMAT('1998-01-31 13:14:15.012345', '%T.%f')\` = DATE_FORMAT('1998-01-31 13:14:15.012345', '%T.%f'), \`DATE_FORMAT(TIMESTAMP('1998-01-31 13:14:15.012345'), '%Y-%b-%D %r')\` = DATE_FORMAT(TIMESTAMP('1998-01-31 13:14:15.012345'), '%Y-%b-%D %r') | fields \`DATE_FORMAT('1998-01-31 13:14:15.012345', '%T.%f')\`, \`DATE_FORMAT(TIMESTAMP('1998-01-31 13:14:15.012345'), '%Y-%b-%D %r')\`
    fetched rows / total rows = 1/1
    +-----------------------------------------------+----------------------------------------------------------------+
    | DATE('1998-01-31 13:14:15.012345', '%T.%f')   | DATE(TIMESTAMP('1998-01-31 13:14:15.012345'), '%Y-%b-%D %r')   |
    |-----------------------------------------------+----------------------------------------------------------------|
    | '13:14:15.012345'                             | '1998-Jan-31st 01:14:15 PM'                                    |
    +-----------------------------------------------+----------------------------------------------------------------+

### DATE\_SUB

**Description**

Usage: date\_sub(date, INTERVAL expr unit)/ date\_sub(date, expr)
subtracts the time interval expr from date

Argument type: \`DATE/DATETIME/TIMESTAMP/STRING, INTERVAL/LONG\`

**Return type:** \`DATE/DATETIME/TIMESTAMP/STRING, INTERVAL -&gt; DATETIME\`, \`DATE, LONG -&gt; DATE\`, \`DATETIME/TIMESTAMP/STRING, LONG -&gt; DATETIME\`

**Synonyms:** \`[SUBDATE](#subdate)\`

#### Example

    os> source=people | eval \`DATE_SUB(DATE('2008-01-02'), INTERVAL 31 DAY)\` = DATE_SUB(DATE('2008-01-02'), INTERVAL 31 DAY), \`DATE_SUB(DATE('2020-08-26'), 1)\` = DATE_SUB(DATE('2020-08-26'), 1), \`DATE_SUB(TIMESTAMP('2020-08-26 01:01:01'), 1)\` = DATE_SUB(TIMESTAMP('2020-08-26 01:01:01'), 1) | fields \`DATE_SUB(DATE('2008-01-02'), INTERVAL 31 DAY)\`, \`DATE_SUB(DATE('2020-08-26'), 1)\`, \`DATE_SUB(TIMESTAMP('2020-08-26 01:01:01'), 1)\`
    fetched rows / total rows = 1/1
    +-------------------------------------------------+-----------------------------------+-------------------------------------------------+
    | DATE_SUB(DATE('2008-01-02'), INTERVAL 31 DAY)   | DATE_SUB(DATE('2020-08-26'), 1)   | DATE_SUB(TIMESTAMP('2020-08-26 01:01:01'), 1)   |
    |-------------------------------------------------+-----------------------------------+-------------------------------------------------|
    | 2007-12-02                                      | 2020-08-25                        | 2020-08-25 01:01:01                             |
    +-------------------------------------------------+-----------------------------------+-------------------------------------------------+

### DAY

The \`day(date)\` function retrieves the day of the month (1-31) for a provided \`date\`. Note that dated with a value of 0, such as "0000-00-00" or "2008-00-00", are considered invalid. 

**Argument type:** \`STRING/DATE/DATETIME/TIMESTAMP\`

**Return type:** \`INTEGER\`

**Synonyms:** \`DAYOFMONTH\`

#### Example

    os> source=people | eval \`DAY(DATE('2020-08-26'))\` = DAY(DATE('2020-08-26')) | fields \`DAY(DATE('2020-08-26'))\`
    fetched rows / total rows = 1/1
    +---------------------------+
    | DAY(DATE('2020-08-26'))   |
    |---------------------------|
    | 26                        |
    +---------------------------+

### DAYNAME

The \`dayname(date)\` function retrieves the full name of the weekday, for example, Monday, Tuesday, and so forth, for a given \`date\`.

**Argument type:** \`STRING/DATE/DATETIME/TIMESTAMP\`

**Return type:** \`STRING\`

#### Example

    os> source=people | eval \`DAYNAME(DATE('2020-08-26'))\` = DAYNAME(DATE('2020-08-26')) | fields \`DAYNAME(DATE('2020-08-26'))\`
    fetched rows / total rows = 1/1
    +-------------------------------+
    | DAYNAME(DATE('2020-08-26'))   |
    |-------------------------------|
    | Wednesday                     |
    +-------------------------------+

### DAYOFMONTH

The \`dayofmonth(date)\` function retrieves the day of the month (1-31) for a provided \`date\`. Note that dated with a value of 0, such as "0000-00-00" or "2008-00-00", are considered invalid. 

**Argument type:** \`STRING/DATE/DATETIME/TIMESTAMP\`

**Return type:** \`INTEGER\`

**Synonyms:** \`DAY\`

#### Example

    os> source=people | eval \`DAYOFMONTH(DATE('2020-08-26'))\` = DAYOFMONTH(DATE('2020-08-26')) | fields \`DAYOFMONTH(DATE('2020-08-26'))\`
    fetched rows / total rows = 1/1
    +----------------------------------+
    | DAYOFMONTH(DATE('2020-08-26'))   |
    |----------------------------------|
    | 26                               |
    +----------------------------------+

### DAYOFWEEK

The \`dayofweek(date)\` retrieves the numerical index (1-7) representing the weekday for a given \`date\`, where 1 corresponds to Sunday and 7 corresponds to Saturday.

**Argument type:** \`STRING/DATE/DATETIME/TIMESTAMP\`

**Return type:** \`INTEGER\`

#### Example

    os> source=people | eval \`DAYOFWEEK(DATE('2020-08-26'))\` = DAYOFWEEK(DATE('2020-08-26')) | fields \`DAYOFWEEK(DATE('2020-08-26'))\`
    fetched rows / total rows = 1/1
    +---------------------------------+
    | DAYOFWEEK(DATE('2020-08-26'))   |
    |---------------------------------|
    | 4                               |
    +---------------------------------+

### DAYOFYEAR

The \`dayofyear(date)\` function retrieves the day of the year for a given \`date\`, ranging from 1 to 366.

**Argument type:** \`STRING/DATE/DATETIME/TIMESTAMP\`

**Return type:** \`INTEGER\`

#### Example

    os> source=people | eval \`DAYOFYEAR(DATE('2020-08-26'))\` = DAYOFYEAR(DATE('2020-08-26')) | fields \`DAYOFYEAR(DATE('2020-08-26'))\`
    fetched rows / total rows = 1/1
    +---------------------------------+
    | DAYOFYEAR(DATE('2020-08-26'))   |
    |---------------------------------|
    | 239                             |
    +---------------------------------+

### FROM\_DAYS

The \`from\_days(N)\` function retrieves the date value corresponding to the provided day number \`N\`.

**Argument type:** \`INTEGER/LONG\`

**Return type:** \`DATE\`

#### Example

    os> source=people | eval \`FROM_DAYS(733687)\` = FROM_DAYS(733687) | fields \`FROM_DAYS(733687)\`
    fetched rows / total rows = 1/1
    +---------------------+
    | FROM_DAYS(733687)   |
    |---------------------|
    | 2008-10-07          |
    +---------------------+

### HOUR

The \`hour(time)\` function extracts the hour value from a given \`time\`. Unlike the typical time-of-day format wher hours range from 0 to 23, the \`time\` input can have a larger range. Therefore, the \`hour(time)\` function may return values exceeding 23.

**Argument type:** \`STRING/TIME/DATETIME/TIMESTAMP\`

**Return type:** \`INTEGER\`

#### Example

    os> source=people | eval \`HOUR(TIME('01:02:03'))\` = HOUR(TIME('01:02:03')) | fields \`HOUR(TIME('01:02:03'))\`
    fetched rows / total rows = 1/1
    +--------------------------+
    | HOUR(TIME('01:02:03'))   |
    |--------------------------|
    | 1                        |
    +--------------------------+

### MAKETIME

**Function signature:** \`MAKETIME(INTEGER, INTEGER, INTEGER) -&gt; DATE\`

### MICROSECOND

The \`microsecond(expr)\` function retrieves the microsecond portion (0-999999) from a given \`time\` or \`datetime\` expression.

**Argument type:** \`STRING/TIME/DATETIME/TIMESTAMP\`

**Return type:** \`INTEGER\`

#### Example

    os> source=people | eval \`MICROSECOND(TIME('01:02:03.123456'))\` = MICROSECOND(TIME('01:02:03.123456')) | fields \`MICROSECOND(TIME('01:02:03.123456'))\`
    fetched rows / total rows = 1/1
    +----------------------------------------+
    | MICROSECOND(TIME('01:02:03.123456'))   |
    |----------------------------------------|
    | 123456                                 |
    +----------------------------------------+

### MINUTE

The \`minute(time)\` extracts the minute value (0-59) from a given \`time\` expression.

**Argument type:** \`STRING/TIME/DATETIME/TIMESTAMP\`

**Return type:** \`INTEGER\`

#### Example

    os> source=people | eval \`MINUTE(TIME('01:02:03'))\` =  MINUTE(TIME('01:02:03')) | fields \`MINUTE(TIME('01:02:03'))\`
    fetched rows / total rows = 1/1
    +----------------------------+
    | MINUTE(TIME('01:02:03'))   |
    |----------------------------|
    | 2                          |
    +----------------------------+

### MONTH

The \`month(date)\` function extracts the month (1-12) from a valid \`date\` value. However, invalid dates containing 0 values for the month, such as "0000-00-00" or "2008-00-00" are considered invalid.

**Argument type:** \`STRING/DATE/DATETIME/TIMESTAMP\`

**Return type:** \`INTEGER\`

#### Example

    os> source=people | eval \`MONTH(DATE('2020-08-26'))\` =  MONTH(DATE('2020-08-26')) | fields \`MONTH(DATE('2020-08-26'))\`
    fetched rows / total rows = 1/1
    +-----------------------------+
    | MONTH(DATE('2020-08-26'))   |
    |-----------------------------|
    | 8                           |
    +-----------------------------+

### MONTHNAME

The \`monthname(date)\` function retrieves the full name of the month, for example, January, February, and so forth, for a given \`date\`.

**Argument type:** \`STRING/DATE/DATETIME/TIMESTAMP\`

**Return type:** \`STRING\`

#### Example

    os> source=people | eval \`MONTHNAME(DATE('2020-08-26'))\` = MONTHNAME(DATE('2020-08-26')) | fields \`MONTHNAME(DATE('2020-08-26'))\`
    fetched rows / total rows = 1/1
    +---------------------------------+
    | MONTHNAME(DATE('2020-08-26'))   |
    |---------------------------------|
    | August                          |
    +---------------------------------+

### NOW

**Function signature:** NOW() -&gt; DATE

### QUARTER

The \`quarter(date)\` function retrieves the quarter (1-4) for a given \`date\`.

**Argument type:** \`STRING/DATE/DATETIME/TIMESTAMP\`

**Return type:** \`INTEGER\`

#### Example

    os> source=people | eval \`QUARTER(DATE('2020-08-26'))\` = QUARTER(DATE('2020-08-26')) | fields \`QUARTER(DATE('2020-08-26'))\`
    fetched rows / total rows = 1/1
    +-------------------------------+
    | QUARTER(DATE('2020-08-26'))   |
    |-------------------------------|
    | 3                             |
    +-------------------------------+

### SECOND

The \`second(time)\` function extracts the second value (0-59) from a given \`time\` expression. 

**Argument type:** \`STRING/TIME/DATETIME/TIMESTAMP\`

**Return type:** \`INTEGER\`

#### Example

    os> source=people | eval \`SECOND(TIME('01:02:03'))\` = SECOND(TIME('01:02:03')) | fields \`SECOND(TIME('01:02:03'))\`
    fetched rows / total rows = 1/1
    +----------------------------+
    | SECOND(TIME('01:02:03'))   |
    |----------------------------|
    | 3                          |
    +----------------------------+

### SUBDATE

The \`subdate(date, INTERVAL expr unit)\` or \`subdate(date, expr)\` function subtracts a time interval from a date.

**Argument type:** \`DATE/DATETIME/TIMESTAMP/STRING, INTERVAL/LONG\`

**Return type:** \`DATE/DATETIME/TIMESTAMP/STRING, INTERVAL -&gt; DATETIME\`, \`DATE, LONG -&gt; DATE\`, \`DATETIME/TIMESTAMP/STRING, LONG -&gt; DATETIME\`

**Synonyms:** \`[DATE\_SUB](#date_sub)\`

#### Example

    os> source=people | eval \`SUBDATE(DATE('2008-01-02'), INTERVAL 31 DAY)\` = SUBDATE(DATE('2008-01-02'), INTERVAL 31 DAY), \`SUBDATE(DATE('2020-08-26'), 1)\` = SUBDATE(DATE('2020-08-26'), 1), \`SUBDATE(TIMESTAMP('2020-08-26 01:01:01'), 1)\` = SUBDATE(TIMESTAMP('2020-08-26 01:01:01'), 1) | fields \`SUBDATE(DATE('2008-01-02'), INTERVAL 31 DAY)\`, \`SUBDATE(DATE('2020-08-26'), 1)\`, \`SUBDATE(TIMESTAMP('2020-08-26 01:01:01'), 1)\`
    fetched rows / total rows = 1/1
    +------------------------------------------------+----------------------------------+------------------------------------------------+
    | SUBDATE(DATE('2008-01-02'), INTERVAL 31 DAY)   | SUBDATE(DATE('2020-08-26'), 1)   | SUBDATE(TIMESTAMP('2020-08-26 01:01:01'), 1)   |
    |------------------------------------------------+----------------------------------+------------------------------------------------|
    | 2007-12-02                                     | 2020-08-25                       | 2020-08-25 01:01:01                            |
    +------------------------------------------------+----------------------------------+------------------------------------------------+

### TIME

The \`time(expr)\` function has dual functionality. If \`expr\` is a string, it contructs a \`time\` object from the provided time value format. Conversly, for input of the type \`date\`, \`datetime\`. \`time\`, or \`timestamp\`, it extracts and returns the pure time component from the given expression.

**Argument type:** \`STRING/DATE/DATETIME/TIME/TIMESTAMP\`

**Return type:** \`TIME\`

#### Example

    >od source=people | eval \`TIME('13:49:00')\` = TIME('13:49:00'), \`TIME(TIMESTAMP('2020-08-26 13:49:00'))\` = TIME(TIMESTAMP('2020-08-26 13:49:00')) | fields \`TIME('13:49:00')\`, \`TIME(TIMESTAMP('2020-08-26 13:49:00'))\`
    fetched rows / total rows = 1/1
    +--------------------+------------------------------------------+
    | TIME('13:49:00')   | TIME(TIMESTAMP('2020-08-26 13:49:00'))   |
    |--------------------+------------------------------------------|
    | TIME '13:49:00'    | TIME '13:49:00'                          |
    +--------------------+------------------------------------------+

### TIME\_TO\_SEC

The \`time\_to\_sec(time)\` function transforms a given \`time\` value into its corresponding number of seconds. 

**Argument type:** \`STRING/TIME/DATETIME/TIMESTAMP\`

**Return type:** \`LONG\`

#### Example

    os> source=people | eval \`TIME_TO_SEC(TIME('22:23:00'))\` = TIME_TO_SEC(TIME('22:23:00')) | fields \`TIME_TO_SEC(TIME('22:23:00'))\`
    fetched rows / total rows = 1/1
    +---------------------------------+
    | TIME_TO_SEC(TIME('22:23:00'))   |
    |---------------------------------|
    | 80580                           |
    +---------------------------------+

### TIMESTAMP

The \`timestamp(expr)\` function serves a dual purpose: it can both construct a timestamp object from a string representing a time value or act as a caster, converting exsiting date, datetime, or timestamp objects to a standardized timestamp type with the default UTC time zone.

**Argument type:** \`STRING/DATE/DATETIME/TIMESTAMP\`

**Return type:** \`TIMESTAMP\`

#### Example

    >od source=people | eval \`TIMESTAMP('2020-08-26 13:49:00')\` = TIMESTAMP('2020-08-26 13:49:00') | fields \`TIMESTAMP('2020-08-26 13:49:00')\`
    fetched rows / total rows = 1/1
    +------------------------------------+
    | TIMESTAMP('2020-08-26 13:49:00')   |
    |------------------------------------|
    | TIMESTAMP '2020-08-26 13:49:00     |
    +------------------------------------+

### TO\_DAYS

The \`to\_days(date)\` function calculates the number of days that have elapsed since the year 0 for a given \`date\`. If the provided date is invalid, it returns \`NULL\`.

**Argument type:** \`STRING/DATE/DATETIME/TIMESTAMP\`

**Return type:** \`LONG\`

#### Example

    os> source=people | eval \`TO_DAYS(DATE('2008-10-07'))\` = TO_DAYS(DATE('2008-10-07')) | fields \`TO_DAYS(DATE('2008-10-07'))\`
    fetched rows / total rows = 1/1
    +-------------------------------+
    | TO_DAYS(DATE('2008-10-07'))   |
    |-------------------------------|
    | 733687                        |
    +-------------------------------+

### WEEK

The \`week(date\[, mode\])\` function extracts the week number for a given \`date\`. If the mode argument is omitted, the default mode 0 is used. The following table lists the mode arguments.

| Mode | First day of week | Range | Week 1 is the first week …    |
|------|-------------------|-------|-------------------------------|
| 0    | Sunday            | 0-53  | with a Sunday in this year    |
| 1    | Monday            | 0-53  | with 4 or more days this year |
| 2    | Sunday            | 1-53  | with a Sunday in this year    |
| 3    | Monday            | 1-53  | with 4 or more days this year |
| 4    | Sunday            | 0-53  | with 4 or more days this year |
| 5    | Monday            | 0-53  | with a Monday in this year    |
| 6    | Sunday            | 1-53  | with 4 or more days this year |
| 7    | Monday            | 1-53  | with a Monday in this year    |

**Argument type:** \`DATE/DATETIME/TIMESTAMP/STRING\`

**Return type:** \`INTEGER\`

#### Example

    >od source=people | eval \`WEEK(DATE('2008-02-20'))\` = WEEK(DATE('2008-02-20')), \`WEEK(DATE('2008-02-20'), 1)\` = WEEK(DATE('2008-02-20'), 1) | fields \`WEEK(DATE('2008-02-20'))\`, \`WEEK(DATE('2008-02-20'), 1)\`
    fetched rows / total rows = 1/1
    +----------------------------+-------------------------------+
    | WEEK(DATE('2008-02-20'))   | WEEK(DATE('2008-02-20'), 1)   |
    |----------------------------|-------------------------------|
    | 7                          | 8                             |
    +----------------------------+-------------------------------+

### YEAR

The \`year(date)\` function extracts the year component from a given \`date\` value. However, it only returns valid years within the range of 1000 to 9999. If the provided date is invalid or falls outside this range, the function returns 0.

**Argument type:** \`STRING/DATE/DATETIME/TIMESTAMP\`

**Return type:** \`INTEGER\`

#### Example

    os> source=people | eval \`YEAR(DATE('2020-08-26'))\` = YEAR(DATE('2020-08-26')) | fields \`YEAR(DATE('2020-08-26'))\`
    fetched rows / total rows = 1/1
    +----------------------------+
    | YEAR(DATE('2020-08-26'))   |
    |----------------------------|
    | 2020                       |
    +----------------------------+
`;
