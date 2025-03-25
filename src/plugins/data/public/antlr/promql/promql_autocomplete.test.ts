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
import { PromQLParser } from './.generated/PromQLParser';
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
    mockRules.set(PromQLParser.RULE_metricName, {});
    const tokenStream = createTokenStream([1]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.suggestMetrics).toBeDefined();
    expect(result.shouldSuggestLabels).toBe(false);
  });

  it('should handle multiple rules correctly', () => {
    const mockRules = new Map();
    mockRules.set(PromQLParser.RULE_labelValue, {});
    mockRules.set(PromQLParser.RULE_labelName, {});
    const tokenStream = createTokenStream([1]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.shouldSuggestLabelValues).toBeDefined();
    expect(result.shouldSuggestLabels).toBe(true);
  });

  describe.skip('Test Specific Rules', () => {
    // TODO: follow format below
    // it('RULE_columnName - should suggest values for column when rule is present', () => {
    //   const mockRules = new Map();
    //   mockRules.set(PromQLParser.RULE_columnName, { ruleList: [] });
    //   const tokenStream = createTokenStream([1]);
    //   const result = processVisitedRules(mockRules, 0, tokenStream);
    //   expect(result.shouldSuggestColumns).toBe(true);
    // });
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
