/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../monaco';

export const ID = 'PROMQL';

const brackets = [
  { open: '[', close: ']', token: 'delimiter.square' },
  { open: '(', close: ')', token: 'delimiter.parenthesis' },
  { open: '{', close: '}', token: 'delimiter.curly' },
];

const functions = [
  'abs',
  'absent',
  'absent_over_time',
  'ceil',
  'changes',
  'clamp',
  'clamp_max',
  'clamp_min',
  'day_of_month',
  'day_of_week',
  'day_of_year',
  'days_in_month',
  'delta',
  'deriv',
  'exp',
  'floor',
  'histogram_count',
  'histogram_sum',
  'histogram_fraction',
  'histogram_quantile',
  'holt_winters',
  'hour',
  'idelta',
  'increase',
  'irate',
  'label_join',
  'label_replace',
  'ln',
  'log2',
  'log10',
  'minute',
  'month',
  'predict_linear',
  'rate',
  'resets',
  'round',
  'scalar',
  'sgn',
  'sort',
  'sort_desc',
  'sqrt',
  'time',
  'timestamp',
  'vector',
  'year',
  'avg_over_time',
  'min_over_time',
  'max_over_time',
  'sum_over_time',
  'count_over_time',
  'quantile_over_time',
  'stddev_over_time',
  'stdvar_over_time',
  'last_over_time',
  'present_over_time',
  'acos',
  'acosh',
  'asin',
  'asinh',
  'atan',
  'atanh',
  'cos',
  'cosh',
  'sin',
  'sinh',
  'tan',
  'tanh',
  'deg',
  'pi',
  'rad',

  // extras
  'offset',
  'bool',

  // modifiers
  'by',
  'without',
  'on',
  'ignoring',
  'group_left',
  'group_right',
];

const aggregations = [
  'sum',
  'min',
  'max',
  'avg',
  'group',
  'stddev',
  'stdvar',
  'count',
  'count_values',
  'bottomk',
  'topk',
  'quantile',
  'limitk',
  'limit_ratio',
];

const modifiers = ['by', 'without', 'on', 'ignoring', 'group_left', 'group_right'];

export const lexerRules = {
  defaultToken: 'invalid',
  ignoreCase: false,
  tokenPostfix: '',
  functions,
  brackets,
  aggregations,
  modifiers,
  tokenizer: {
    root: [
      [/[ \t\r\n]+/, { token: '@whitespace' }],

      [
        /[-+]?(0[xX][0-9a-fA-F]+|[nN][aA][nN]|[iI][nN][fF]|[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)(ms|[smhdwy])?/,
        'number',
      ],

      [
        /(by|without|on|ignoring|group_left|group_right)(\s*)(\()/,
        ['keyword', 'white', { token: '@rematch', next: '@modifierParens' }],
      ],

      [/(\{)([a-zA-Z_][a-zA-Z0-9_]*)/, ['delimiter.curly', { token: '@rematch', next: '@labels' }]],

      [/[=!<>]=?/, 'operator'],
      [/=~|!~/, 'operator'],
      [/[\+\-\*\/\%\^]/, 'operator'],
      [/(and|or|unless)/, 'operator'],

      [/[\{\}\[\(\)\]]/, '@brackets'],

      [/".*?"/, 'string'],
      [/'.*?'/, 'string'],
      [/`.*?`/, 'string'],

      [
        /[a-zA-Z_:][a-zA-Z0-9_:]*\b/,
        {
          cases: {
            '@functions': 'keyword',
            '@aggregations': 'keyword',
            '@default': 'identifier',
          },
        },
      ],
      [/#.*$/, 'comment'],
    ],
    labels: [
      [/[a-zA-Z_][a-zA-Z0-9_]*/, 'key'],
      [/\s*,\s*/, 'delimiter'],

      [/[=!<>]=?/, 'operator'],
      [/=~|!~/, 'operator'],

      [/".*?"/, 'string'],
      [/'.*?'/, 'string'],
      [/`.*?`/, 'string'],

      [/\}/, 'delimiter.curly', '@pop'],
    ],
    modifierParens: [
      [/\(/, 'delimiter.curly'],
      [/[a-zA-Z_][a-zA-Z0-9_]*/, 'key'],
      [/\s*,\s*/, 'delimiter'],
      [/\)/, 'delimiter.curly', '@pop'],
    ],
  },
} as monaco.languages.IMonarchLanguage;

monaco.languages.register({
  id: ID,
});
