/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const pplDatatypes = `## Data Types
---

### Data types

A data type defines a collection of data type values and a set of predefined operations for those values. PPL supports the following data types:

.. hlist::
   :columns: 3

   * array 
   * binary
   * boolean 
   * byte 
   * date
   * datetime
   * double
   * float
   * geo\_point
   * integer
   * interval
   * ip
   * long
   * short
   * string
   * struct
   * text
   * time
   * timestamp

### Data type mapping

The following table is a reference guide for the mapping between an OpenSearch data type, a PPL data type, and a SQL data type.

| OpenSearch type | PPL type  | SQL type  |
|-----------------|-----------|-----------|
| binary          | binary    | VARBINARY |
| boolean         | boolean   | BOOLEAN   |
| byte            | byte      | TINYINT   |
| date            | timestamp | TIMESTAMP |
| double          | double    | DOUBLE    |
| float           | float     | REAL      |
| half\_float     | float     | FLOAT     |
| integer         | integer   | INTEGER   |
| ip              | ip        | VARCHAR   |
| keyword         | string    | VARCHAR   |
| long            | long      | BIGINT    |
| nested          | array     | STRUCT    |
| object          | struct    | STRUCT    |
| scaled\_float   | float     | DOUBLE    |
| short           | byte      | SMALLINT  |
| text            | text      | VARCHAR   |

Some PPL types do not correspond to an OpenSearch type. To use functions that require date and time data types, data type conversion must be performed, as described in the following sections.

### Numeric data types

Numeric values ranging from -2147483648 to +2147483647 are recognized as
integers, with data type name \`INTEGER\`. For values that fall beyond the specified range, the \`LONG\` data type is assigned during parsing.

### Date and time data types

The data types \`date\` and \`time\` represent temporal values. The PPL plugin supports \`date\`, \`time\`, \`datetime\`, \`timestamp\`, and \`interval\`. By default, [query domain-specific language (DSL)](https://opensearch.org/docs/latest/query-dsl/index/) uses \`date\` for any date or time types. To integrate with PPL, each data type, excluding \`timestamp\`, contains temporal and time zone information. Use \`datetime\` functions to clarify the date and time types. Note that certain functions may have limitations on the input argument type. See the [Functions](functions.rst) section in this manual for more information.

#### Date

The \`date\` data type represents the calendar date, regardless of time zone. A specific date value represents a 24-hour period, but this period differs across time zones and may be subject to variations due to daylight saving time adjustments. Additionally, the date alone does not contain time-specific information. The date values range from '1000-01-01' to '9999-12-31'.

| Type     | Syntax       | Range                        |
|----------|--------------|------------------------------|
| \`date\` | 'yyyy-MM-dd' | '0001-01-01' to '9999-12-31' |

#### Time

The \`time\` data type represents the time of day as displayed on a clock or watch, without specifying a particular time zone. It does not include any information about the calendar date.

| Type     | Syntax       | Range                        |
|----------|--------------|------------------------------|
| \`time\` | 'hh:mm:ss\[.fraction\]' | '00:00:00.000000' to '23:59:59.999999' |

#### Datetime

The \`datetime\` data type represents a combination of \`date\` and \`time\`. The \`datetime\` data type does not contain time zone information. For an absolute time point that contains both datetime and time zone information, see the [Timestamp](#timestamp) section. 

See the [Conversion between date and time types](#conversion-between-date-and-time-types) section for information about the conversion rule for \`date\` or \`time\` to \`datetime\`.

| Type     | Syntax | Range |
|----------|--------|-------|
| \`datetime\` | 'yyyy-MM-dd hh:mm:ss\[.fraction\]' | '0001-01-01 00:00:00.000000' to '9999-12-31 23:59:59.999999' |

#### Timestamp

The \`timestamp\` data type represents absolute points in time, unaffected by time zones or conventions. The \`timestamp\` data type differs from other data types in its storage and retrieval behavior. When a timestamp is sorted, it is converted from Coordinated Universal Time (UTC) to the specified time zone. Conversely, when a timestamp is retrieved, it is converted back to UTC before being displayed or used in calculations. This ensures that the timestamp values remain consistent and comparable across different time zones.

| Type      | Syntax | Range |
|-----------|--------|-------|
| Timestamp | 'yyyy-MM-dd hh:mm:ss\[.fraction\]' | '0001-01-01 00:00:01.000000' UTC to '9999-12-31 23:59:59.999999' |

####  Interval

The \`interval\` data type represents a span of time encompassing a specified duration or period.

| Type     | Syntax             |
|----------|--------------------|
| Interval | INTERVAL expr unit |

The expression \`expr\` is configured to be repeatedly evaluated to produce a quantitative value. See the [Expressions](expressions.rst) section of this manual for more information. The unit represents the unit used to interpret the quantity, including MICROSECOND, SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, QUARTER, and YEAR. The INTERVAL keyword and the unit specifier are not case sensitive. 

Intervals consist of two classes: day-time and year-week. Day-time intervals store days, hours, minutes, seconds, and microseconds. Year-week intervals store years, quarters, months, and weeks. Each type can only be compared to the same type. 

### Date and time conversion

Date and time types, excluding \`interval\`, can be mutually converted, with some alteration of the value or some information loss, for example, when extracting the \`time\` value from a \`datetime\` value or converting a \`date\` value to a \`datetime\` value. The PPL plugin supports the following conversion rules for each of the types.

#### \`date\` conversion

- Because \`date\` does not contain time information, conversion to \`time\` returns a zero time value \`00:00:00\`.
- Converting from \`date\` to \`datetime\` sets the time value to \`00:00:00\` if \`time\` is not provided, for example, \`2020-08-17\` converts to \`2020-08-17 00:00:00\`.
- Converting to \`timestamp\` sets \`time\` to \`00:00:00\` and time zone (UTC by default), for example, \`2020-08-17\` converts to \`2020-08-17 00:00:00 UTC\`.

#### \`time\` conversion

- A \`time\` value does not have any date information, so it cannot be converted to other date and time types.

#### \`datetime\` conversion

- Converting from \`datetime\` to \`date\` extracts the date component from the \`datetime\` value, for example, \`2020-08-17 14:09:00\` converts to \`2020-08-08\`.
- Converting to \`time\` extracts the time component from the \`datetime\` value, for example, \`2020-08-17 14:09:00\` converts to \`14:09:00\`.
- Because \`datetime\` does not contain time zone information, conversion to \`timestamp\` sets the time zone to the session's time zone, for example, \`2020-08-17 14:09:00\`, with the system time zone set to UTC, for example, \`2020-08-17 14:09:00 UTC\`.

#### \`timestamp\` conversion

- Converting from \`timestamp\` to \`date\ extracts the \`date\` and \`time\` values. Converting from \`timestamp\` to \`datetime\` extracts the \`datetime\` value and retains the time zone information. For example, \`2020-08-17 14:09:00 UTC\` converts \`date\` and \`time\` to \`2020-08-17\` and \`14:09:00\` and \`datetime\` to \`2020-08-17 14:09:00\`.

### String data types

A \`string\` data type is a series of characters enclosed within single or double quotation marks that serves as a data type for storing text data.

### Query struct data type

In PPL, the \`struct\` data type corresponds to the [Object field type in
OpenSearch](https://opensearch.org/docs/latest/field-types/supported-field-types/object-fields/). The \`"."\` is used as the path selector for accessing the inner attribute of the struct data.

#### Example 1: Struct to store population data

The following example struct stores population data in an index containing the following fields: deep-nested object field \`city\`, object field of array value \`account\`, and nested field \`projects\`.

    {
      "mappings": {
        "properties": {
          "city": {
            "properties": {
              "name": {
                "type": "keyword"
              },
              "location": {
                "properties": {
                  "latitude": {
                    "type": "double"
                  }
                }
              }
            }
          },
          "account": {
            "properties": {
              "id": {
                "type": "keyword"
              }
            }
          },
          "projects": {
            "type": "nested",
            "properties": {
              "name": {
                "type": "keyword"
              }
            }
          }
        }
      }
    }

#### Example 2: Struct to store employee data

The following example struct stores employee data and includes a nested field:

    {
      "mappings": {
        "properties": {
          "id": {
            "type": "long"
          },
          "name": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "projects": {
            "type": "nested",
            "properties": {
              "name": {
                "type": "text",
                "fields": {
                  "keyword": {
                    "type": "keyword"
                  }
                },
                "fielddata": true
              },
              "started_year": {
                "type": "long"
              }
            }
          },
          "title": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          }
        }
      }
    }

Result set:

    {
      "employees_nested" : [
        {
          "id" : 3,
          "name" : "Bob Smith",
          "title" : null,
          "projects" : [
            {
              "name" : "AWS Redshift Spectrum querying",
              "started_year" : 1990
            },
            {
              "name" : "AWS Redshift security",
              "started_year" : 1999
            },
            {
              "name" : "AWS Aurora security",
              "started_year" : 2015
            }
          ]
        },
        {
          "id" : 4,
          "name" : "Susan Smith",
          "title" : "Dev Mgr",
          "projects" : [ ]
        },
        {
          "id" : 6,
          "name" : "Jane Smith",
          "title" : "Software Eng 2",
          "projects" : [
            {
              "name" : "AWS Redshift security",
              "started_year" : 1998
            },
            {
              "name" : "AWS Hello security",
              "started_year" : 2015,
              "address" : [
                {
                  "city" : "Dallas",
                  "state" : "TX"
                }
              ]
            }
          ]
        }
      ]
    }

#### Example 3: Select a struct inner attribute

The following example PPL query shows how to fetch \`city\` (top level), \`city.name\` (second level), and \`city.location.latitude\` (deeper level) struct data from the results:

    os> source=people | fields city, city.name, city.location.latitude;
    fetched rows / total rows = 1/1
    +-----------------------------------------------------+-------------+--------------------------+
    | city                                                | city.name   | city.location.latitude   |
    |-----------------------------------------------------+-------------+--------------------------|
    | {'name': 'Seattle', 'location': {'latitude': 10.5}} | Seattle     | 10.5                     |
    +-----------------------------------------------------+-------------+--------------------------+

#### Example 4: Group by a struct inner attribute

The following example PPL query shows how to group by a struct inner attribute:

    os> source=people | stats count() by city.name;
    fetched rows / total rows = 1/1
    +-----------+-------------+
    | count()   | city.name   |
    |-----------+-------------|
    | 1         | Seattle     |
    +-----------+-------------+

#### Example 5: Select an object field of an array value

The following example PPL query shows how to select a deeper level for object fields of array values that return the first element in the array. In this example, the document's inner field \`accounts.id\` has three values instead of a tuple: 

    os> source = people | fields accounts, accounts.id;
    fetched rows / total rows = 1/1
    +------------+---------------+
    | accounts   | accounts.id   |
    |------------+---------------|
    | {'id': 1}  | 1             |
    +------------+---------------+
`;
