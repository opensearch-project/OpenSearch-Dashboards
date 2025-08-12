/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchPPLParser } from '@osd/antlr-grammar';
import { monaco } from '@osd/monaco';
import { SuggestionItemDetailsTags } from '../shared/constants';

export const PPL_AGGREGATE_FUNCTIONS = {
  avg: { optionalParam: false, id: OpenSearchPPLParser.AVG },
  count: { optionalParam: true, id: OpenSearchPPLParser.COUNT },
  sum: { optionalParam: false, id: OpenSearchPPLParser.SUM },
  min: { optionalParam: false, id: OpenSearchPPLParser.MIN },
  max: { optionalParam: false, id: OpenSearchPPLParser.MAX },
  var_samp: { optionalParam: false, id: OpenSearchPPLParser.VAR_SAMP },
  var_pop: { optionalParam: false, id: OpenSearchPPLParser.VAR_POP },
  stddev_samp: { optionalParam: false, id: OpenSearchPPLParser.STDDEV_SAMP },
  stddev_pop: { optionalParam: false, id: OpenSearchPPLParser.STDDEV_POP },
};

const devaluedKeywordImportance = '97';

// For PPL Based Keywords
export const PPL_SUGGESTION_IMPORTANCE = new Map<
  number,
  { importance: string; type: string; isFunction: boolean; optionalParam?: boolean }
