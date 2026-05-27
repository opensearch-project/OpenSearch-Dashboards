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

  describe('wrapWithTimeFilterCTE', () => {
    const where = "`@timestamp` >= 'X' AND `@timestamp` <= 'Y'";

    it('wraps a simple SELECT with a CTE that shadows the dataset table', () => {
      const result = SQLFilterUtils.wrapWithTimeFilterCTE('SELECT * FROM logs', 'logs', where);
      expect(result).toBe(
        "WITH `logs` AS (SELECT * FROM `logs` WHERE `@timestamp` >= 'X' AND `@timestamp` <= 'Y') SELECT * FROM logs"
      );
    });

    it('wraps a JOIN query — table-shadow CTE applies only to the dataset table', () => {
      const result = SQLFilterUtils.wrapWithTimeFilterCTE(
        'SELECT * FROM logs JOIN errors ON logs.id = errors.log_id',
        'logs',
        where
      );
      expect(result).toBe(
        "WITH `logs` AS (SELECT * FROM `logs` WHERE `@timestamp` >= 'X' AND `@timestamp` <= 'Y') SELECT * FROM logs JOIN errors ON logs.id = errors.log_id"
      );
    });

    it('wraps a UNION query without parsing it', () => {
      const result = SQLFilterUtils.wrapWithTimeFilterCTE(
        'SELECT * FROM logs UNION SELECT * FROM logs2',
        'logs',
        where
      );
      expect(result).toBe(
        "WITH `logs` AS (SELECT * FROM `logs` WHERE `@timestamp` >= 'X' AND `@timestamp` <= 'Y') SELECT * FROM logs UNION SELECT * FROM logs2"
      );
    });

    it("merges into the user's existing WITH clause", () => {
      const result = SQLFilterUtils.wrapWithTimeFilterCTE(
        'WITH foo AS (SELECT 1) SELECT * FROM foo, logs',
        'logs',
        where
      );
      expect(result).toBe(
        "WITH `logs` AS (SELECT * FROM `logs` WHERE `@timestamp` >= 'X' AND `@timestamp` <= 'Y'), foo AS (SELECT 1) SELECT * FROM foo, logs"
      );
    });

    it('returns the SQL unchanged on CTE name collision with the user', () => {
      const sql = 'WITH logs AS (SELECT 1) SELECT * FROM logs';
      const result = SQLFilterUtils.wrapWithTimeFilterCTE(sql, 'logs', where);
      expect(result).toBe(sql);
    });

    it('returns the SQL unchanged when tableName is empty', () => {
      const sql = 'SELECT * FROM logs';
      const result = SQLFilterUtils.wrapWithTimeFilterCTE(sql, '', where);
      expect(result).toBe(sql);
    });

    it('escapes regex metacharacters in the table name', () => {
      // No collision should be detected even though `.` is regex-special.
      const result = SQLFilterUtils.wrapWithTimeFilterCTE(
        'SELECT * FROM `my.index`',
        'my.index',
        where
      );
      expect(result).toBe(
        "WITH `my.index` AS (SELECT * FROM `my.index` WHERE `@timestamp` >= 'X' AND `@timestamp` <= 'Y') SELECT * FROM `my.index`"
      );
    });
  });

  describe('wrapWithFilter', () => {
    it('wraps SQL in an outer SELECT with the predicate', () => {
      const result = SQLFilterUtils.wrapWithFilter('SELECT * FROM logs', "`host` = 'a'");
      expect(result).toBe("SELECT * FROM (SELECT * FROM logs) AS _wrap WHERE `host` = 'a'");
    });
  });
});
