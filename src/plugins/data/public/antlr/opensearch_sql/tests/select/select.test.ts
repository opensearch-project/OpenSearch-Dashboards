/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseMySqlQueryWithCursor } from '../../../../shared/parse-query-with-cursor';
import {
  ColumnSuggestion,
  KeywordSuggestion,
  TableOrViewSuggestion,
} from '../../../../autocomplete-types';
import { parseMySqlQueryWithoutCursor } from '../../../../autocomplete';

test('should suggest properly after SELECT', () => {
  const autocompleteResult = parseMySqlQueryWithCursor('SELECT');

  const keywordsSuggestion: KeywordSuggestion[] = [
    { value: '*' },
    { value: 'NOT' },
    { value: 'FALSE' },
    { value: 'TRUE' },
    { value: 'NULL' },
    { value: 'BINARY' },
    { value: 'ROW' },
    { value: 'EXISTS' },
    { value: 'INTERVAL' },
    { value: 'ALL' },
    { value: 'DISTINCT' },
    { value: 'DISTINCTROW' },
    { value: 'HIGH_PRIORITY' },
    { value: 'STRAIGHT_JOIN' },
    { value: 'SQL_SMALL_RESULT' },
    { value: 'SQL_BIG_RESULT' },
    { value: 'SQL_BUFFER_RESULT' },
    { value: 'SQL_CACHE' },
    { value: 'SQL_NO_CACHE' },
    { value: 'SQL_CALC_FOUND_ROWS' },
  ];
  expect(autocompleteResult.suggestKeywords).toEqual(keywordsSuggestion);
  expect(autocompleteResult.suggestFunctions).toEqual(true);
  expect(autocompleteResult.suggestAggregateFunctions).toEqual(true);
  expect(autocompleteResult.suggestTemplates).toEqual(false);
});

test('should suggest properly after *', () => {
  const autocompleteResult = parseMySqlQueryWithCursor('SELECT * |');

  const keywordsSuggestion: KeywordSuggestion[] = [
    { value: 'FROM' },
    { value: 'WHERE' },
    { value: 'UNION' },
    { value: 'LIMIT' },
    { value: 'ORDER' },
    { value: 'WINDOW' },
    { value: 'HAVING' },
    { value: 'GROUP' },
    { value: 'INTO' },
    { value: 'FOR' },
    { value: 'LOCK' },
  ];
  expect(autocompleteResult.suggestKeywords).toEqual(keywordsSuggestion);
});

test('should suggest properly after FROM', () => {
  const autocompleteResult = parseMySqlQueryWithCursor('SELECT * FROM |');

  const keywordsSuggestion: KeywordSuggestion[] = [{ value: 'JSON_TABLE' }];
  expect(autocompleteResult.suggestKeywords).toEqual(keywordsSuggestion);
  expect(autocompleteResult.suggestViewsOrTables).toEqual(TableOrViewSuggestion.ALL);
});

test('should suggest ALL tables between statements', () => {
  const autocompleteResult = parseMySqlQueryWithCursor(
    'ALTER TABLE before_table DROP COLUMN id; SELECT * FROM | ; ALTER TABLE after_table DROP COLUMN id;'
  );

  expect(autocompleteResult.suggestViewsOrTables).toEqual(TableOrViewSuggestion.ALL);
});

test('should suggest tables with inline comment', () => {
  const autocompleteResult = parseMySqlQueryWithCursor(
    'SELECT * FROM | --SELECT * FROM test_table'
  );

  expect(autocompleteResult.suggestViewsOrTables).toEqual(TableOrViewSuggestion.ALL);
});

test('should suggest tables with multiline comment', () => {
  const autocompleteResult = parseMySqlQueryWithCursor(
    'SELECT * FROM | /*SELECT * FROM test_table*/'
  );

  expect(autocompleteResult.suggestViewsOrTables).toEqual(TableOrViewSuggestion.ALL);
});

test('should suggest properly after table name', () => {
  const autocompleteResult = parseMySqlQueryWithCursor('SELECT * FROM test_table |');

  const keywordsSuggestion: KeywordSuggestion[] = [
    { value: 'FORCE' },
    { value: 'IGNORE' },
    { value: 'USE' },
    { value: 'AS' },
    { value: 'PARTITION' },
    { value: 'CROSS' },
    { value: 'INNER' },
    { value: 'JOIN' },
    { value: 'STRAIGHT_JOIN' },
    { value: 'LEFT' },
    { value: 'RIGHT' },
    { value: 'NATURAL' },
    { value: 'WHERE' },
    { value: 'UNION' },
    { value: 'LIMIT' },
    { value: 'ORDER' },
    { value: 'WINDOW' },
    { value: 'HAVING' },
    { value: 'GROUP' },
    { value: 'INTO' },
    { value: 'FOR' },
    { value: 'LOCK' },
  ];
  expect(autocompleteResult.suggestKeywords).toEqual(keywordsSuggestion);
  expect(autocompleteResult.suggestViewsOrTables).toEqual(undefined);
});

