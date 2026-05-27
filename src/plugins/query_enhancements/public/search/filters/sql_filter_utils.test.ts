/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Filter } from '../../../../data/common';
import { SQLFilterUtils } from './sql_filter_utils';

const createFilter = (field: string, value: string, negate: boolean = false): Filter => ({
  meta: {
    alias: null,
    disabled: false,
    index: 'mock-index',
    negate,
    type: 'phrase',
    params: { query: value },
    key: field,
  },
  query: { match_phrase: { [field]: value } },
});

describe('SQLFilterUtils', () => {
  describe('addFiltersToQuery', () => {
    it('returns the original query when filters array is empty', () => {
      const query = 'SELECT * FROM test_index';
      expect(SQLFilterUtils.addFiltersToQuery(query, [])).toBe(query);
    });

    it('appends a WHERE clause to a query that has none', () => {
      const query = 'SELECT * FROM test_index';
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe("SELECT * FROM test_index WHERE `field1` = 'value1'");
    });

    it('combines an existing WHERE clause with the new predicate using AND', () => {
      const query = "SELECT * FROM test_index WHERE `existing` = 'x'";
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe(
        "SELECT * FROM test_index WHERE `field1` = 'value1' AND ( `existing` = 'x')"
      );
    });

    it('preserves operator precedence by wrapping an OR-predicate WHERE in parentheses', () => {
      const query = 'SELECT * FROM test_index WHERE `a` = 1 OR `b` = 2';
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe(
        "SELECT * FROM test_index WHERE `field1` = 'value1' AND ( `a` = 1 OR `b` = 2)"
      );
    });

    it('appends multiple filters, each as its own AND-ed predicate', () => {
      const query = 'SELECT * FROM test_index';
      const result = SQLFilterUtils.addFiltersToQuery(query, [
        createFilter('field1', 'value1'),
        createFilter('field2', 'value2'),
      ]);
      // Filters reduce left-to-right; each call inserts at the WHERE keyword,
      // so the most recently added predicate ends up first. The previous
      // predicate gets wrapped in parens to preserve operator precedence.
      expect(result).toBe(
        "SELECT * FROM test_index WHERE `field2` = 'value2' AND ( `field1` = 'value1')"
      );
    });

    it('renders a negated phrase filter using !=', () => {
      const query = 'SELECT * FROM test_index';
      const result = SQLFilterUtils.addFiltersToQuery(query, [
        createFilter('field1', 'value1', true),
      ]);
      expect(result).toBe("SELECT * FROM test_index WHERE `field1` != 'value1'");
    });

    it('skips filters that produce no predicate', () => {
      const query = 'SELECT * FROM test_index';
      // No `key`/field — toPredicate returns undefined.
      const filterWithoutField = ({
        meta: { disabled: false, negate: false, type: 'phrase', params: { query: 'x' } },
        query: {},
      } as unknown) as Filter;

      const result = SQLFilterUtils.addFiltersToQuery(query, [filterWithoutField]);
      expect(result).toBe(query);
    });

    it('returns the original query unchanged when the SQL is unparseable', () => {
      // Not a valid SELECT — return as-is rather than blindly appending which
      // would emit invalid SQL for shapes the grammar doesn't model (JOIN,
      // UNION, CTE, etc.).
      const query = 'NOT VALID SQL';
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe(query);
    });

    it('handles aliased table names', () => {
      const query = 'SELECT * FROM test_index t';
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe("SELECT * FROM test_index t WHERE `field1` = 'value1'");
    });

    it('injects WHERE inside a subquery when the FROM is a subquery', () => {
      // The predicate references a column that the subquery doesn't project.
      // Injecting at the inner scan level (where the column exists) is correct;
      // injecting at the outer level would fail at runtime.
      const query = 'SELECT * FROM (SELECT msg FROM test_index) AS s';
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe(
        "SELECT * FROM (SELECT msg FROM test_index WHERE `field1` = 'value1') AS s"
      );
    });

    it('injects WHERE inside the deepest subquery for nested subqueries', () => {
      const query = 'SELECT * FROM (SELECT * FROM (SELECT * FROM test_index) AS x) AS y';
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe(
        "SELECT * FROM (SELECT * FROM (SELECT * FROM test_index WHERE `field1` = 'value1') AS x) AS y"
      );
    });

    it('AND-merges with an existing WHERE inside a subquery', () => {
      const query = "SELECT * FROM (SELECT msg FROM test_index WHERE `existing` = 'x') AS s";
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe(
        "SELECT * FROM (SELECT msg FROM test_index WHERE `field1` = 'value1' AND ( `existing` = 'x')) AS s"
      );
    });

    it('still injects when the subquery aliases the filter target column', () => {
      // Even though the inner query renames `field1` → `aliased`, the predicate
      // we inject runs against the underlying scan where `field1` exists.
      const query = 'SELECT s.aliased FROM (SELECT field1 AS aliased FROM test_index) AS s';
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe(
        "SELECT s.aliased FROM (SELECT field1 AS aliased FROM test_index WHERE `field1` = 'value1') AS s"
      );
    });
  });
});
