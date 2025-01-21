/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TokenStream } from 'antlr4ng';
import { OpenSearchPPLParser } from './.generated/OpenSearchPPLParser';
import {
  enrichAutocompleteResult,
  getParseTree,
  openSearchPplAutocompleteData,
  processVisitedRules,
} from './opensearch_ppl_autocomplete';
import { SourceOrTableSuggestion } from '../shared/types';

describe('Token Dictionary and Ignored Tokens', () => {
  it('should correctly set the token dictionary', () => {
    expect(openSearchPplAutocompleteData.tokenDictionary.SPACE).toBe(OpenSearchPPLParser.SPACE);
    expect(openSearchPplAutocompleteData.tokenDictionary.ID).toBe(OpenSearchPPLParser.ID);
  });

  it('should correctly generate ignored tokens', () => {
    const ignoredTokens = new Set(openSearchPplAutocompleteData.ignoredTokens);
    expect(ignoredTokens.has(OpenSearchPPLParser.CASE)).toBe(true);
    expect(ignoredTokens.has(OpenSearchPPLParser.CAST)).toBe(true);
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
    mockRules.set(OpenSearchPPLParser.RULE_statsFunctionName, {});
    const tokenStream = createTokenStream([1]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.suggestAggregateFunctions).toBeDefined();
    expect(result.shouldSuggestColumns).toBe(false);
  });

  it('should handle multiple rules correctly', () => {
    const mockRules = new Map();
    mockRules.set(OpenSearchPPLParser.RULE_statsFunctionName, {});
    mockRules.set(OpenSearchPPLParser.RULE_fieldExpression, {});
    const tokenStream = createTokenStream([
      { type: 1, text: 'SPACE' },
      { type: 1, text: 'SPACE' },
    ]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.suggestAggregateFunctions).toBeDefined();
    expect(result.shouldSuggestColumns).toBe(true);
  });

  describe('Test Specific Rules', () => {
    it('RULE_fieldExpression - should suggest columns when rule is present', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchPPLParser.RULE_fieldExpression, {});
      const tokenStream = createTokenStream([1, 1]);

      const result = processVisitedRules(mockRules, 2, tokenStream);
      expect(result.shouldSuggestColumns).toBe(true);
    });

    it('RULE_fieldExpression - should not suggest columns when prev token is not ID', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchPPLParser.RULE_fieldExpression, {});
      const tokenStream = createTokenStream([OpenSearchPPLParser.ID, 1]);

      const result = processVisitedRules(mockRules, 2, tokenStream);
      expect(result.shouldSuggestColumns).toBe(false);
    });
    // test for not suggesting if prev token is ID

    it('RULE_tableIdent - should suggest sources or tables when rule is present', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchPPLParser.RULE_tableIdent, {});
      const tokenStream = createTokenStream([1]);

      const result = processVisitedRules(mockRules, 1, tokenStream);
      expect(result.suggestSourcesOrTables).toBe(SourceOrTableSuggestion.TABLES);
    });

    it('RULE_renameClasue - should suggest columns and "as" keyword', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchPPLParser.RULE_renameClasue, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([1, 1]);

      const result = processVisitedRules(mockRules, 0, tokenStream);
      expect(result.shouldSuggestColumns).toBe(true);
      expect(result.suggestRenameAs).toBe(false);

      const resultWithAs = processVisitedRules(mockRules, 2, tokenStream);
      expect(resultWithAs.suggestRenameAs).toBe(true);
    });

    it('RULE_literalValue - should suggest values for column when rule is present', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchPPLParser.RULE_literalValue, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchPPLParser.ID, text: 'columnName' },
        OpenSearchPPLParser.SPACE,
        OpenSearchPPLParser.EQUAL,
        OpenSearchPPLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 4, tokenStream);
      expect(result.suggestValuesForColumn).toBe('columnName');
    });

    it('RULE_literalValue - should suggest values for column with dots in the name', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchPPLParser.RULE_literalValue, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchPPLParser.ID, text: 'column' },
        { type: OpenSearchPPLParser.DOT, text: '.' },
        { type: OpenSearchPPLParser.ID, text: 'name' },
        OpenSearchPPLParser.SPACE,
        OpenSearchPPLParser.EQUAL,
        OpenSearchPPLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 6, tokenStream);
      expect(result.suggestValuesForColumn).toBe('column.name');
    });

    it('RULE_literalValue - should suggest values for column with backticks in the name', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchPPLParser.RULE_literalValue, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchPPLParser.BQUOTA_STRING, text: '`column`' },
        OpenSearchPPLParser.SPACE,
        OpenSearchPPLParser.EQUAL,
        OpenSearchPPLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 4, tokenStream);
      expect(result.suggestValuesForColumn).toBe('column');
    });

    it.skip('RULE_literalValue - should suggest values for column with dots and backticks in the name', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchPPLParser.RULE_literalValue, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchPPLParser.BQUOTA_STRING, text: '`column`' },
        { type: OpenSearchPPLParser.DOT, text: '.' },
        { type: OpenSearchPPLParser.BQUOTA_STRING, text: '`name`' },
        OpenSearchPPLParser.SPACE,
        OpenSearchPPLParser.EQUAL,
        OpenSearchPPLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 6, tokenStream);
      expect(result.suggestValuesForColumn).toBe('column.name');
    });

    it('RULE_literalValue - should suggest values for backticked column with dots inside', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchPPLParser.RULE_literalValue, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchPPLParser.BQUOTA_STRING, text: '`column.name`' },
        OpenSearchPPLParser.SPACE,
        OpenSearchPPLParser.EQUAL,
        OpenSearchPPLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 4, tokenStream);
      expect(result.suggestValuesForColumn).toBe('column.name');
    });
  });
});

describe('getParseTree', () => {
  it('should return the correct parse tree based on the type', () => {
    const mockParser = {
      fromClause: jest.fn().mockReturnValue('fromTree'),
    };

    expect(getParseTree((mockParser as unknown) as OpenSearchPPLParser, 'from')).toBe('fromTree');
  });

  it('should return root parse tree if no type is provided', () => {
    const mockParser = {
      root: jest.fn().mockReturnValue('rootTree'),
    };

    expect(getParseTree((mockParser as unknown) as OpenSearchPPLParser)).toBe('rootTree');
    expect(mockParser.root).toHaveBeenCalled();
  });
});

describe('enrichAutocompleteResult', () => {
  it('should correctly enrich the autocomplete result with additional suggestions', () => {
    const baseResult = { errors: [], suggestKeywords: [] };
    const rules = new Map();
    const tokenStream = null;
    const cursorTokenIndex = 0;
    const cursor = { line: 1, column: 1 };
    const query = 'source = sample-index | ';

    const result = enrichAutocompleteResult(
      baseResult,
      rules,
      (tokenStream as unknown) as TokenStream,
      cursorTokenIndex,
      cursor,
      query
    );

    expect(result.suggestKeywords).toBeDefined();
    expect(result.suggestColumns).toBeUndefined();
  });

  it('should handle errors gracefully and return base result', () => {
    const baseResult = { errors: [], suggestKeywords: [] };
    const rules = new Map();
    const tokenStream = null;
    const cursorTokenIndex = 0;
    const cursor = { line: 1, column: 1 };
    const query = 'SELECT * FROM table';

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = enrichAutocompleteResult(
      baseResult,
      rules,
      (tokenStream as unknown) as TokenStream,
      cursorTokenIndex,
      cursor,
      query
    );

    expect(result).toMatchObject(baseResult);
  });
});