test('should suggest table name for column', () => {
  const autocompleteResult = parseMySqlQueryWithCursor('SELECT | FROM test_table');
  const columnSuggestions: ColumnSuggestion = { tables: [{ name: 'test_table' }] };

  expect(autocompleteResult.suggestColumns).toEqual(columnSuggestions);
});

test('should suggest table name for column between statements', () => {
  const autocompleteResult = parseMySqlQueryWithCursor(
    'ALTER TABLE before_table DROP COLUMN id; SELECT | FROM test_table ; ALTER TABLE after_table DROP COLUMN id;'
  );
  const columnSuggestions: ColumnSuggestion = { tables: [{ name: 'test_table' }] };

  expect(autocompleteResult.suggestColumns).toEqual(columnSuggestions);
});

test('should suggest table name and alias for column', () => {
  const autocompleteResult = parseMySqlQueryWithCursor('SELECT | FROM test_table t');
  const columnSuggestions: ColumnSuggestion = { tables: [{ name: 'test_table', alias: 't' }] };

  expect(autocompleteResult.suggestColumns).toEqual(columnSuggestions);
});

test('should suggest table name and alias (with AS) for column', () => {
  const autocompleteResult = parseMySqlQueryWithCursor('SELECT | FROM test_table AS t');
  const columnSuggestions: ColumnSuggestion = { tables: [{ name: 'test_table', alias: 't' }] };

  expect(autocompleteResult.suggestColumns).toEqual(columnSuggestions);
});

test('should suggest table name and alias for second column', () => {
  const autocompleteResult = parseMySqlQueryWithCursor('SELECT id, | FROM test_table AS t');
  const columnSuggestions: ColumnSuggestion = { tables: [{ name: 'test_table', alias: 't' }] };

  expect(autocompleteResult.suggestColumns).toEqual(columnSuggestions);
});

test('should suggest multiple table names for column', () => {
  const autocompleteResult = parseMySqlQueryWithCursor('SELECT | FROM test_table_1, test_table_2');
  const columnSuggestions: ColumnSuggestion = {
    tables: [{ name: 'test_table_1' }, { name: 'test_table_2' }],
  };

  expect(autocompleteResult.suggestColumns).toEqual(columnSuggestions);
});

test('should suggest multiple table names for column between statements', () => {
  const autocompleteResult = parseMySqlQueryWithCursor(
    'ALTER TABLE before_table DROP COLUMN id; SELECT | FROM test_table_1, test_table_2 ; ALTER TABLE after_table DROP COLUMN id;'
  );
  const columnSuggestions: ColumnSuggestion = {
    tables: [{ name: 'test_table_1' }, { name: 'test_table_2' }],
  };

  expect(autocompleteResult.suggestColumns).toEqual(columnSuggestions);
});

test('should suggest multiple table names and aliases for column', () => {
  const autocompleteResult = parseMySqlQueryWithCursor(
    'SELECT | FROM test_table_1 t1, test_table_2 t2'
  );
  const columnSuggestions: ColumnSuggestion = {
    tables: [
      { name: 'test_table_1', alias: 't1' },
      { name: 'test_table_2', alias: 't2' },
    ],
  };

  expect(autocompleteResult.suggestColumns).toEqual(columnSuggestions);
});

test('should suggest multiple table names and aliases (with AS) for column', () => {
  const autocompleteResult = parseMySqlQueryWithCursor(
    'SELECT | FROM test_table_1 AS t1, test_table_2 AS t2'
  );
  const columnSuggestions: ColumnSuggestion = {
    tables: [
      { name: 'test_table_1', alias: 't1' },
      { name: 'test_table_2', alias: 't2' },
    ],
  };

  expect(autocompleteResult.suggestColumns).toEqual(columnSuggestions);
});

test('should suggest properly after HAVING', () => {
  const autocompleteResult = parseMySqlQueryWithCursor('SELECT * FROM test_table as t HAVING |');

  const keywordsSuggestion: KeywordSuggestion[] = [
    { value: 'NOT' },
    { value: 'FALSE' },
    { value: 'TRUE' },
    { value: 'NULL' },
    { value: 'BINARY' },
    { value: 'ROW' },
    { value: 'EXISTS' },
    { value: 'INTERVAL' },
  ];
  expect(autocompleteResult.suggestKeywords).toEqual(keywordsSuggestion);
});

test('should suggest properly after LIMIT', () => {
  const autocompleteResult = parseMySqlQueryWithCursor('SELECT * FROM test_table as t LIMIT |');

  const keywordsSuggestion: KeywordSuggestion[] = [];
  expect(autocompleteResult.suggestKeywords).toEqual(keywordsSuggestion);
});

test('should not report errors', () => {
  const autocompleteResult = parseMySqlQueryWithoutCursor('SELECT c1, c2 FROM test_table;');

  expect(autocompleteResult.errors).toHaveLength(0);
});