>([
  // OPERATORS - Highest priority
  [
    OpenSearchPPLParser.PIPE,
    { importance: '0', type: SuggestionItemDetailsTags.Operator, isFunction: false },
  ],
  [
    OpenSearchPPLParser.EQUAL,
    { importance: '1', type: SuggestionItemDetailsTags.Operator, isFunction: false },
  ],
  [
    OpenSearchPPLParser.COMMA,
    {
      importance: '2',
      type: SuggestionItemDetailsTags.Operator,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.PLUS,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Operator,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.MINUS,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Operator,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.STAR,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Operator,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.DIVIDE,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Operator,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.MODULE,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Operator,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.GREATER,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Operator,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.LESS,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Operator,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.NOT_GREATER,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Operator,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.NOT_LESS,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Operator,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.NOT_EQUAL,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Operator,
      isFunction: false,
    },
  ],

  // COMMAND KEYWORDS - Very high priority
  [
    OpenSearchPPLParser.SEARCH,
    { importance: '21', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.DESCRIBE,
    { importance: '21', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.SHOW,
    { importance: '21', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.FROM,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.WHERE,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.FIELDS,
    { importance: '2', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.RENAME,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.STATS,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.DEDUP,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.SORT,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.EVAL,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.HEAD,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.TOP,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.RARE,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.PARSE,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.KMEANS,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.AD,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.ML,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.GROK,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.PATTERNS,
    { importance: '3', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],

  // COMMAND ASSIST KEYWORDS
  [
    OpenSearchPPLParser.AS,
    { importance: '4', type: SuggestionItemDetailsTags.Keyword, isFunction: false },
  ],
  [
    OpenSearchPPLParser.BY,
    { importance: '4', type: SuggestionItemDetailsTags.Keyword, isFunction: false },
  ],
  [
    OpenSearchPPLParser.SOURCE,
    { importance: '2', type: SuggestionItemDetailsTags.Command, isFunction: false },
  ],
  [
    OpenSearchPPLParser.INDEX,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Keyword,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.DESC,
    { importance: '4', type: SuggestionItemDetailsTags.Keyword, isFunction: false },
  ],
  [
    OpenSearchPPLParser.DATASOURCES,
    { importance: '4', type: SuggestionItemDetailsTags.Keyword, isFunction: false },
  ],

  // LOGICAL KEYWORDS
  [
    OpenSearchPPLParser.AND,
    { importance: '5', type: SuggestionItemDetailsTags.Operator, isFunction: false },
  ],
  [
    OpenSearchPPLParser.OR,
    { importance: '5', type: SuggestionItemDetailsTags.Operator, isFunction: false },
  ],
  [
    OpenSearchPPLParser.NOT,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Keyword,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.XOR,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Keyword,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.TRUE,
    { importance: '5', type: SuggestionItemDetailsTags.Keyword, isFunction: false },
  ],
  [
    OpenSearchPPLParser.FALSE,
    { importance: '5', type: SuggestionItemDetailsTags.Keyword, isFunction: false },
  ],
  [
    OpenSearchPPLParser.IN,
    { importance: '5', type: SuggestionItemDetailsTags.Keyword, isFunction: false },
  ],
  [
    OpenSearchPPLParser.LIKE,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Keyword,
      isFunction: false,
    },
  ],
  [
    OpenSearchPPLParser.REGEXP,
    {
      importance: devaluedKeywordImportance,
      type: SuggestionItemDetailsTags.Keyword,
      isFunction: false,
    },
  ],

  // AGGREGATION FUNCTIONS
  [
    OpenSearchPPLParser.COUNT,
    {
      importance: '6',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: true,
    },
  ],
  [
    OpenSearchPPLParser.SUM,
    {
      importance: '6',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.AVG,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.MIN,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.MAX,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.DISTINCT_COUNT,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.ESTDC,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.ESTDC_ERROR,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.MEAN,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.MEDIAN,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.MODE,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.RANGE,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.STDEV,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.STDEVP,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.SUMSQ,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.VAR_SAMP,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.VAR_POP,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.STDDEV_SAMP,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.STDDEV_POP,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.PERCENTILE,
    {
      importance: '06',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.TAKE,
    {
      importance: '06',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.FIRST,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.LAST,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.LIST,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.VALUES,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.EARLIEST,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.EARLIEST_TIME,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.LATEST,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.LATEST_TIME,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.RATE,
    {
      importance: '06',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.SPARKLINE,
    {
      importance: '61',
      type: SuggestionItemDetailsTags.AggregateFunction,
      isFunction: true,
      optionalParam: false,
    },
  ],

  // MATHEMATICAL FUNCTIONS
  [
    OpenSearchPPLParser.ABS,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CBRT,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CEIL,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CEILING,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CONV,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CRC32,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.E,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.EXP,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.FLOOR,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.LN,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.LOG,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.LOG2,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.MOD,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.PI,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.POSITION,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.POW,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.POWER,
    {
      importance: '07',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.RAND,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.ROUND,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.SIGN,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.SQRT,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.TRUNCATE,
    {
      importance: '7',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],

  // TRIGONOMETRIC FUNCTIONS
  [
    OpenSearchPPLParser.ACOS,
    {
      importance: '8',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.ASIN,
    {
      importance: '8',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.ATAN,
    {
      importance: '8',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.ATAN2,
    {
      importance: '8',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.COS,
    {
      importance: '8',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.COT,
    {
      importance: '8',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.DEGREES,
    {
      importance: '8',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.RADIANS,
    {
      importance: '8',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.SIN,
    {
      importance: '8',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.TAN,
    {
      importance: '8',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],

  // DATE AND TIME FUNCTIONS
  [
    OpenSearchPPLParser.ADDDATE,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.ADDTIME,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CURDATE,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CURRENT_DATE,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CURRENT_TIME,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CURRENT_TIMESTAMP,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CURTIME,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.DATE,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.DATEDIFF,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.DATE_ADD,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.DATE_FORMAT,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.DATE_SUB,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.DAYNAME,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.DAYOFMONTH,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.DAYOFWEEK,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.DAYOFYEAR,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.EXTRACT,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.NOW,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.TIMESTAMP,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.TIMESTAMPADD,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.TIMESTAMPDIFF,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.TIME_FORMAT,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.UNIX_TIMESTAMP,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.UTC_DATE,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.UTC_TIME,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.UTC_TIMESTAMP,
    {
      importance: '9',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],

  // TEXT FUNCTIONS
  [
    OpenSearchPPLParser.SUBSTR,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.SUBSTRING,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.LTRIM,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.RTRIM,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.TRIM,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.LOWER,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.UPPER,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CONCAT,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CONCAT_WS,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.LENGTH,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.STRCMP,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.RIGHT,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.LEFT,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.ASCII,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.LOCATE,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.REPLACE,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.REVERSE,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CAST,
    {
      importance: '91',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],

  // BOOLEAN FUNCTIONS
  [
    OpenSearchPPLParser.ISNULL,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.ISNOTNULL,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.IFNULL,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.NULLIF,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.IF,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.TYPEOF,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.CASE,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],

  // RELEVANCE FUNCTIONS
  [
    OpenSearchPPLParser.MATCH,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.MATCH_PHRASE,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.MATCH_PHRASE_PREFIX,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.MATCH_BOOL_PREFIX,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.SIMPLE_QUERY_STRING,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.MULTI_MATCH,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],
  [
    OpenSearchPPLParser.QUERY_STRING,
    {
      importance: '92',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],

  // SPAN FUNCTIONS
  [
    OpenSearchPPLParser.SPAN,
    {
      importance: '93',
      type: SuggestionItemDetailsTags.Function,
      isFunction: true,
      optionalParam: false,
    },
  ],

  // DATA TYPES
  [
    OpenSearchPPLParser.INT,
    { importance: '94', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],
  [
    OpenSearchPPLParser.INTEGER,
    { importance: '94', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],
  [
    OpenSearchPPLParser.DOUBLE,
    { importance: '94', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],
  [
    OpenSearchPPLParser.LONG,
    { importance: '94', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],
  [
    OpenSearchPPLParser.FLOAT,
    { importance: '94', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],
  [
    OpenSearchPPLParser.STRING,
    { importance: '94', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],
  [
    OpenSearchPPLParser.BOOLEAN,
    { importance: '94', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],

  // FIELD TYPES
  [
    OpenSearchPPLParser.AUTO,
    { importance: '95', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],
  [
    OpenSearchPPLParser.STR,
    { importance: '95', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],
  [
    OpenSearchPPLParser.IP,
    { importance: '95', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],
  [
    OpenSearchPPLParser.NUM,
    { importance: '95', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],

  // DATASET TYPES
  [
    OpenSearchPPLParser.DATAMODEL,
    { importance: '96', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],
  [
    OpenSearchPPLParser.LOOKUP,
    { importance: '96', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],
  [
    OpenSearchPPLParser.SAVEDSEARCH,
    { importance: '96', type: SuggestionItemDetailsTags.Type, isFunction: false },
  ],

  // ARGUMENT KEYWORDS
  [
    OpenSearchPPLParser.KEEPEMPTY,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.CONSECUTIVE,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.DEDUP_SPLITVALUES,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.PARTITIONS,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.ALLNUM,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.DELIM,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.CENTROIDS,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.ITERATIONS,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.DISTANCE_TYPE,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.NUMBER_OF_TREES,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.SHINGLE_SIZE,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.SAMPLE_SIZE,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.OUTPUT_AFTER,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.TIME_DECAY,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.ANOMALY_RATE,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.CATEGORY_FIELD,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.TIME_FIELD,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.TIME_ZONE,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.TRAINING_DATA_SIZE,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
  [
    OpenSearchPPLParser.ANOMALY_SCORE_THRESHOLD,
    { importance: '97', type: SuggestionItemDetailsTags.Arguments, isFunction: false },
  ],
]);

export const SUPPORTED_NON_LITERAL_KEYWORDS = new Map<
  number,
  { insertText: string; label: string; sortText: string }
>([[OpenSearchPPLParser.SQUOTA_STRING, { insertText: `'$1'`, label: "''", sortText: '0' }]]);

// The icons for CompletionItemKind aren't configurable
// Therefore we are mapping them into different CompletionItemKind for them to have different icons
export const KEYWORD_ITEM_KIND_MAP = new Map<string, monaco.languages.CompletionItemKind>([
  [SuggestionItemDetailsTags.Command, monaco.languages.CompletionItemKind.Function],
  [SuggestionItemDetailsTags.Operator, monaco.languages.CompletionItemKind.Operator],
  [SuggestionItemDetailsTags.Function, monaco.languages.CompletionItemKind.Module],
  [SuggestionItemDetailsTags.AggregateFunction, monaco.languages.CompletionItemKind.Module],
  [SuggestionItemDetailsTags.Keyword, monaco.languages.CompletionItemKind.Keyword],
  [SuggestionItemDetailsTags.Arguments, monaco.languages.CompletionItemKind.Variable],
  [SuggestionItemDetailsTags.Field, monaco.languages.CompletionItemKind.Field],
  [SuggestionItemDetailsTags.Table, monaco.languages.CompletionItemKind.Class],
  [SuggestionItemDetailsTags.Value, monaco.languages.CompletionItemKind.Value],
]);
