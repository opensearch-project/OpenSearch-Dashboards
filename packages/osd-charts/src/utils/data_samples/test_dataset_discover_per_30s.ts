/* eslint-disable */

export const TEST_DATASET_DISCOVER = {
  "xAxisOrderedValues": [
    1560438420000,
    1560438510000
  ],
  "xAxisFormat": {
    "id": "date",
    "params": {
      "pattern": "HH:mm:ss"
    }
  },
  "xAxisLabel": "timestamp per 30 seconds",
  "ordered": {
    "interval": "PT30S",
    "date": true,
    "min": "2019-06-13T15:00:12.206Z",
    "max": "2019-06-13T15:15:12.206Z"
  },
  "yAxisFormat": {
    "id": "number"
  },
  "yAxisLabel": "Count",
  "series": [
    {
      "id": "1",
      "rawId": "Count-col-1-1",
      "label": "Count",
      "count": 0,
      "values": [
        {
          "x": 1560438420000,
          "y": 1,
          "extraMetrics": [],
          "xRaw": {
            "table": {
              "columns": [
                {
                  "aggConfig": {
                    "id": "2",
                    "enabled": true,
                    "type": "date_histogram",
                    "schema": "segment",
                    "params": {
                      "field": "timestamp",
                      "timeRange": {
                        "from": {
                          "_isAMomentObject": true,
                          "_isUTC": false,
                          "_pf": {
                            "empty": false,
                            "unusedTokens": [],
                            "unusedInput": [],
                            "overflow": -2,
                            "charsLeftOver": 0,
                            "nullInput": false,
                            "invalidMonth": null,
                            "invalidFormat": false,
                            "userInvalidated": false,
                            "iso": false,
                            "parsedDateParts": [],
                            "meridiem": null,
                            "rfc2822": false,
                            "weekdayMismatch": false
                          },
                          "_locale": {
                            "_calendar": {
                              "sameDay": "[Today at] LT",
                              "nextDay": "[Tomorrow at] LT",
                              "nextWeek": "dddd [at] LT",
                              "lastDay": "[Yesterday at] LT",
                              "lastWeek": "[Last] dddd [at] LT",
                              "sameElse": "L"
                            },
                            "_longDateFormat": {
                              "LTS": "h:mm:ss A",
                              "LT": "h:mm A",
                              "L": "MM/DD/YYYY",
                              "LL": "MMMM D, YYYY",
                              "LLL": "MMMM D, YYYY h:mm A",
                              "LLLL": "dddd, MMMM D, YYYY h:mm A"
                            },
                            "_invalidDate": "Invalid date",
                            "_dayOfMonthOrdinalParse": {},
                            "_relativeTime": {
                              "future": "in %s",
                              "past": "%s ago",
                              "s": "a few seconds",
                              "ss": "%d seconds",
                              "m": "a minute",
                              "mm": "%d minutes",
                              "h": "an hour",
                              "hh": "%d hours",
                              "d": "a day",
                              "dd": "%d days",
                              "M": "a month",
                              "MM": "%d months",
                              "y": "a year",
                              "yy": "%d years"
                            },
                            "_months": [
                              "January",
                              "February",
                              "March",
                              "April",
                              "May",
                              "June",
                              "July",
                              "August",
                              "September",
                              "October",
                              "November",
                              "December"
                            ],
                            "_monthsShort": [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec"
                            ],
                            "_week": {
                              "dow": 0,
                              "doy": 6
                            },
                            "_weekdays": [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday"
                            ],
                            "_weekdaysMin": [
                              "Su",
                              "Mo",
                              "Tu",
                              "We",
                              "Th",
                              "Fr",
                              "Sa"
                            ],
                            "_weekdaysShort": [
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat"
                            ],
                            "_meridiemParse": {},
                            "_abbr": "en",
                            "_config": {
                              "calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "invalidDate": "Invalid date",
                              "dayOfMonthOrdinalParse": {},
                              "relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "meridiemParse": {},
                              "abbr": "en"
                            },
                            "_dayOfMonthOrdinalParseLenient": {},
                            "parentLocale": {
                              "_calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "_longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "_invalidDate": "Invalid date",
                              "_dayOfMonthOrdinalParse": {},
                              "_relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "_months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "_monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "_week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "_weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "_weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "_weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "_meridiemParse": {},
                              "_abbr": "en",
                              "_config": {
                                "calendar": {
                                  "sameDay": "[Today at] LT",
                                  "nextDay": "[Tomorrow at] LT",
                                  "nextWeek": "dddd [at] LT",
                                  "lastDay": "[Yesterday at] LT",
                                  "lastWeek": "[Last] dddd [at] LT",
                                  "sameElse": "L"
                                },
                                "longDateFormat": {
                                  "LTS": "h:mm:ss A",
                                  "LT": "h:mm A",
                                  "L": "MM/DD/YYYY",
                                  "LL": "MMMM D, YYYY",
                                  "LLL": "MMMM D, YYYY h:mm A",
                                  "LLLL": "dddd, MMMM D, YYYY h:mm A"
                                },
                                "invalidDate": "Invalid date",
                                "dayOfMonthOrdinalParse": {},
                                "relativeTime": {
                                  "future": "in %s",
                                  "past": "%s ago",
                                  "s": "a few seconds",
                                  "ss": "%d seconds",
                                  "m": "a minute",
                                  "mm": "%d minutes",
                                  "h": "an hour",
                                  "hh": "%d hours",
                                  "d": "a day",
                                  "dd": "%d days",
                                  "M": "a month",
                                  "MM": "%d months",
                                  "y": "a year",
                                  "yy": "%d years"
                                },
                                "months": [
                                  "January",
                                  "February",
                                  "March",
                                  "April",
                                  "May",
                                  "June",
                                  "July",
                                  "August",
                                  "September",
                                  "October",
                                  "November",
                                  "December"
                                ],
                                "monthsShort": [
                                  "Jan",
                                  "Feb",
                                  "Mar",
                                  "Apr",
                                  "May",
                                  "Jun",
                                  "Jul",
                                  "Aug",
                                  "Sep",
                                  "Oct",
                                  "Nov",
                                  "Dec"
                                ],
                                "week": {
                                  "dow": 0,
                                  "doy": 6
                                },
                                "weekdays": [
                                  "Sunday",
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday"
                                ],
                                "weekdaysMin": [
                                  "Su",
                                  "Mo",
                                  "Tu",
                                  "We",
                                  "Th",
                                  "Fr",
                                  "Sa"
                                ],
                                "weekdaysShort": [
                                  "Sun",
                                  "Mon",
                                  "Tue",
                                  "Wed",
                                  "Thu",
                                  "Fri",
                                  "Sat"
                                ],
                                "meridiemParse": {},
                                "abbr": "en"
                              },
                              "_dayOfMonthOrdinalParseLenient": {}
                            }
                          },
                          "_d": "2019-06-13T15:00:12.206Z",
                          "_isValid": true,
                          "_z": null
                        },
                        "to": {
                          "_isAMomentObject": true,
                          "_isUTC": false,
                          "_pf": {
                            "empty": false,
                            "unusedTokens": [],
                            "unusedInput": [],
                            "overflow": -2,
                            "charsLeftOver": 0,
                            "nullInput": false,
                            "invalidMonth": null,
                            "invalidFormat": false,
                            "userInvalidated": false,
                            "iso": false,
                            "parsedDateParts": [],
                            "meridiem": null,
                            "rfc2822": false,
                            "weekdayMismatch": false
                          },
                          "_locale": {
                            "_calendar": {
                              "sameDay": "[Today at] LT",
                              "nextDay": "[Tomorrow at] LT",
                              "nextWeek": "dddd [at] LT",
                              "lastDay": "[Yesterday at] LT",
                              "lastWeek": "[Last] dddd [at] LT",
                              "sameElse": "L"
                            },
                            "_longDateFormat": {
                              "LTS": "h:mm:ss A",
                              "LT": "h:mm A",
                              "L": "MM/DD/YYYY",
                              "LL": "MMMM D, YYYY",
                              "LLL": "MMMM D, YYYY h:mm A",
                              "LLLL": "dddd, MMMM D, YYYY h:mm A"
                            },
                            "_invalidDate": "Invalid date",
                            "_dayOfMonthOrdinalParse": {},
                            "_relativeTime": {
                              "future": "in %s",
                              "past": "%s ago",
                              "s": "a few seconds",
                              "ss": "%d seconds",
                              "m": "a minute",
                              "mm": "%d minutes",
                              "h": "an hour",
                              "hh": "%d hours",
                              "d": "a day",
                              "dd": "%d days",
                              "M": "a month",
                              "MM": "%d months",
                              "y": "a year",
                              "yy": "%d years"
                            },
                            "_months": [
                              "January",
                              "February",
                              "March",
                              "April",
                              "May",
                              "June",
                              "July",
                              "August",
                              "September",
                              "October",
                              "November",
                              "December"
                            ],
                            "_monthsShort": [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec"
                            ],
                            "_week": {
                              "dow": 0,
                              "doy": 6
                            },
                            "_weekdays": [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday"
                            ],
                            "_weekdaysMin": [
                              "Su",
                              "Mo",
                              "Tu",
                              "We",
                              "Th",
                              "Fr",
                              "Sa"
                            ],
                            "_weekdaysShort": [
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat"
                            ],
                            "_meridiemParse": {},
                            "_abbr": "en",
                            "_config": {
                              "calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "invalidDate": "Invalid date",
                              "dayOfMonthOrdinalParse": {},
                              "relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "meridiemParse": {},
                              "abbr": "en"
                            },
                            "_dayOfMonthOrdinalParseLenient": {},
                            "parentLocale": {
                              "_calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "_longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "_invalidDate": "Invalid date",
                              "_dayOfMonthOrdinalParse": {},
                              "_relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "_months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "_monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "_week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "_weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "_weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "_weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "_meridiemParse": {},
                              "_abbr": "en",
                              "_config": {
                                "calendar": {
                                  "sameDay": "[Today at] LT",
                                  "nextDay": "[Tomorrow at] LT",
                                  "nextWeek": "dddd [at] LT",
                                  "lastDay": "[Yesterday at] LT",
                                  "lastWeek": "[Last] dddd [at] LT",
                                  "sameElse": "L"
                                },
                                "longDateFormat": {
                                  "LTS": "h:mm:ss A",
                                  "LT": "h:mm A",
                                  "L": "MM/DD/YYYY",
                                  "LL": "MMMM D, YYYY",
                                  "LLL": "MMMM D, YYYY h:mm A",
                                  "LLLL": "dddd, MMMM D, YYYY h:mm A"
                                },
                                "invalidDate": "Invalid date",
                                "dayOfMonthOrdinalParse": {},
                                "relativeTime": {
                                  "future": "in %s",
                                  "past": "%s ago",
                                  "s": "a few seconds",
                                  "ss": "%d seconds",
                                  "m": "a minute",
                                  "mm": "%d minutes",
                                  "h": "an hour",
                                  "hh": "%d hours",
                                  "d": "a day",
                                  "dd": "%d days",
                                  "M": "a month",
                                  "MM": "%d months",
                                  "y": "a year",
                                  "yy": "%d years"
                                },
                                "months": [
                                  "January",
                                  "February",
                                  "March",
                                  "April",
                                  "May",
                                  "June",
                                  "July",
                                  "August",
                                  "September",
                                  "October",
                                  "November",
                                  "December"
                                ],
                                "monthsShort": [
                                  "Jan",
                                  "Feb",
                                  "Mar",
                                  "Apr",
                                  "May",
                                  "Jun",
                                  "Jul",
                                  "Aug",
                                  "Sep",
                                  "Oct",
                                  "Nov",
                                  "Dec"
                                ],
                                "week": {
                                  "dow": 0,
                                  "doy": 6
                                },
                                "weekdays": [
                                  "Sunday",
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday"
                                ],
                                "weekdaysMin": [
                                  "Su",
                                  "Mo",
                                  "Tu",
                                  "We",
                                  "Th",
                                  "Fr",
                                  "Sa"
                                ],
                                "weekdaysShort": [
                                  "Sun",
                                  "Mon",
                                  "Tue",
                                  "Wed",
                                  "Thu",
                                  "Fri",
                                  "Sat"
                                ],
                                "meridiemParse": {},
                                "abbr": "en"
                              },
                              "_dayOfMonthOrdinalParseLenient": {}
                            }
                          },
                          "_d": "2019-06-13T15:15:12.206Z",
                          "_isValid": true,
                          "_z": null
                        }
                      },
                      "useNormalizedEsInterval": true,
                      "interval": "auto",
                      "drop_partials": false,
                      "min_doc_count": 1,
                      "extended_bounds": {}
                    }
                  },
                  "id": "col-0-2",
                  "name": "timestamp per 30 seconds"
                },
                {
                  "aggConfig": {
                    "id": "1",
                    "enabled": true,
                    "type": "count",
                    "schema": "metric",
                    "params": {}
                  },
                  "id": "col-1-1",
                  "name": "Count"
                }
              ],
              "rows": [
                {
                  "col-0-2": 1560438420000,
                  "col-1-1": 1
                },
                {
                  "col-0-2": 1560438510000,
                  "col-1-1": 1
                }
              ]
            },
            "column": 0,
            "row": 0,
            "value": 1560438420000
          },
          "yRaw": {
            "table": {
              "columns": [
                {
                  "aggConfig": {
                    "id": "2",
                    "enabled": true,
                    "type": "date_histogram",
                    "schema": "segment",
                    "params": {
                      "field": "timestamp",
                      "timeRange": {
                        "from": {
                          "_isAMomentObject": true,
                          "_isUTC": false,
                          "_pf": {
                            "empty": false,
                            "unusedTokens": [],
                            "unusedInput": [],
                            "overflow": -2,
                            "charsLeftOver": 0,
                            "nullInput": false,
                            "invalidMonth": null,
                            "invalidFormat": false,
                            "userInvalidated": false,
                            "iso": false,
                            "parsedDateParts": [],
                            "meridiem": null,
                            "rfc2822": false,
                            "weekdayMismatch": false
                          },
                          "_locale": {
                            "_calendar": {
                              "sameDay": "[Today at] LT",
                              "nextDay": "[Tomorrow at] LT",
                              "nextWeek": "dddd [at] LT",
                              "lastDay": "[Yesterday at] LT",
                              "lastWeek": "[Last] dddd [at] LT",
                              "sameElse": "L"
                            },
                            "_longDateFormat": {
                              "LTS": "h:mm:ss A",
                              "LT": "h:mm A",
                              "L": "MM/DD/YYYY",
                              "LL": "MMMM D, YYYY",
                              "LLL": "MMMM D, YYYY h:mm A",
                              "LLLL": "dddd, MMMM D, YYYY h:mm A"
                            },
                            "_invalidDate": "Invalid date",
                            "_dayOfMonthOrdinalParse": {},
                            "_relativeTime": {
                              "future": "in %s",
                              "past": "%s ago",
                              "s": "a few seconds",
                              "ss": "%d seconds",
                              "m": "a minute",
                              "mm": "%d minutes",
                              "h": "an hour",
                              "hh": "%d hours",
                              "d": "a day",
                              "dd": "%d days",
                              "M": "a month",
                              "MM": "%d months",
                              "y": "a year",
                              "yy": "%d years"
                            },
                            "_months": [
                              "January",
                              "February",
                              "March",
                              "April",
                              "May",
                              "June",
                              "July",
                              "August",
                              "September",
                              "October",
                              "November",
                              "December"
                            ],
                            "_monthsShort": [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec"
                            ],
                            "_week": {
                              "dow": 0,
                              "doy": 6
                            },
                            "_weekdays": [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday"
                            ],
                            "_weekdaysMin": [
                              "Su",
                              "Mo",
                              "Tu",
                              "We",
                              "Th",
                              "Fr",
                              "Sa"
                            ],
                            "_weekdaysShort": [
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat"
                            ],
                            "_meridiemParse": {},
                            "_abbr": "en",
                            "_config": {
                              "calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "invalidDate": "Invalid date",
                              "dayOfMonthOrdinalParse": {},
                              "relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "meridiemParse": {},
                              "abbr": "en"
                            },
                            "_dayOfMonthOrdinalParseLenient": {},
                            "parentLocale": {
                              "_calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "_longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "_invalidDate": "Invalid date",
                              "_dayOfMonthOrdinalParse": {},
                              "_relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "_months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "_monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "_week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "_weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "_weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "_weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "_meridiemParse": {},
                              "_abbr": "en",
                              "_config": {
                                "calendar": {
                                  "sameDay": "[Today at] LT",
                                  "nextDay": "[Tomorrow at] LT",
                                  "nextWeek": "dddd [at] LT",
                                  "lastDay": "[Yesterday at] LT",
                                  "lastWeek": "[Last] dddd [at] LT",
                                  "sameElse": "L"
                                },
                                "longDateFormat": {
                                  "LTS": "h:mm:ss A",
                                  "LT": "h:mm A",
                                  "L": "MM/DD/YYYY",
                                  "LL": "MMMM D, YYYY",
                                  "LLL": "MMMM D, YYYY h:mm A",
                                  "LLLL": "dddd, MMMM D, YYYY h:mm A"
                                },
                                "invalidDate": "Invalid date",
                                "dayOfMonthOrdinalParse": {},
                                "relativeTime": {
                                  "future": "in %s",
                                  "past": "%s ago",
                                  "s": "a few seconds",
                                  "ss": "%d seconds",
                                  "m": "a minute",
                                  "mm": "%d minutes",
                                  "h": "an hour",
                                  "hh": "%d hours",
                                  "d": "a day",
                                  "dd": "%d days",
                                  "M": "a month",
                                  "MM": "%d months",
                                  "y": "a year",
                                  "yy": "%d years"
                                },
                                "months": [
                                  "January",
                                  "February",
                                  "March",
                                  "April",
                                  "May",
                                  "June",
                                  "July",
                                  "August",
                                  "September",
                                  "October",
                                  "November",
                                  "December"
                                ],
                                "monthsShort": [
                                  "Jan",
                                  "Feb",
                                  "Mar",
                                  "Apr",
                                  "May",
                                  "Jun",
                                  "Jul",
                                  "Aug",
                                  "Sep",
                                  "Oct",
                                  "Nov",
                                  "Dec"
                                ],
                                "week": {
                                  "dow": 0,
                                  "doy": 6
                                },
                                "weekdays": [
                                  "Sunday",
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday"
                                ],
                                "weekdaysMin": [
                                  "Su",
                                  "Mo",
                                  "Tu",
                                  "We",
                                  "Th",
                                  "Fr",
                                  "Sa"
                                ],
                                "weekdaysShort": [
                                  "Sun",
                                  "Mon",
                                  "Tue",
                                  "Wed",
                                  "Thu",
                                  "Fri",
                                  "Sat"
                                ],
                                "meridiemParse": {},
                                "abbr": "en"
                              },
                              "_dayOfMonthOrdinalParseLenient": {}
                            }
                          },
                          "_d": "2019-06-13T15:00:12.206Z",
                          "_isValid": true,
                          "_z": null
                        },
                        "to": {
                          "_isAMomentObject": true,
                          "_isUTC": false,
                          "_pf": {
                            "empty": false,
                            "unusedTokens": [],
                            "unusedInput": [],
                            "overflow": -2,
                            "charsLeftOver": 0,
                            "nullInput": false,
                            "invalidMonth": null,
                            "invalidFormat": false,
                            "userInvalidated": false,
                            "iso": false,
                            "parsedDateParts": [],
                            "meridiem": null,
                            "rfc2822": false,
                            "weekdayMismatch": false
                          },
                          "_locale": {
                            "_calendar": {
                              "sameDay": "[Today at] LT",
                              "nextDay": "[Tomorrow at] LT",
                              "nextWeek": "dddd [at] LT",
                              "lastDay": "[Yesterday at] LT",
                              "lastWeek": "[Last] dddd [at] LT",
                              "sameElse": "L"
                            },
                            "_longDateFormat": {
                              "LTS": "h:mm:ss A",
                              "LT": "h:mm A",
                              "L": "MM/DD/YYYY",
                              "LL": "MMMM D, YYYY",
                              "LLL": "MMMM D, YYYY h:mm A",
                              "LLLL": "dddd, MMMM D, YYYY h:mm A"
                            },
                            "_invalidDate": "Invalid date",
                            "_dayOfMonthOrdinalParse": {},
                            "_relativeTime": {
                              "future": "in %s",
                              "past": "%s ago",
                              "s": "a few seconds",
                              "ss": "%d seconds",
                              "m": "a minute",
                              "mm": "%d minutes",
                              "h": "an hour",
                              "hh": "%d hours",
                              "d": "a day",
                              "dd": "%d days",
                              "M": "a month",
                              "MM": "%d months",
                              "y": "a year",
                              "yy": "%d years"
                            },
                            "_months": [
                              "January",
                              "February",
                              "March",
                              "April",
                              "May",
                              "June",
                              "July",
                              "August",
                              "September",
                              "October",
                              "November",
                              "December"
                            ],
                            "_monthsShort": [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec"
                            ],
                            "_week": {
                              "dow": 0,
                              "doy": 6
                            },
                            "_weekdays": [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday"
                            ],
                            "_weekdaysMin": [
                              "Su",
                              "Mo",
                              "Tu",
                              "We",
                              "Th",
                              "Fr",
                              "Sa"
                            ],
                            "_weekdaysShort": [
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat"
                            ],
                            "_meridiemParse": {},
                            "_abbr": "en",
                            "_config": {
                              "calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "invalidDate": "Invalid date",
                              "dayOfMonthOrdinalParse": {},
                              "relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "meridiemParse": {},
                              "abbr": "en"
                            },
                            "_dayOfMonthOrdinalParseLenient": {},
                            "parentLocale": {
                              "_calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "_longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "_invalidDate": "Invalid date",
                              "_dayOfMonthOrdinalParse": {},
                              "_relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "_months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "_monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "_week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "_weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "_weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "_weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "_meridiemParse": {},
                              "_abbr": "en",
                              "_config": {
                                "calendar": {
                                  "sameDay": "[Today at] LT",
                                  "nextDay": "[Tomorrow at] LT",
                                  "nextWeek": "dddd [at] LT",
                                  "lastDay": "[Yesterday at] LT",
                                  "lastWeek": "[Last] dddd [at] LT",
                                  "sameElse": "L"
                                },
                                "longDateFormat": {
                                  "LTS": "h:mm:ss A",
                                  "LT": "h:mm A",
                                  "L": "MM/DD/YYYY",
                                  "LL": "MMMM D, YYYY",
                                  "LLL": "MMMM D, YYYY h:mm A",
                                  "LLLL": "dddd, MMMM D, YYYY h:mm A"
                                },
                                "invalidDate": "Invalid date",
                                "dayOfMonthOrdinalParse": {},
                                "relativeTime": {
                                  "future": "in %s",
                                  "past": "%s ago",
                                  "s": "a few seconds",
                                  "ss": "%d seconds",
                                  "m": "a minute",
                                  "mm": "%d minutes",
                                  "h": "an hour",
                                  "hh": "%d hours",
                                  "d": "a day",
                                  "dd": "%d days",
                                  "M": "a month",
                                  "MM": "%d months",
                                  "y": "a year",
                                  "yy": "%d years"
                                },
                                "months": [
                                  "January",
                                  "February",
                                  "March",
                                  "April",
                                  "May",
                                  "June",
                                  "July",
                                  "August",
                                  "September",
                                  "October",
                                  "November",
                                  "December"
                                ],
                                "monthsShort": [
                                  "Jan",
                                  "Feb",
                                  "Mar",
                                  "Apr",
                                  "May",
                                  "Jun",
                                  "Jul",
                                  "Aug",
                                  "Sep",
                                  "Oct",
                                  "Nov",
                                  "Dec"
                                ],
                                "week": {
                                  "dow": 0,
                                  "doy": 6
                                },
                                "weekdays": [
                                  "Sunday",
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday"
                                ],
                                "weekdaysMin": [
                                  "Su",
                                  "Mo",
                                  "Tu",
                                  "We",
                                  "Th",
                                  "Fr",
                                  "Sa"
                                ],
                                "weekdaysShort": [
                                  "Sun",
                                  "Mon",
                                  "Tue",
                                  "Wed",
                                  "Thu",
                                  "Fri",
                                  "Sat"
                                ],
                                "meridiemParse": {},
                                "abbr": "en"
                              },
                              "_dayOfMonthOrdinalParseLenient": {}
                            }
                          },
                          "_d": "2019-06-13T15:15:12.206Z",
                          "_isValid": true,
                          "_z": null
                        }
                      },
                      "useNormalizedEsInterval": true,
                      "interval": "auto",
                      "drop_partials": false,
                      "min_doc_count": 1,
                      "extended_bounds": {}
                    }
                  },
                  "id": "col-0-2",
                  "name": "timestamp per 30 seconds"
                },
                {
                  "aggConfig": {
                    "id": "1",
                    "enabled": true,
                    "type": "count",
                    "schema": "metric",
                    "params": {}
                  },
                  "id": "col-1-1",
                  "name": "Count"
                }
              ],
              "rows": [
                {
                  "col-0-2": 1560438420000,
                  "col-1-1": 1
                },
                {
                  "col-0-2": 1560438510000,
                  "col-1-1": 1
                }
              ]
            },
            "column": 1,
            "row": 0,
            "value": 1
          },
          "parent": null,
          "series": "Count",
          "seriesId": "Count-col-1-1"
        },
        {
          "x": 1560438510000,
          "y": 1,
          "extraMetrics": [],
          "xRaw": {
            "table": {
              "columns": [
                {
                  "aggConfig": {
                    "id": "2",
                    "enabled": true,
                    "type": "date_histogram",
                    "schema": "segment",
                    "params": {
                      "field": "timestamp",
                      "timeRange": {
                        "from": {
                          "_isAMomentObject": true,
                          "_isUTC": false,
                          "_pf": {
                            "empty": false,
                            "unusedTokens": [],
                            "unusedInput": [],
                            "overflow": -2,
                            "charsLeftOver": 0,
                            "nullInput": false,
                            "invalidMonth": null,
                            "invalidFormat": false,
                            "userInvalidated": false,
                            "iso": false,
                            "parsedDateParts": [],
                            "meridiem": null,
                            "rfc2822": false,
                            "weekdayMismatch": false
                          },
                          "_locale": {
                            "_calendar": {
                              "sameDay": "[Today at] LT",
                              "nextDay": "[Tomorrow at] LT",
                              "nextWeek": "dddd [at] LT",
                              "lastDay": "[Yesterday at] LT",
                              "lastWeek": "[Last] dddd [at] LT",
                              "sameElse": "L"
                            },
                            "_longDateFormat": {
                              "LTS": "h:mm:ss A",
                              "LT": "h:mm A",
                              "L": "MM/DD/YYYY",
                              "LL": "MMMM D, YYYY",
                              "LLL": "MMMM D, YYYY h:mm A",
                              "LLLL": "dddd, MMMM D, YYYY h:mm A"
                            },
                            "_invalidDate": "Invalid date",
                            "_dayOfMonthOrdinalParse": {},
                            "_relativeTime": {
                              "future": "in %s",
                              "past": "%s ago",
                              "s": "a few seconds",
                              "ss": "%d seconds",
                              "m": "a minute",
                              "mm": "%d minutes",
                              "h": "an hour",
                              "hh": "%d hours",
                              "d": "a day",
                              "dd": "%d days",
                              "M": "a month",
                              "MM": "%d months",
                              "y": "a year",
                              "yy": "%d years"
                            },
                            "_months": [
                              "January",
                              "February",
                              "March",
                              "April",
                              "May",
                              "June",
                              "July",
                              "August",
                              "September",
                              "October",
                              "November",
                              "December"
                            ],
                            "_monthsShort": [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec"
                            ],
                            "_week": {
                              "dow": 0,
                              "doy": 6
                            },
                            "_weekdays": [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday"
                            ],
                            "_weekdaysMin": [
                              "Su",
                              "Mo",
                              "Tu",
                              "We",
                              "Th",
                              "Fr",
                              "Sa"
                            ],
                            "_weekdaysShort": [
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat"
                            ],
                            "_meridiemParse": {},
                            "_abbr": "en",
                            "_config": {
                              "calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "invalidDate": "Invalid date",
                              "dayOfMonthOrdinalParse": {},
                              "relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "meridiemParse": {},
                              "abbr": "en"
                            },
                            "_dayOfMonthOrdinalParseLenient": {},
                            "parentLocale": {
                              "_calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "_longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "_invalidDate": "Invalid date",
                              "_dayOfMonthOrdinalParse": {},
                              "_relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "_months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "_monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "_week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "_weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "_weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "_weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "_meridiemParse": {},
                              "_abbr": "en",
                              "_config": {
                                "calendar": {
                                  "sameDay": "[Today at] LT",
                                  "nextDay": "[Tomorrow at] LT",
                                  "nextWeek": "dddd [at] LT",
                                  "lastDay": "[Yesterday at] LT",
                                  "lastWeek": "[Last] dddd [at] LT",
                                  "sameElse": "L"
                                },
                                "longDateFormat": {
                                  "LTS": "h:mm:ss A",
                                  "LT": "h:mm A",
                                  "L": "MM/DD/YYYY",
                                  "LL": "MMMM D, YYYY",
                                  "LLL": "MMMM D, YYYY h:mm A",
                                  "LLLL": "dddd, MMMM D, YYYY h:mm A"
                                },
                                "invalidDate": "Invalid date",
                                "dayOfMonthOrdinalParse": {},
                                "relativeTime": {
                                  "future": "in %s",
                                  "past": "%s ago",
                                  "s": "a few seconds",
                                  "ss": "%d seconds",
                                  "m": "a minute",
                                  "mm": "%d minutes",
                                  "h": "an hour",
                                  "hh": "%d hours",
                                  "d": "a day",
                                  "dd": "%d days",
                                  "M": "a month",
                                  "MM": "%d months",
                                  "y": "a year",
                                  "yy": "%d years"
                                },
                                "months": [
                                  "January",
                                  "February",
                                  "March",
                                  "April",
                                  "May",
                                  "June",
                                  "July",
                                  "August",
                                  "September",
                                  "October",
                                  "November",
                                  "December"
                                ],
                                "monthsShort": [
                                  "Jan",
                                  "Feb",
                                  "Mar",
                                  "Apr",
                                  "May",
                                  "Jun",
                                  "Jul",
                                  "Aug",
                                  "Sep",
                                  "Oct",
                                  "Nov",
                                  "Dec"
                                ],
                                "week": {
                                  "dow": 0,
                                  "doy": 6
                                },
                                "weekdays": [
                                  "Sunday",
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday"
                                ],
                                "weekdaysMin": [
                                  "Su",
                                  "Mo",
                                  "Tu",
                                  "We",
                                  "Th",
                                  "Fr",
                                  "Sa"
                                ],
                                "weekdaysShort": [
                                  "Sun",
                                  "Mon",
                                  "Tue",
                                  "Wed",
                                  "Thu",
                                  "Fri",
                                  "Sat"
                                ],
                                "meridiemParse": {},
                                "abbr": "en"
                              },
                              "_dayOfMonthOrdinalParseLenient": {}
                            }
                          },
                          "_d": "2019-06-13T15:00:12.206Z",
                          "_isValid": true,
                          "_z": null
                        },
                        "to": {
                          "_isAMomentObject": true,
                          "_isUTC": false,
                          "_pf": {
                            "empty": false,
                            "unusedTokens": [],
                            "unusedInput": [],
                            "overflow": -2,
                            "charsLeftOver": 0,
                            "nullInput": false,
                            "invalidMonth": null,
                            "invalidFormat": false,
                            "userInvalidated": false,
                            "iso": false,
                            "parsedDateParts": [],
                            "meridiem": null,
                            "rfc2822": false,
                            "weekdayMismatch": false
                          },
                          "_locale": {
                            "_calendar": {
                              "sameDay": "[Today at] LT",
                              "nextDay": "[Tomorrow at] LT",
                              "nextWeek": "dddd [at] LT",
                              "lastDay": "[Yesterday at] LT",
                              "lastWeek": "[Last] dddd [at] LT",
                              "sameElse": "L"
                            },
                            "_longDateFormat": {
                              "LTS": "h:mm:ss A",
                              "LT": "h:mm A",
                              "L": "MM/DD/YYYY",
                              "LL": "MMMM D, YYYY",
                              "LLL": "MMMM D, YYYY h:mm A",
                              "LLLL": "dddd, MMMM D, YYYY h:mm A"
                            },
                            "_invalidDate": "Invalid date",
                            "_dayOfMonthOrdinalParse": {},
                            "_relativeTime": {
                              "future": "in %s",
                              "past": "%s ago",
                              "s": "a few seconds",
                              "ss": "%d seconds",
                              "m": "a minute",
                              "mm": "%d minutes",
                              "h": "an hour",
                              "hh": "%d hours",
                              "d": "a day",
                              "dd": "%d days",
                              "M": "a month",
                              "MM": "%d months",
                              "y": "a year",
                              "yy": "%d years"
                            },
                            "_months": [
                              "January",
                              "February",
                              "March",
                              "April",
                              "May",
                              "June",
                              "July",
                              "August",
                              "September",
                              "October",
                              "November",
                              "December"
                            ],
                            "_monthsShort": [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec"
                            ],
                            "_week": {
                              "dow": 0,
                              "doy": 6
                            },
                            "_weekdays": [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday"
                            ],
                            "_weekdaysMin": [
                              "Su",
                              "Mo",
                              "Tu",
                              "We",
                              "Th",
                              "Fr",
                              "Sa"
                            ],
                            "_weekdaysShort": [
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat"
                            ],
                            "_meridiemParse": {},
                            "_abbr": "en",
                            "_config": {
                              "calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "invalidDate": "Invalid date",
                              "dayOfMonthOrdinalParse": {},
                              "relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "meridiemParse": {},
                              "abbr": "en"
                            },
                            "_dayOfMonthOrdinalParseLenient": {},
                            "parentLocale": {
                              "_calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "_longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "_invalidDate": "Invalid date",
                              "_dayOfMonthOrdinalParse": {},
                              "_relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "_months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "_monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "_week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "_weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "_weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "_weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "_meridiemParse": {},
                              "_abbr": "en",
                              "_config": {
                                "calendar": {
                                  "sameDay": "[Today at] LT",
                                  "nextDay": "[Tomorrow at] LT",
                                  "nextWeek": "dddd [at] LT",
                                  "lastDay": "[Yesterday at] LT",
                                  "lastWeek": "[Last] dddd [at] LT",
                                  "sameElse": "L"
                                },
                                "longDateFormat": {
                                  "LTS": "h:mm:ss A",
                                  "LT": "h:mm A",
                                  "L": "MM/DD/YYYY",
                                  "LL": "MMMM D, YYYY",
                                  "LLL": "MMMM D, YYYY h:mm A",
                                  "LLLL": "dddd, MMMM D, YYYY h:mm A"
                                },
                                "invalidDate": "Invalid date",
                                "dayOfMonthOrdinalParse": {},
                                "relativeTime": {
                                  "future": "in %s",
                                  "past": "%s ago",
                                  "s": "a few seconds",
                                  "ss": "%d seconds",
                                  "m": "a minute",
                                  "mm": "%d minutes",
                                  "h": "an hour",
                                  "hh": "%d hours",
                                  "d": "a day",
                                  "dd": "%d days",
                                  "M": "a month",
                                  "MM": "%d months",
                                  "y": "a year",
                                  "yy": "%d years"
                                },
                                "months": [
                                  "January",
                                  "February",
                                  "March",
                                  "April",
                                  "May",
                                  "June",
                                  "July",
                                  "August",
                                  "September",
                                  "October",
                                  "November",
                                  "December"
                                ],
                                "monthsShort": [
                                  "Jan",
                                  "Feb",
                                  "Mar",
                                  "Apr",
                                  "May",
                                  "Jun",
                                  "Jul",
                                  "Aug",
                                  "Sep",
                                  "Oct",
                                  "Nov",
                                  "Dec"
                                ],
                                "week": {
                                  "dow": 0,
                                  "doy": 6
                                },
                                "weekdays": [
                                  "Sunday",
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday"
                                ],
                                "weekdaysMin": [
                                  "Su",
                                  "Mo",
                                  "Tu",
                                  "We",
                                  "Th",
                                  "Fr",
                                  "Sa"
                                ],
                                "weekdaysShort": [
                                  "Sun",
                                  "Mon",
                                  "Tue",
                                  "Wed",
                                  "Thu",
                                  "Fri",
                                  "Sat"
                                ],
                                "meridiemParse": {},
                                "abbr": "en"
                              },
                              "_dayOfMonthOrdinalParseLenient": {}
                            }
                          },
                          "_d": "2019-06-13T15:15:12.206Z",
                          "_isValid": true,
                          "_z": null
                        }
                      },
                      "useNormalizedEsInterval": true,
                      "interval": "auto",
                      "drop_partials": false,
                      "min_doc_count": 1,
                      "extended_bounds": {}
                    }
                  },
                  "id": "col-0-2",
                  "name": "timestamp per 30 seconds"
                },
                {
                  "aggConfig": {
                    "id": "1",
                    "enabled": true,
                    "type": "count",
                    "schema": "metric",
                    "params": {}
                  },
                  "id": "col-1-1",
                  "name": "Count"
                }
              ],
              "rows": [
                {
                  "col-0-2": 1560438420000,
                  "col-1-1": 1
                },
                {
                  "col-0-2": 1560438510000,
                  "col-1-1": 1
                }
              ]
            },
            "column": 0,
            "row": 1,
            "value": 1560438510000
          },
          "yRaw": {
            "table": {
              "columns": [
                {
                  "aggConfig": {
                    "id": "2",
                    "enabled": true,
                    "type": "date_histogram",
                    "schema": "segment",
                    "params": {
                      "field": "timestamp",
                      "timeRange": {
                        "from": {
                          "_isAMomentObject": true,
                          "_isUTC": false,
                          "_pf": {
                            "empty": false,
                            "unusedTokens": [],
                            "unusedInput": [],
                            "overflow": -2,
                            "charsLeftOver": 0,
                            "nullInput": false,
                            "invalidMonth": null,
                            "invalidFormat": false,
                            "userInvalidated": false,
                            "iso": false,
                            "parsedDateParts": [],
                            "meridiem": null,
                            "rfc2822": false,
                            "weekdayMismatch": false
                          },
                          "_locale": {
                            "_calendar": {
                              "sameDay": "[Today at] LT",
                              "nextDay": "[Tomorrow at] LT",
                              "nextWeek": "dddd [at] LT",
                              "lastDay": "[Yesterday at] LT",
                              "lastWeek": "[Last] dddd [at] LT",
                              "sameElse": "L"
                            },
                            "_longDateFormat": {
                              "LTS": "h:mm:ss A",
                              "LT": "h:mm A",
                              "L": "MM/DD/YYYY",
                              "LL": "MMMM D, YYYY",
                              "LLL": "MMMM D, YYYY h:mm A",
                              "LLLL": "dddd, MMMM D, YYYY h:mm A"
                            },
                            "_invalidDate": "Invalid date",
                            "_dayOfMonthOrdinalParse": {},
                            "_relativeTime": {
                              "future": "in %s",
                              "past": "%s ago",
                              "s": "a few seconds",
                              "ss": "%d seconds",
                              "m": "a minute",
                              "mm": "%d minutes",
                              "h": "an hour",
                              "hh": "%d hours",
                              "d": "a day",
                              "dd": "%d days",
                              "M": "a month",
                              "MM": "%d months",
                              "y": "a year",
                              "yy": "%d years"
                            },
                            "_months": [
                              "January",
                              "February",
                              "March",
                              "April",
                              "May",
                              "June",
                              "July",
                              "August",
                              "September",
                              "October",
                              "November",
                              "December"
                            ],
                            "_monthsShort": [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec"
                            ],
                            "_week": {
                              "dow": 0,
                              "doy": 6
                            },
                            "_weekdays": [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday"
                            ],
                            "_weekdaysMin": [
                              "Su",
                              "Mo",
                              "Tu",
                              "We",
                              "Th",
                              "Fr",
                              "Sa"
                            ],
                            "_weekdaysShort": [
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat"
                            ],
                            "_meridiemParse": {},
                            "_abbr": "en",
                            "_config": {
                              "calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "invalidDate": "Invalid date",
                              "dayOfMonthOrdinalParse": {},
                              "relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "meridiemParse": {},
                              "abbr": "en"
                            },
                            "_dayOfMonthOrdinalParseLenient": {},
                            "parentLocale": {
                              "_calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "_longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "_invalidDate": "Invalid date",
                              "_dayOfMonthOrdinalParse": {},
                              "_relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "_months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "_monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "_week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "_weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "_weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "_weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "_meridiemParse": {},
                              "_abbr": "en",
                              "_config": {
                                "calendar": {
                                  "sameDay": "[Today at] LT",
                                  "nextDay": "[Tomorrow at] LT",
                                  "nextWeek": "dddd [at] LT",
                                  "lastDay": "[Yesterday at] LT",
                                  "lastWeek": "[Last] dddd [at] LT",
                                  "sameElse": "L"
                                },
                                "longDateFormat": {
                                  "LTS": "h:mm:ss A",
                                  "LT": "h:mm A",
                                  "L": "MM/DD/YYYY",
                                  "LL": "MMMM D, YYYY",
                                  "LLL": "MMMM D, YYYY h:mm A",
                                  "LLLL": "dddd, MMMM D, YYYY h:mm A"
                                },
                                "invalidDate": "Invalid date",
                                "dayOfMonthOrdinalParse": {},
                                "relativeTime": {
                                  "future": "in %s",
                                  "past": "%s ago",
                                  "s": "a few seconds",
                                  "ss": "%d seconds",
                                  "m": "a minute",
                                  "mm": "%d minutes",
                                  "h": "an hour",
                                  "hh": "%d hours",
                                  "d": "a day",
                                  "dd": "%d days",
                                  "M": "a month",
                                  "MM": "%d months",
                                  "y": "a year",
                                  "yy": "%d years"
                                },
                                "months": [
                                  "January",
                                  "February",
                                  "March",
                                  "April",
                                  "May",
                                  "June",
                                  "July",
                                  "August",
                                  "September",
                                  "October",
                                  "November",
                                  "December"
                                ],
                                "monthsShort": [
                                  "Jan",
                                  "Feb",
                                  "Mar",
                                  "Apr",
                                  "May",
                                  "Jun",
                                  "Jul",
                                  "Aug",
                                  "Sep",
                                  "Oct",
                                  "Nov",
                                  "Dec"
                                ],
                                "week": {
                                  "dow": 0,
                                  "doy": 6
                                },
                                "weekdays": [
                                  "Sunday",
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday"
                                ],
                                "weekdaysMin": [
                                  "Su",
                                  "Mo",
                                  "Tu",
                                  "We",
                                  "Th",
                                  "Fr",
                                  "Sa"
                                ],
                                "weekdaysShort": [
                                  "Sun",
                                  "Mon",
                                  "Tue",
                                  "Wed",
                                  "Thu",
                                  "Fri",
                                  "Sat"
                                ],
                                "meridiemParse": {},
                                "abbr": "en"
                              },
                              "_dayOfMonthOrdinalParseLenient": {}
                            }
                          },
                          "_d": "2019-06-13T15:00:12.206Z",
                          "_isValid": true,
                          "_z": null
                        },
                        "to": {
                          "_isAMomentObject": true,
                          "_isUTC": false,
                          "_pf": {
                            "empty": false,
                            "unusedTokens": [],
                            "unusedInput": [],
                            "overflow": -2,
                            "charsLeftOver": 0,
                            "nullInput": false,
                            "invalidMonth": null,
                            "invalidFormat": false,
                            "userInvalidated": false,
                            "iso": false,
                            "parsedDateParts": [],
                            "meridiem": null,
                            "rfc2822": false,
                            "weekdayMismatch": false
                          },
                          "_locale": {
                            "_calendar": {
                              "sameDay": "[Today at] LT",
                              "nextDay": "[Tomorrow at] LT",
                              "nextWeek": "dddd [at] LT",
                              "lastDay": "[Yesterday at] LT",
                              "lastWeek": "[Last] dddd [at] LT",
                              "sameElse": "L"
                            },
                            "_longDateFormat": {
                              "LTS": "h:mm:ss A",
                              "LT": "h:mm A",
                              "L": "MM/DD/YYYY",
                              "LL": "MMMM D, YYYY",
                              "LLL": "MMMM D, YYYY h:mm A",
                              "LLLL": "dddd, MMMM D, YYYY h:mm A"
                            },
                            "_invalidDate": "Invalid date",
                            "_dayOfMonthOrdinalParse": {},
                            "_relativeTime": {
                              "future": "in %s",
                              "past": "%s ago",
                              "s": "a few seconds",
                              "ss": "%d seconds",
                              "m": "a minute",
                              "mm": "%d minutes",
                              "h": "an hour",
                              "hh": "%d hours",
                              "d": "a day",
                              "dd": "%d days",
                              "M": "a month",
                              "MM": "%d months",
                              "y": "a year",
                              "yy": "%d years"
                            },
                            "_months": [
                              "January",
                              "February",
                              "March",
                              "April",
                              "May",
                              "June",
                              "July",
                              "August",
                              "September",
                              "October",
                              "November",
                              "December"
                            ],
                            "_monthsShort": [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec"
                            ],
                            "_week": {
                              "dow": 0,
                              "doy": 6
                            },
                            "_weekdays": [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday"
                            ],
                            "_weekdaysMin": [
                              "Su",
                              "Mo",
                              "Tu",
                              "We",
                              "Th",
                              "Fr",
                              "Sa"
                            ],
                            "_weekdaysShort": [
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat"
                            ],
                            "_meridiemParse": {},
                            "_abbr": "en",
                            "_config": {
                              "calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "invalidDate": "Invalid date",
                              "dayOfMonthOrdinalParse": {},
                              "relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "meridiemParse": {},
                              "abbr": "en"
                            },
                            "_dayOfMonthOrdinalParseLenient": {},
                            "parentLocale": {
                              "_calendar": {
                                "sameDay": "[Today at] LT",
                                "nextDay": "[Tomorrow at] LT",
                                "nextWeek": "dddd [at] LT",
                                "lastDay": "[Yesterday at] LT",
                                "lastWeek": "[Last] dddd [at] LT",
                                "sameElse": "L"
                              },
                              "_longDateFormat": {
                                "LTS": "h:mm:ss A",
                                "LT": "h:mm A",
                                "L": "MM/DD/YYYY",
                                "LL": "MMMM D, YYYY",
                                "LLL": "MMMM D, YYYY h:mm A",
                                "LLLL": "dddd, MMMM D, YYYY h:mm A"
                              },
                              "_invalidDate": "Invalid date",
                              "_dayOfMonthOrdinalParse": {},
                              "_relativeTime": {
                                "future": "in %s",
                                "past": "%s ago",
                                "s": "a few seconds",
                                "ss": "%d seconds",
                                "m": "a minute",
                                "mm": "%d minutes",
                                "h": "an hour",
                                "hh": "%d hours",
                                "d": "a day",
                                "dd": "%d days",
                                "M": "a month",
                                "MM": "%d months",
                                "y": "a year",
                                "yy": "%d years"
                              },
                              "_months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                              ],
                              "_monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                              ],
                              "_week": {
                                "dow": 0,
                                "doy": 6
                              },
                              "_weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                              ],
                              "_weekdaysMin": [
                                "Su",
                                "Mo",
                                "Tu",
                                "We",
                                "Th",
                                "Fr",
                                "Sa"
                              ],
                              "_weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                              ],
                              "_meridiemParse": {},
                              "_abbr": "en",
                              "_config": {
                                "calendar": {
                                  "sameDay": "[Today at] LT",
                                  "nextDay": "[Tomorrow at] LT",
                                  "nextWeek": "dddd [at] LT",
                                  "lastDay": "[Yesterday at] LT",
                                  "lastWeek": "[Last] dddd [at] LT",
                                  "sameElse": "L"
                                },
                                "longDateFormat": {
                                  "LTS": "h:mm:ss A",
                                  "LT": "h:mm A",
                                  "L": "MM/DD/YYYY",
                                  "LL": "MMMM D, YYYY",
                                  "LLL": "MMMM D, YYYY h:mm A",
                                  "LLLL": "dddd, MMMM D, YYYY h:mm A"
                                },
                                "invalidDate": "Invalid date",
                                "dayOfMonthOrdinalParse": {},
                                "relativeTime": {
                                  "future": "in %s",
                                  "past": "%s ago",
                                  "s": "a few seconds",
                                  "ss": "%d seconds",
                                  "m": "a minute",
                                  "mm": "%d minutes",
                                  "h": "an hour",
                                  "hh": "%d hours",
                                  "d": "a day",
                                  "dd": "%d days",
                                  "M": "a month",
                                  "MM": "%d months",
                                  "y": "a year",
                                  "yy": "%d years"
                                },
                                "months": [
                                  "January",
                                  "February",
                                  "March",
                                  "April",
                                  "May",
                                  "June",
                                  "July",
                                  "August",
                                  "September",
                                  "October",
                                  "November",
                                  "December"
                                ],
                                "monthsShort": [
                                  "Jan",
                                  "Feb",
                                  "Mar",
                                  "Apr",
                                  "May",
                                  "Jun",
                                  "Jul",
                                  "Aug",
                                  "Sep",
                                  "Oct",
                                  "Nov",
                                  "Dec"
                                ],
                                "week": {
                                  "dow": 0,
                                  "doy": 6
                                },
                                "weekdays": [
                                  "Sunday",
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday"
                                ],
                                "weekdaysMin": [
                                  "Su",
                                  "Mo",
                                  "Tu",
                                  "We",
                                  "Th",
                                  "Fr",
                                  "Sa"
                                ],
                                "weekdaysShort": [
                                  "Sun",
                                  "Mon",
                                  "Tue",
                                  "Wed",
                                  "Thu",
                                  "Fri",
                                  "Sat"
                                ],
                                "meridiemParse": {},
                                "abbr": "en"
                              },
                              "_dayOfMonthOrdinalParseLenient": {}
                            }
                          },
                          "_d": "2019-06-13T15:15:12.206Z",
                          "_isValid": true,
                          "_z": null
                        }
                      },
                      "useNormalizedEsInterval": true,
                      "interval": "auto",
                      "drop_partials": false,
                      "min_doc_count": 1,
                      "extended_bounds": {}
                    }
                  },
                  "id": "col-0-2",
                  "name": "timestamp per 30 seconds"
                },
                {
                  "aggConfig": {
                    "id": "1",
                    "enabled": true,
                    "type": "count",
                    "schema": "metric",
                    "params": {}
                  },
                  "id": "col-1-1",
                  "name": "Count"
                }
              ],
              "rows": [
                {
                  "col-0-2": 1560438420000,
                  "col-1-1": 1
                },
                {
                  "col-0-2": 1560438510000,
                  "col-1-1": 1
                }
              ]
            },
            "column": 1,
            "row": 1,
            "value": 1
          },
          "parent": null,
          "series": "Count",
          "seriesId": "Count-col-1-1"
        }
      ],
      "format": {
        "id": "number"
      }
    }
  ],
  "hits": 2
}