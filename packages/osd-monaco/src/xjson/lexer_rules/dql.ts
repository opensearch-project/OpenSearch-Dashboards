/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../monaco';

export const ID = 'kuery';

const keywords = ['AND', 'OR', 'NOT'];

const operators = [':', '>', '<', '>=', '<='];

const brackets = [
  { open: '(', close: ')', token: 'delimiter.parenthesis' },
  { open: '[', close: ']', token: 'delimiter.square' },
];

export const lexerRules = {
  defaultToken: 'invalid',
  ignoreCase: true,
  tokenPostfix: '',
  keywords,
  operators,
  brackets,
  tokenizer: {
    root: [
      [/:\s*(\S+)/g, 'type'],
      [/:/g, 'keyword.operator'],
      [/(\S+)(?=\s*:)/g, 'comment'],
    ],
  },
} as monaco.languages.IMonarchLanguage;
