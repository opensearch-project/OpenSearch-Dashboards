/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchSQLParser } from './.generated/OpenSearchSQLParser';

export const SQL_SYMBOLS = {
  AGREGATE_FUNCTIONS: [
    'AVG',
    'COUNT',
    'SUM',
    'MIN',
    'MAX',
    'VAR_POP',
    'VAR_SAMP',
    'VARIANCE',
    'STD',
    'STDDEV',
    'STDDEV_POP',
    'STDDEV_SAMP',
  ],
};

export const SQL_SUGGESTION_IMPORTANCE = new Map<number, string>([
  [OpenSearchSQLParser.STAR, '1'],
  [OpenSearchSQLParser.IN, '09'],
]);
