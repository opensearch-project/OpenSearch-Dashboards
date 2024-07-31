/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  enrichAutocompleteResult,
  getParseTree,
  openSearchSqlAutocompleteData,
  processVisitedRules,
} from './opensearch_sql_autocomplete';
import { OpenSearchSQLParser } from './.generated/OpenSearchSQLParser';
import { getPreviousToken } from './table';
import { TokenStream } from 'antlr4ng';
jest.mock('./table');

describe('Token Dictionary and Ignored Tokens', () => {
  it('should correctly set the token dictionary', () => {
    expect(openSearchSqlAutocompleteData.tokenDictionary.SPACE).toBe(OpenSearchSQLParser.SPACE);
    expect(openSearchSqlAutocompleteData.tokenDictionary.SELECT).toBe(OpenSearchSQLParser.SELECT);
  });

  it('should correctly generate ignored tokens', () => {
    const ignoredTokens = new Set(openSearchSqlAutocompleteData.ignoredTokens);
    expect(ignoredTokens.has(OpenSearchSQLParser.SLASH)).toBe(true);
    expect(ignoredTokens.has(OpenSearchSQLParser.TRIM)).toBe(true);
    expect(ignoredTokens.has(OpenSearchSQLParser.EOF)).toBe(true);
  });
});

describe('processVisitedRules', () => {
  it('should set the correct suggestions based on the rules visited', () => {
    const mockRules = new Map();
    mockRules.set(OpenSearchSQLParser.RULE_tableName, {});

    const result = processVisitedRules(mockRules, 0, null);
    expect(result.suggestViewsOrTables).toBeDefined();
    expect(result.suggestAggregateFunctions).toBe(false);
  });

  it('should handle multiple rules correctly', () => {
    const mockRules = new Map();
    mockRules.set(OpenSearchSQLParser.RULE_tableName, {});
    mockRules.set(OpenSearchSQLParser.RULE_aggregateFunction, {});

    const result = processVisitedRules(mockRules, 0, null);
    expect(result.suggestViewsOrTables).toBeDefined();
    expect(result.suggestAggregateFunctions).toBe(true);
  });

  describe('processVisitedRules', () => {
    it('should suggest values for column when RULE_constant is present', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_constant, { ruleList: [] });

      const tokenStream = ({
        getText: jest.fn((start, stop) => 'column_name'),
      } as unknown) as TokenStream;

      (getPreviousToken as jest.Mock).mockReturnValue({ text: 'column_name' });

      const result = processVisitedRules(mockRules, 0, tokenStream);

      expect(result.suggestValuesForColumn).toBe('column_name');
    });
  });
});

describe('getParseTree', () => {
  it('should return the correct parse tree based on the type', () => {
    const mockParser = {
      root: jest.fn().mockReturnValue('rootTree'),
      fromClause: jest.fn().mockReturnValue('fromTree'),
      selectStatement: jest.fn().mockReturnValue('selectTree'),
    };

    expect(((mockParser as unknown) as OpenSearchSQLParser).selectStatement()).toBe('selectTree');
    expect(getParseTree((mockParser as unknown) as OpenSearchSQLParser, 'from')).toBe('fromTree');
    expect(getParseTree((mockParser as unknown) as OpenSearchSQLParser)).toBe('rootTree');
  });

  it('should return root parse tree if no type is provided', () => {
    const mockParser = {
      root: jest.fn().mockReturnValue('rootTree'),
    };

    expect(getParseTree((mockParser as unknown) as OpenSearchSQLParser)).toBe('rootTree');
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
    const query = 'SELECT * FROM table';

    const result = enrichAutocompleteResult(
      baseResult,
      rules,
      tokenStream,
      cursorTokenIndex,
      cursor,
      query
    );

    expect(result.suggestTemplates).toBeDefined();
    expect(result.suggestColumns).toBeUndefined();
  });

  it('should handle suggestions for columns and templates', () => {
    const baseResult = { errors: [], suggestKeywords: [] };
    const rules = new Map();
    const tokenStream = {
      getText: jest.fn().mockReturnValue('column_name'),
    };
    const cursorTokenIndex = 0;
    const cursor = { line: 1, column: 1 };
    const query = 'SELECT column_name FROM table';

    const result = enrichAutocompleteResult(
      baseResult,
      rules,
      tokenStream,
      cursorTokenIndex,
      cursor,
      query
    );

    expect(result.suggestColumns).toBeUndefined();
    expect(result.suggestTemplates).toBeDefined();
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
      tokenStream,
      cursorTokenIndex,
      cursor,
      query
    );

    expect(result).toMatchObject(baseResult);
  });
});
