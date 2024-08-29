/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as c3 from 'antlr4-c3';
import { ParseTree, TokenStream } from 'antlr4ng';
import {
  AutocompleteData,
  AutocompleteResultBase,
  CursorPosition,
  OpenSearchPplAutocompleteResult,
  ProcessVisitedRulesResult,
} from '../shared/types';
import { OpenSearchPPLLexer } from './.generated/OpenSearchPPLLexer';
import { OpenSearchPPLParser } from './.generated/OpenSearchPPLParser';

// These are keywords that we do not want to show in autocomplete
export function getIgnoredTokens(): number[] {
  const tokens = [OpenSearchPPLParser.SPACE, OpenSearchPPLParser.EOF];

  const firstOperatorIndex = OpenSearchPPLParser.MATCH;
  const lastOperatorIndex = OpenSearchPPLParser.ERROR_RECOGNITION;
  for (let i = firstOperatorIndex; i <= lastOperatorIndex; i++) {
    tokens.push(i);
  }

  const firstFunctionIndex = OpenSearchPPLParser.CASE;
  const lastFunctionIndex = OpenSearchPPLParser.CAST;
  const operatorsToInclude = [
    OpenSearchPPLParser.PIPE,
    OpenSearchPPLParser.EQUAL,
    OpenSearchPPLParser.COMMA,
  ];
  for (let i = firstFunctionIndex; i <= lastFunctionIndex; i++) {
    if (!operatorsToInclude.includes(i)) {
      tokens.push(i);
    }
  }

  return tokens;
}

const ignoredTokens = new Set(getIgnoredTokens());
const tokenDictionary: any = {
  SPACE: OpenSearchPPLParser.SPACE,
  FROM: OpenSearchPPLParser.FROM,
  OPENING_BRACKET: OpenSearchPPLParser.LT_PRTHS,
  CLOSING_BRACKET: OpenSearchPPLParser.RT_PRTHS,
  SEARCH: OpenSearchPPLParser.SEARCH,
  SOURCE: OpenSearchPPLParser.SOURCE,
};

const rulesToVisit = new Set([
  OpenSearchPPLParser.RULE_fieldExpression,
  OpenSearchPPLParser.RULE_statsFunctionName,
  OpenSearchPPLParser.RULE_percentileAggFunction,
  OpenSearchPPLParser.RULE_takeAggFunction,
  OpenSearchPPLParser.RULE_timestampFunctionName,
  OpenSearchPPLParser.RULE_getFormatFunction,
  OpenSearchPPLParser.RULE_tableQualifiedName,
  OpenSearchPPLParser.RULE_singleFieldRelevanceFunctionName,
  OpenSearchPPLParser.RULE_multiFieldRelevanceFunctionName,
  OpenSearchPPLParser.RULE_positionFunctionName,
  OpenSearchPPLParser.RULE_evalFunctionName,
]);

export function processVisitedRules(
  rules: c3.CandidatesCollection['rules'],
  cursorTokenIndex: number,
  tokenStream: TokenStream
): ProcessVisitedRulesResult<OpenSearchPplAutocompleteResult> {
  let suggestSourcesOrTables: OpenSearchPplAutocompleteResult['suggestSourcesOrTables'];
  let suggestAggregateFunctions = false;
  let shouldSuggestColumns = false;

  for (const [ruleId, rule] of rules) {
    switch (ruleId) {
      case OpenSearchPPLParser.RULE_statsFunctionName: {
        suggestAggregateFunctions = true;
        break;
      }
      case OpenSearchPPLParser.RULE_fieldExpression: {
        shouldSuggestColumns = true;
        break;
      }
    }
  }

  return {
    suggestSourcesOrTables,
    suggestAggregateFunctions,
    shouldSuggestColumns,
  };
}

export function getParseTree(parser: OpenSearchPPLParser, type?: 'search' | 'from'): ParseTree {
  if (!type) {
    return parser.root();
  }

  switch (type) {
    case 'from':
      return parser.fromClause();
    case 'search':
      return parser.searchCommand();
    default:
      return parser.root();
  }
}

export function enrichAutocompleteResult(
  baseResult: AutocompleteResultBase,
  rules: c3.CandidatesCollection['rules'],
  tokenStream: TokenStream,
  cursorTokenIndex: number,
  cursor: CursorPosition,
  query: string
): OpenSearchPplAutocompleteResult {
  const {
    shouldSuggestColumns,
    shouldSuggestColumnAliases,
    shouldSuggestConstraints,
    ...suggestionsFromRules
  } = processVisitedRules(rules, cursorTokenIndex, tokenStream);
  const result: OpenSearchPplAutocompleteResult = {
    ...baseResult,
    ...suggestionsFromRules,
    suggestColumns: shouldSuggestColumns ? shouldSuggestColumns : undefined,
  };
  return result;
}

export const openSearchPplAutocompleteData: AutocompleteData<
  any,
  OpenSearchPPLLexer,
  OpenSearchPPLParser
> = {
  Lexer: OpenSearchPPLLexer,
  Parser: OpenSearchPPLParser,
  tokenDictionary,
  ignoredTokens,
  rulesToVisit,
  getParseTree,
  enrichAutocompleteResult,
};
