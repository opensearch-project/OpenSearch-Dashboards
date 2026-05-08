/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParseTree, TokenStream } from 'antlr4ng';
import * as c3 from 'antlr4-c3';
import { PromQLLexer, PromQLParser } from '@osd/antlr-grammar';
import {
  AutocompleteData,
  AutocompleteResultBase,
  CursorPosition,
  PromQLAutocompleteResult,
  ProcessPromQLVisitedRulesResult,
  LabelOrigin,
} from '../shared/types';
import { getNamesFromInstantSelector } from './instant_selector_visitor';
import { getMetricFromAggregation } from './aggregation_visitor';

const tokenDictionary: any = {
  SPACE: PromQLParser.WS,
};

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
  PromQLParser.RULE_aggregationOperators,
  PromQLParser.RULE_functionNames,
]);

export function processVisitedRules(
  rules: c3.CandidatesCollection['rules'],
  cursorTokenIndex: number,
  tokenStream: TokenStream
): ProcessPromQLVisitedRulesResult<PromQLAutocompleteResult> {
  let suggestMetrics = false;
  let shouldSuggestLabels;
  let shouldSuggestLabelValues = false;
  let suggestTimeRangeUnits = false;
  let suggestAggregationOperators = false;
  let suggestFunctionNames = false;

  for (const [ruleId, rule] of rules) {
    switch (ruleId) {
      case PromQLParser.RULE_aggregationOperators:
        suggestAggregationOperators = true;
      case PromQLParser.RULE_functionNames:
        suggestFunctionNames = true;
      case PromQLParser.RULE_metricName:
        suggestMetrics = true;
        break;
      case PromQLParser.RULE_labelName:
        // TODO: grammar is missing: label functions i.e. label_replace()
        if (rule.ruleList.at(-1) === PromQLParser.RULE_labelNameList) {
          if (rule.ruleList.at(-3) === PromQLParser.RULE_aggregation) {
            shouldSuggestLabels = LabelOrigin.AggregationList;
          } else if (rule.ruleList.at(-3) === PromQLParser.RULE_grouping) {
            // TODO: below query's by grouping does not take in metric name
            // topk (3, sum by (job, le)
            // (rate(prometheus_http_requests_total[5m])))
            shouldSuggestLabels = LabelOrigin.VectorMatchGrouping;
          }
        } else if (rule.ruleList.at(-1) === PromQLParser.RULE_labelMatcher) {
          shouldSuggestLabels = LabelOrigin.LabelMatcher;
        }
        break;
      case PromQLParser.RULE_labelValue:
        shouldSuggestLabelValues = true;
        break;
      case PromQLParser.RULE_duration:
        // duration units should be suggested if the last character is a decimal, if the previous
        // input is invalid it will not enter duration rule
        if (/[0-9]$/.test(tokenStream.get(cursorTokenIndex)?.text ?? ''))
          suggestTimeRangeUnits = true;
        break;
    }
  }

  return {
    suggestMetrics,
    shouldSuggestLabels,
    shouldSuggestLabelValues,
    suggestTimeRangeUnits,
    suggestAggregationOperators,
    suggestFunctionNames,
  };
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
  query: string,
  tree: ParseTree
): PromQLAutocompleteResult {
  const {
    shouldSuggestLabels,
    shouldSuggestLabelValues,
    ...suggestionsFromRules
  } = processVisitedRules(rules, cursorTokenIndex, tokenStream);
  const result: PromQLAutocompleteResult = {
    ...baseResult,
    ...suggestionsFromRules,
  };

  if (shouldSuggestLabels === LabelOrigin.LabelMatcher || shouldSuggestLabelValues) {
    // TODO: cursor.column should incorporate line num as well, it needs to be perfectly matched with parser
    const { metricName: metric, labelName: label } = getNamesFromInstantSelector(
      cursor.column - 1,
      tree
    );

    if (shouldSuggestLabels !== undefined) {
      result.suggestLabels = metric ?? ''; // explicitly set to empty string since labels can be suggested without a metric
    }
    if (shouldSuggestLabelValues) {
      result.suggestLabelValues = { metric, label };
    }
  }

  if (shouldSuggestLabels === LabelOrigin.AggregationList) {
    // find the associated metric name, if it exists, and trigger yes for suggestions
    result.suggestLabels = getMetricFromAggregation(cursor.column - 1, tree) ?? '';
  }

  if (shouldSuggestLabels === LabelOrigin.VectorMatchGrouping) {
    // get all labels
    result.suggestLabels = '';
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
