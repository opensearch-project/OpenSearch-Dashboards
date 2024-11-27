/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../monaco';

export const ID = 'SQL';

const keywords = [
  'ALL',
  'AND',
  'AS',
  'ASC',
  'BOOLEAN',
  'BETWEEN',
  'BY',
  'CASE',
  'CAST',
  'CROSS',
  'COLUMNS',
  'DATETIME',
  'DELETE',
  'DESC',
  'DESCRIBE',
  'DISTINCT',
  'DOUBLE',
  'ELSE',
  'EXISTS',
  'FALSE',
  'FLOAT',
  'FIRST',
  'FROM',
  'GROUP',
  'HAVING',
  'IN',
  'INNER',
  'INT',
  'INTEGER',
  'IS',
  'JOIN',
  'LAST',
  'LEFT',
  'LIKE',
  'LIMIT',
  'LONG',
  'MATCH',
  'NATURAL',
  'NOT',
  'NULL',
  'NULLS',
  'ON',
  'OR',
  'ORDER',
  'OUTER',
  'OVER',
  'PARTITION',
  'REGEXP',
  'RIGHT',
  'SELECT',
  'SHOW',
  'STRING',
  'THEN',
  'TRUE',
  'UNION',
  'USING',
  'WHEN',
  'WHERE',
  'EXCEPT',
];

const functions = [
  'AVG',
  'COUNT',
  'MAX',
  'MIN',
  'SUM',
  'VAR_POP',
  'VAR_SAMP',
  'VARIANCE',
  'STD',
  'STDDEV',
  'STDDEV_POP',
  'STDDEV_SAMP',
  'SUBSTRING',
  'TRIM',
];

const operators = [
  '=',
  '>',
  '<',
  '!',
  '~',
  '\\|',
  '&',
  '\\^',
  '\\*',
  '/',
  '%',
  '\\+',
  '-',
  'DIV',
  'MOD',
];

const brackets = [
  { open: '(', close: ')', token: 'delimiter.parenthesis' },
  { open: '[', close: ']', token: 'delimiter.square' },
];

export const lexerRules = {
  defaultToken: 'invalid',
  ignoreCase: true,
  tokenPostfix: '',
  keywords,
  functions,
  operators,
  brackets,
  tokenizer: {
    root: [
      [
        /[a-zA-Z_$][a-zA-Z0-9_$]*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@functions': 'function',
            '@default': 'identifier',
          },
        },
      ],
      { include: '@whitespace' },
      [/[()]/, '@brackets'],
      [new RegExp(operators.join('|')), 'operator'],
      [/[0-9]+(\.[0-9]+)?/, 'number'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'], // non-terminated string
      [/'/, 'string', '@stringSingle'],
      [/"/, 'string', '@stringDouble'],
    ],
    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/--.*$/, 'comment'],
    ],
    stringSingle: [
      [/[^'\\]+/, 'string'],
      [/\\./, 'string.escape'],
      [/'/, 'string', '@pop'],
    ],
    stringDouble: [
      [/[^"\\]+/, 'string'],
      [/\\./, 'string.escape'],
      [/"/, 'string', '@pop'],
    ],
    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],
  },
} as monaco.languages.IMonarchLanguage;

monaco.languages.register({
  id: ID,
});
