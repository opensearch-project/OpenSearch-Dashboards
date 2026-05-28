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

    it('wraps the query with a single filter predicate', () => {
      const query = 'SELECT * FROM test_index';
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe(
        "SELECT * FROM (SELECT * FROM test_index) AS _wrap WHERE `field1` = 'value1'"
      );
    });

    it('AND-merges multiple predicates inside a single wrap', () => {
      const query = 'SELECT * FROM test_index';
      const result = SQLFilterUtils.addFiltersToQuery(query, [
        createFilter('field1', 'value1'),
        createFilter('field2', 'value2'),
      ]);
      expect(result).toBe(
        "SELECT * FROM (SELECT * FROM test_index) AS _wrap WHERE (`field1` = 'value1') AND (`field2` = 'value2')"
      );
    });

    it('renders a negated phrase filter using !=', () => {
      const query = 'SELECT * FROM test_index';
      const result = SQLFilterUtils.addFiltersToQuery(query, [
        createFilter('field1', 'value1', true),
      ]);
      expect(result).toBe(
        "SELECT * FROM (SELECT * FROM test_index) AS _wrap WHERE `field1` != 'value1'"
      );
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

    it('wraps queries with arbitrary SQL shapes (JOIN) without parsing them', () => {
      const query = 'SELECT host FROM logs JOIN errors ON logs.id = errors.log_id';
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('host', 'a')]);
      expect(result).toBe(
        "SELECT * FROM (SELECT host FROM logs JOIN errors ON logs.id = errors.log_id) AS _wrap WHERE `host` = 'a'"
      );
    });

    it('preserves operator precedence in the user query — wrap evaluates inner WHERE first', () => {
      const query = 'SELECT * FROM test_index WHERE `a` = 1 OR `b` = 2';
      const result = SQLFilterUtils.addFiltersToQuery(query, [createFilter('field1', 'value1')]);
      expect(result).toBe(
        "SELECT * FROM (SELECT * FROM test_index WHERE `a` = 1 OR `b` = 2) AS _wrap WHERE `field1` = 'value1'"
      );
    });
  });

  describe('insertWhereClause', () => {
    const where = "`@timestamp` >= 'X' AND `@timestamp` <= 'Y'";

    it('inserts WHERE clause into simple SELECT', () => {
      const result = SQLFilterUtils.insertWhereClause('SELECT * FROM logs', 'logs', where);
      expect(result).toBe("SELECT * FROM logs WHERE `@timestamp` >= 'X' AND `@timestamp` <= 'Y'");
    });

    it('adds to existing WHERE clause with proper OR precedence', () => {
      const result = SQLFilterUtils.insertWhereClause(
        "SELECT * FROM logs WHERE status = 500 OR method = 'GET'",
        'logs',
        where
      );
      expect(result).toBe(
        "SELECT * FROM logs WHERE (`@timestamp` >= 'X' AND `@timestamp` <= 'Y') AND (status = 500 OR method = 'GET')"
      );
    });

    it('handles GROUP BY queries correctly', () => {
      const result = SQLFilterUtils.insertWhereClause(
        'SELECT method, COUNT(*) FROM logs GROUP BY method',
        'logs',
        where
      );
      expect(result).toBe(
        "SELECT method, COUNT(*) FROM logs WHERE `@timestamp` >= 'X' AND `@timestamp` <= 'Y' GROUP BY method"
      );
    });

    it('returns original SQL when parsing fails', () => {
      const sql = 'INVALID SQL QUERY';
      const result = SQLFilterUtils.insertWhereClause(sql, 'logs', where);
      expect(result).toBe(sql);
    });

    it('returns original SQL when not a SELECT statement', () => {
      const sql = 'SHOW TABLES';
      const result = SQLFilterUtils.insertWhereClause(sql, 'logs', where);
      expect(result).toBe(sql);
    });

    it('returns the SQL unchanged when tableName is empty', () => {
      const sql = 'SELECT * FROM logs';
      const result = SQLFilterUtils.insertWhereClause(sql, '', where);
      expect(result).toBe(sql);
    });

    it('handles complex queries gracefully by returning unchanged on parse failure', () => {
      // Complex query that might not parse with legacy ANTLR
      const sql = 'WITH RECURSIVE cte AS (...) SELECT * FROM cte';
      const result = SQLFilterUtils.insertWhereClause(sql, 'logs', where);
      expect(result).toBe(sql); // Should return unchanged rather than break
    });
  });

  describe('wrapWithFilter', () => {
    it('wraps SQL in an outer SELECT with the predicate', () => {
      const result = SQLFilterUtils.wrapWithFilter('SELECT * FROM logs', "`host` = 'a'");
      expect(result).toBe("SELECT * FROM (SELECT * FROM logs) AS _wrap WHERE `host` = 'a'");
    });
  });
});
