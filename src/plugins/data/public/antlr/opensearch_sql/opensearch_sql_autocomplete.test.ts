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
import { TokenStream } from 'antlr4ng';
import { ColumnValuePredicate } from '../shared/types';
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
  // createTokenStream takes a list of 'tokens' defined only by its type or an actual object to be returned as the Token
  const createTokenStream = (list: Array<number | { type: number; text: string }>) =>
    (({
      get: jest.fn((num: number) =>
        typeof list[num] === 'number' ? { type: list[num] } : list[num]
      ),
    } as unknown) as TokenStream);

  it('should set the correct suggestions based on the rules visited', () => {
    const mockRules = new Map();
    mockRules.set(OpenSearchSQLParser.RULE_tableName, {});
    const tokenStream = createTokenStream([1]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.suggestViewsOrTables).toBeDefined();
    expect(result.suggestAggregateFunctions).toBe(false);
  });

  it('should handle multiple rules correctly', () => {
    const mockRules = new Map();
    mockRules.set(OpenSearchSQLParser.RULE_tableName, {});
    mockRules.set(OpenSearchSQLParser.RULE_aggregateFunction, {});
    const tokenStream = createTokenStream([1]);

    const result = processVisitedRules(mockRules, 2, tokenStream);
    expect(result.suggestViewsOrTables).toBeDefined();
    expect(result.suggestAggregateFunctions).toBe(true);
  });

  describe('Test Specific Rules', () => {
    it('RULE_columnName - should suggest values for column when rule is present', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_columnName, { ruleList: [] });
      const tokenStream = createTokenStream([1]);

      const result = processVisitedRules(mockRules, 0, tokenStream);
      expect(result.shouldSuggestColumns).toBe(true);
    });

    it('RULE_columnName - suggests column aliases', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_columnName, {
        ruleList: [
          OpenSearchSQLParser.RULE_groupByElements,
          OpenSearchSQLParser.RULE_orderByElement,
        ],
      });
      const tokenStream = createTokenStream([1]);

      const result = processVisitedRules(mockRules, 0, tokenStream);
      expect(result.shouldSuggestColumns).toBe(true);
      expect(result.shouldSuggestColumnAliases).toBe(true);
    });

    it('RULE_predicate - should suggest columns when predicate rule is present', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([1]);

      const result = processVisitedRules(mockRules, 0, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.COLUMN);
    });

    it('RULE_predicate - should suggest operators after ID', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([OpenSearchSQLParser.ID, OpenSearchSQLParser.SPACE]);

      const result = processVisitedRules(mockRules, 2, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.OPERATOR);
    });

    it('RULE_predicate - should suggest values after comparison operator EQ', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchSQLParser.ID, text: 'columnName' },
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.EQUAL_SYMBOL,
        OpenSearchSQLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 4, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.VALUE);
      expect(result.suggestValuesForColumn).toBe('columnName');
    });

    it('RULE_predicate - should suggest left parenthesis after IN operator', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        OpenSearchSQLParser.ID,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.IN,
        OpenSearchSQLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 4, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.LPAREN);
      expect(result.suggestValuesForColumn).toBeUndefined();
    });

    it('RULE_predicate - should suggest values after opening parenthesis in IN clause', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchSQLParser.ID, text: 'columnName' },
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.IN,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.LR_BRACKET,
        OpenSearchSQLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 6, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.VALUE);
      expect(result.suggestValuesForColumn).toBe('columnName');
    });

    it('RULE_predicate - should suggest comma or closing parenthesis after value in IN clause', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        OpenSearchSQLParser.ID,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.IN,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.LR_BRACKET,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.STRING_LITERAL,
        OpenSearchSQLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 8, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.END_IN_TERM);
      expect(result.suggestValuesForColumn).toBeUndefined();
    });

    it('RULE_predicate - should suggest values after comma in IN clause', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchSQLParser.ID, text: 'columnName' },
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.IN,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.LR_BRACKET,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.STRING_LITERAL,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.COMMA,
        OpenSearchSQLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 10, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.VALUE);
      expect(result.suggestValuesForColumn).toBe('columnName');
    });

    it('RULE_predicate - should handle invalid token sequence', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([OpenSearchSQLParser.EQUAL_SYMBOL]);

      const result = processVisitedRules(mockRules, 1, tokenStream);
      expect(result.suggestColumnValuePredicate).toBeUndefined();
    });

    it('RULE_predicate - should suggest value with no spaces', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        OpenSearchSQLParser.ID,
        OpenSearchSQLParser.EQUAL_SYMBOL,
      ]);

      const result = processVisitedRules(mockRules, 2, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.VALUE);
    });

    it('RULE_predicate - should suggest value with too many spaces', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.ID,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.EQUAL_SYMBOL,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 9, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.VALUE);
    });

    it('RULE_predicate - returns the columnName', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchSQLParser.ID, text: 'columnName' },
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.EQUAL_SYMBOL,
        OpenSearchSQLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 4, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.VALUE);
      expect(result.suggestValuesForColumn).toBe('columnName');
    });

    // NOTE: nested predicates don't need to be tested because nothing nested is suggested

    it('RULE_predicate - should suggest values for column with dots in the name', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchSQLParser.ID, text: 'column' },
        { type: OpenSearchSQLParser.DOT, text: '.' },
        { type: OpenSearchSQLParser.ID, text: 'name' },
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.EQUAL_SYMBOL,
        OpenSearchSQLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 6, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.VALUE);
      expect(result.suggestValuesForColumn).toBe('column.name');
    });

    it('RULE_predicate - should suggest values for column with backticks in the name', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchSQLParser.BACKTICK_QUOTE_ID, text: '`column`' },
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.EQUAL_SYMBOL,
        OpenSearchSQLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 4, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.VALUE);
      expect(result.suggestValuesForColumn).toBe('column');
    });

    it('RULE_predicate - should suggest values for column with dots and backticks in the name', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchSQLParser.BACKTICK_QUOTE_ID, text: '`column`' },
        { type: OpenSearchSQLParser.DOT, text: '.' },
        { type: OpenSearchSQLParser.ID, text: '`name`' },
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.EQUAL_SYMBOL,
        OpenSearchSQLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 6, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.VALUE);
      expect(result.suggestValuesForColumn).toBe('column.name');
    });

    it('RULE_predicate - should suggest values for backticked column with dots inside', () => {
      const mockRules = new Map();
      mockRules.set(OpenSearchSQLParser.RULE_predicate, { startTokenIndex: 0 });
      const tokenStream = createTokenStream([
        { type: OpenSearchSQLParser.BACKTICK_QUOTE_ID, text: '`column.name`' },
        OpenSearchSQLParser.SPACE,
        OpenSearchSQLParser.EQUAL_SYMBOL,
        OpenSearchSQLParser.SPACE,
      ]);

      const result = processVisitedRules(mockRules, 4, tokenStream);
      expect(result.suggestColumnValuePredicate).toBe(ColumnValuePredicate.VALUE);
      expect(result.suggestValuesForColumn).toBe('column.name');
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
    const tokenStream = (null as unknown) as TokenStream;
    const cursorTokenIndex = 0;
    const cursor = { line: 1, column: 1 };
    const query = 'SELECT * FROM table';

    const result = enrichAutocompleteResult(
      baseResult,
      rules,
      (tokenStream as unknown) as TokenStream,
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
    const tokenStream = ({
      getText: jest.fn().mockReturnValue('column_name'),
    } as unknown) as TokenStream;
    const cursorTokenIndex = 0;
    const cursor = { line: 1, column: 1 };
    const query = 'SELECT column_name FROM table';

    const result = enrichAutocompleteResult(
      baseResult,
      rules,
      (tokenStream as unknown) as TokenStream,
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
    const tokenStream = (null as unknown) as TokenStream;
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
