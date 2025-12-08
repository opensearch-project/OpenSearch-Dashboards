/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  enrichAutocompleteResult,
  getParseTree,
  openSearchPromQLAutocompleteData,
  processVisitedRules,
} from './promql_autocomplete';
import * as c3 from 'antlr4-c3';
import { PromQLParser } from '@osd/antlr-grammar';
import { ParseTree, TokenStream } from 'antlr4ng';
import { InstantSelectorResult } from './instant_selector_visitor';
import * as instantSelectorVisitor from './instant_selector_visitor';

describe('Token Dictionary and Ignored Tokens', () => {
  it('should correctly set the token dictionary', () => {
    expect(openSearchPromQLAutocompleteData.tokenDictionary.SPACE).toBe(PromQLParser.WS);
  });

  it('should correctly generate ignored tokens', () => {
    const ignoredTokens = new Set(openSearchPromQLAutocompleteData.ignoredTokens);
    expect(ignoredTokens.has(PromQLParser.ADD)).toBe(true);
    expect(ignoredTokens.has(PromQLParser.POW)).toBe(true);
  });
});

describe('processVisitedRules', () => {
  // createTokenStream takes a list of 'tokens' defined only by its type or an actual object to be returned as the Token
  const createTokenStream = (list: Array<number | { type: number; text: string }>) =>
    (({
      get: jest.fn((num: number) =>
        typeof list[num] === 'number' ? { type: list[num] } : list[num]
      ),
    } as unknown) as TokenStream);

  it('should set the correct suggestions based on the rules visited', () => {
    const mockRules = new Map();
    mockRules.set(PromQLParser.RULE_metricName, { ruleList: [] });
    const tokenStream = createTokenStream([1]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.suggestMetrics).toBe(true);
    expect(result.shouldSuggestLabels).toBeUndefined();
  });

  it('should handle multiple rules correctly', () => {
    const mockRules = new Map();
    mockRules.set(PromQLParser.RULE_labelValue, { ruleList: [] });
    mockRules.set(PromQLParser.RULE_labelName, { ruleList: [PromQLParser.RULE_labelMatcher] });
    const tokenStream = createTokenStream([1]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.shouldSuggestLabelValues).toBe(true);
    expect(result.shouldSuggestLabels).toBe(0); // LabelOrigin.LabelMatcher = 0
  });

  it('should suggest aggregation operators and functions when RULE_aggregationOperators is present', () => {
    const mockRules = new Map();
    mockRules.set(PromQLParser.RULE_aggregationOperators, { ruleList: [] });
    const tokenStream = createTokenStream([1]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.suggestAggregationOperators).toBe(true);
    expect(result.suggestFunctionNames).toBe(true);
    expect(result.suggestMetrics).toBe(true);
  });

  it('should suggest functions when RULE_functionNames is present', () => {
    const mockRules = new Map();
    mockRules.set(PromQLParser.RULE_functionNames, { ruleList: [] });
    const tokenStream = createTokenStream([1]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.suggestFunctionNames).toBe(true);
    expect(result.suggestMetrics).toBe(true);
  });

  it('should suggest time range units when RULE_duration is present and last char is decimal', () => {
    const mockRules = new Map();
    mockRules.set(PromQLParser.RULE_duration, { ruleList: [] });
    const tokenStream = createTokenStream([{ type: 1, text: '5' }]);

    const result = processVisitedRules(mockRules, 0, tokenStream);
    expect(result.suggestTimeRangeUnits).toBe(true);
  });

  it('should not suggest time range units when RULE_duration is present but last char is not decimal', () => {
    const mockRules = new Map();
    mockRules.set(PromQLParser.RULE_duration, { ruleList: [] });
    const tokenStream = createTokenStream([{ type: 1, text: 'm' }]);

    const result = processVisitedRules(mockRules, 0, tokenStream);
    expect(result.suggestTimeRangeUnits).toBe(false);
  });

  it('should suggest labels for aggregation list when RULE_labelName with RULE_aggregation context', () => {
    const mockRules = new Map();
    mockRules.set(PromQLParser.RULE_labelName, {
      ruleList: [PromQLParser.RULE_aggregation, 0, PromQLParser.RULE_labelNameList],
    });
    const tokenStream = createTokenStream([1]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.shouldSuggestLabels).toBe(1); // LabelOrigin.AggregationList = 1
  });

  it('should suggest labels for vector match grouping when RULE_labelName with RULE_grouping context', () => {
    const mockRules = new Map();
    mockRules.set(PromQLParser.RULE_labelName, {
      ruleList: [PromQLParser.RULE_grouping, 0, PromQLParser.RULE_labelNameList],
    });
    const tokenStream = createTokenStream([1]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.shouldSuggestLabels).toBe(2); // LabelOrigin.VectorMatchGrouping = 2
  });

  it('should return empty/false suggestions when no rules are provided', () => {
    const mockRules = new Map();
    const tokenStream = createTokenStream([1]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.suggestMetrics).toBe(false);
    expect(result.suggestAggregationOperators).toBe(false);
    expect(result.suggestFunctionNames).toBe(false);
    expect(result.suggestTimeRangeUnits).toBe(false);
    expect(result.shouldSuggestLabels).toBeUndefined();
    expect(result.shouldSuggestLabelValues).toBe(false);
  });
});

describe('getParseTree', () => {
  it('should return root parse tree if no type is provided', () => {
    const mockParser = {
      expression: jest.fn().mockReturnValue('expressionTree'),
    };

    expect(getParseTree((mockParser as unknown) as PromQLParser)).toBe('expressionTree');
    expect(mockParser.expression).toHaveBeenCalled();
  });
});

describe('enrichAutocompleteResult', () => {
  it('should correctly enrich the autocomplete result with additional suggestions', () => {
    const baseResult = { errors: [], suggestKeywords: [] };
    const rules: c3.CandidatesCollection['rules'] = new Map([
      [17, { startTokenIndex: 0, ruleList: [] }],
    ]);
    const tokenStream = (null as unknown) as TokenStream;
    const cursorTokenIndex = 0;
    const cursor = { line: 1, column: 1 };

    const mockedInstantSelectorVisitorRes: InstantSelectorResult = {
      metricName: 'metric',
      labelName: 'label',
    };
    jest
      .spyOn(instantSelectorVisitor, 'getNamesFromInstantSelector')
      .mockReturnValue(mockedInstantSelectorVisitorRes);

    const result = enrichAutocompleteResult(
      baseResult,
      rules,
      (tokenStream as unknown) as TokenStream,
      cursorTokenIndex,
      cursor,
      (undefined as unknown) as string,
      (undefined as unknown) as ParseTree
    );

    expect(result.suggestLabelValues).toEqual({
      metric: 'metric',
      label: 'label',
    });
    expect(result.suggestTimeRangeUnits).toBeFalsy();
  });

  it('should handle errors gracefully and return base result', () => {
    const baseResult = { errors: [], suggestKeywords: [] };
    const rules = new Map();
    const tokenStream = (null as unknown) as TokenStream;
    const cursorTokenIndex = 0;
    const cursor = { line: 1, column: 1 };

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = enrichAutocompleteResult(
      baseResult,
      rules,
      (tokenStream as unknown) as TokenStream,
      cursorTokenIndex,
      cursor,
      (undefined as unknown) as string,
      (undefined as unknown) as ParseTree
    );

    expect(result).toMatchObject(baseResult);
  });
});
