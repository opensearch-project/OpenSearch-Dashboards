/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchPPLParser } from '@osd/antlr-grammar';

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

export const PPL_SUGGESTION_IMPORTANCE = new Map<number, string>([
  [OpenSearchPPLParser.PIPE, '0'],
  [OpenSearchPPLParser.COMMA, '1'],
  [OpenSearchPPLParser.EQUAL, '1'],
  [OpenSearchPPLParser.PLUS, '2'],
  [OpenSearchPPLParser.MINUS, '2'],
  [OpenSearchPPLParser.AND, '2'],
  [OpenSearchPPLParser.OR, '2'],
  [OpenSearchPPLParser.SOURCE, '2'],
  [OpenSearchPPLParser.COUNT, '3'],
  [OpenSearchPPLParser.SUM, '3'],
  [OpenSearchPPLParser.AVG, '31'],
  [OpenSearchPPLParser.MIN, '31'],
  [OpenSearchPPLParser.MAX, '31'],
  [OpenSearchPPLParser.SPAN, '31'],
  [OpenSearchPPLParser.MATCH, '4'],
  [OpenSearchPPLParser.MATCH_PHRASE, '4'],
  [OpenSearchPPLParser.MATCH_BOOL_PREFIX, '4'],
  [OpenSearchPPLParser.MATCH_PHRASE_PREFIX, '4'],
]);

export const PPL_FUNCTIONAL_KEYWORDS = new Map<number, { optionalParam: boolean }>([
  [OpenSearchPPLParser.SPAN, { optionalParam: false }],
  [OpenSearchPPLParser.MATCH, { optionalParam: false }],
  [OpenSearchPPLParser.MATCH_PHRASE, { optionalParam: false }],
  [OpenSearchPPLParser.MATCH_BOOL_PREFIX, { optionalParam: false }],
  [OpenSearchPPLParser.MATCH_PHRASE_PREFIX, { optionalParam: false }],
  [OpenSearchPPLParser.ISNULL, { optionalParam: false }],
  [OpenSearchPPLParser.ISNOTNULL, { optionalParam: false }],
  [OpenSearchPPLParser.IFNULL, { optionalParam: false }],
  [OpenSearchPPLParser.IF, { optionalParam: false }],
  [OpenSearchPPLParser.CASE, { optionalParam: false }],
  [OpenSearchPPLParser.CAST, { optionalParam: false }],
]);

export const SUPPORTED_NON_LITERAL_KEYWORDS = new Map<
  number,
  { insertText: string; label: string; sortText: string }
>([[OpenSearchPPLParser.SQUOTA_STRING, { insertText: `'$1'`, label: "''", sortText: '0' }]]);
