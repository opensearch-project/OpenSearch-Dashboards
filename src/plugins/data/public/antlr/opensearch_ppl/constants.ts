/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchPPLParser } from '@osd/antlr-grammar';

export const PPL_AGGREGATE_FUNCTIONS = {
  avg: { optionalParam: false },
  count: { optionalParam: true },
  sum: { optionalParam: false },
  min: { optionalParam: false },
  max: { optionalParam: false },
  var_samp: { optionalParam: false },
  var_pop: { optionalParam: false },
  stddev_samp: { optionalParam: false },
  stddev_pop: { optionalParam: false },
};

export const PPL_SUGGESTION_IMPORTANCE = new Map<number, string>([
  [OpenSearchPPLParser.PIPE, '0'],
  [OpenSearchPPLParser.COMMA, '1'],
  [OpenSearchPPLParser.EQUAL, '1'],
  [OpenSearchPPLParser.PLUS, '2'],
  [OpenSearchPPLParser.MINUS, '2'],
  [OpenSearchPPLParser.SOURCE, '2'],
  [OpenSearchPPLParser.RT_PRTHS, '2'],
]);
