/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchPPLParser } from './default_ppl_grammar/.generated/OpenSearchPPLParser';

export const PPL_AGGREGATE_FUNCTIONS = [
  'avg',
  'count',
  'sum',
  'min',
  'max',
  'var_samp',
  'var_pop',
  'stddev_samp',
  'stddev_pop',
];

export const PPL_SUGGESTION_IMPORTANCE = new Map<number, string>([
  [OpenSearchPPLParser.PIPE, '0'],
  [OpenSearchPPLParser.COMMA, '1'],
  [OpenSearchPPLParser.EQUAL, '1'],
  [OpenSearchPPLParser.PLUS, '2'],
  [OpenSearchPPLParser.MINUS, '2'],
  [OpenSearchPPLParser.SOURCE, '2'],
]);
