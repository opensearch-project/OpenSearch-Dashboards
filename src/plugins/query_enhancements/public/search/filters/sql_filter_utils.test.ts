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
        "SELECT * FROM test_index WHERE `field1` = 'value1' AND `existing` = 'x'"
      );
    });

    it('appends multiple filters, each as its own AND-ed predicate', () => {
      const query = 'SELECT * FROM test_index';
      const result = SQLFilterUtils.addFiltersToQuery(query, [
        createFilter('field1', 'value1'),
        createFilter('field2', 'value2'),
      ]);
      // Filters reduce left-to-right; each call inserts at the WHERE keyword,
      // so the most recently added predicate ends up first.
      expect(result).toBe(
        "SELECT * FROM test_index WHERE `field2` = 'value2' AND `field1` = 'value1'"
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

    it('falls back to appending WHERE when the SQL is unparseable', () => {
      // Not a valid SELECT — interceptor short-circuits and just appends.
      const query = 'NOT VALID SQL';
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe("NOT VALID SQL WHERE `field1` = 'value1'");
    });

    it('handles aliased table names', () => {
      const query = 'SELECT * FROM test_index t';
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe("SELECT * FROM test_index t WHERE `field1` = 'value1'");
    });
  });
});
