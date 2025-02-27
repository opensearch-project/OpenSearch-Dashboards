/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParseTree, TokenStream } from 'antlr4ng';
import * as c3 from 'antlr4-c3';
import {
  AutocompleteData,
  AutocompleteResultBase,
  CursorPosition,
  ProcessVisitedRulesResult,
  TableContextSuggestion,
  PromQLAutocompleteResult,
} from '../shared/types';
import { PromQLLexer } from './.generated/PromQLLexer';
import { PromQLParser } from './.generated/PromQLParser';
import { TableQueryPosition } from './table';

const tokenDictionary: any = {};

// These are keywords that we do not want to show in autocomplete
export function getIgnoredTokens(): number[] {
  const tokens: any = [];

  return tokens;
}

const ignoredTokens = new Set(getIgnoredTokens());

const rulesToVisit = new Set([]);

export function processVisitedRules(
  rules: c3.CandidatesCollection['rules'],
  cursorTokenIndex: number,
  tokenStream: TokenStream
): ProcessVisitedRulesResult<PromQLAutocompleteResult> {
  for (const [ruleId, _] of rules) {
    switch (ruleId) {
      default:
        break;
    }
  }

  return {};
}

export function getParseTree(
  parser: PromQLParser,
  type?: TableQueryPosition['type'] | 'select'
): ParseTree {
  return parser.expression();
}

export function enrichAutocompleteResult(
  baseResult: AutocompleteResultBase,
  rules: c3.CandidatesCollection['rules'],
  tokenStream: TokenStream,
  cursorTokenIndex: number,
  cursor: CursorPosition,
  query: string
): PromQLAutocompleteResult {
  const {
    shouldSuggestColumns,
    shouldSuggestColumnAliases,
    shouldSuggestConstraints,
    ...suggestionsFromRules
  } = processVisitedRules(rules, cursorTokenIndex, tokenStream);
  // const suggestTemplates = shouldSuggestTemplates(query, cursor);
  const result: PromQLAutocompleteResult = {
    ...baseResult,
    ...suggestionsFromRules,
    suggestColumns: shouldSuggestColumns ? ({} as TableContextSuggestion) : undefined,
  };

  // TODO: include symbol table here or not at all
  // const contextSuggestionsNeeded =
  //   shouldSuggestColumns || shouldSuggestConstraints || shouldSuggestColumnAliases;
  // if (contextSuggestionsNeeded) {
  //   const visitor = new OpenSearchSqlSymbolTableVisitor();
  //   const { tableContextSuggestion, suggestColumnAliases } = getContextSuggestions(
  //     PromQLLexer,
  //     PromQLParser,
  //     visitor,
  //     tokenDictionary,
  //     getParseTree,
  //     tokenStream,
  //     cursor,
  //     query
  //   );

  //   if (shouldSuggestColumns) {
  //     result.suggestColumns = tableContextSuggestion;
  //   }

  //   if (shouldSuggestColumnAliases && suggestColumnAliases) {
  //     result.suggestColumnAliases = suggestColumnAliases;
  //   }
  // }

  return result;
}

export const openSearchPromQLAutocompleteData: AutocompleteData<
  PromQLAutocompleteResult,
  PromQLLexer,
  PromQLParser
> = {
  Lexer: PromQLLexer,
  Parser: PromQLParser,
  tokenDictionary,
  ignoredTokens,
  rulesToVisit,
  getParseTree,
  enrichAutocompleteResult,
};
