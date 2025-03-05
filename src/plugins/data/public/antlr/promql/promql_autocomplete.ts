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
  PromQLAutocompleteResult,
  ProcessPromQLVisitedRulesResult,
} from '../shared/types';
import { PromQLLexer } from './.generated/PromQLLexer';
import { PromQLParser } from './.generated/PromQLParser';

const tokenDictionary: any = {};

// These are keywords that we do not want to show in autocomplete
export function getIgnoredTokens(): number[] {
  const tokens: any = [];

  for (let token = PromQLParser.ADD; token <= PromQLParser.POW; token++) {
    tokens.push(token);
  }
  for (let token = PromQLParser.LEFT_BRACE; token <= PromQLParser.RIGHT_BRACKET; token++) {
    tokens.push(token);
  }

  return tokens;
}

const ignoredTokens = new Set(getIgnoredTokens());

const rulesToVisit = new Set([
  PromQLParser.RULE_metricName,
  PromQLParser.RULE_labelName,
  PromQLParser.RULE_labelValue,
  PromQLParser.RULE_duration,
]);

export function processVisitedRules(
  rules: c3.CandidatesCollection['rules'],
  cursorTokenIndex: number,
  tokenStream: TokenStream
): ProcessPromQLVisitedRulesResult<PromQLAutocompleteResult> {
  let suggestMetrics = false;
  let shouldSuggestLabels = false;
  let shouldSuggestLabelValues = false;
  let suggestTimeRangeUnits = false;

  for (const [ruleId, _] of rules) {
    switch (ruleId) {
      case PromQLParser.RULE_metricName:
        suggestMetrics = true;
        break;
      case PromQLParser.RULE_labelName:
        shouldSuggestLabels = true;
        break;
      case PromQLParser.RULE_labelValue:
        shouldSuggestLabelValues = true;
        break;
      case PromQLParser.RULE_duration:
        suggestTimeRangeUnits = true;
        break;
    }
  }

  return { suggestMetrics, shouldSuggestLabels, shouldSuggestLabelValues, suggestTimeRangeUnits };
}

export function getParseTree(parser: PromQLParser): ParseTree {
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
    shouldSuggestLabels,
    shouldSuggestLabelValues,
    ...suggestionsFromRules
  } = processVisitedRules(rules, cursorTokenIndex, tokenStream);
  // const suggestTemplates = shouldSuggestTemplates(query, cursor);
  const result: PromQLAutocompleteResult = {
    ...baseResult,
    ...suggestionsFromRules,
  };

  if (shouldSuggestLabels || shouldSuggestLabelValues) {
    // send out visitor that gets symbol table
    // table should contain:
    // -> local metric name
    // -> local label name

    if (shouldSuggestLabels) {
      // result.suggestLabels = symbolTable.metricName
    }
    if (shouldSuggestLabelValues) {
      // result.suggestLabelValues = symbolTable.metricName, symbolTable.labelName
    }
  }

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
