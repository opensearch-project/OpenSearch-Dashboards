/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Filter, Query } from '../../../../data/common';
import { PPLFilterUtils } from './ppl_filter_utils';

// Access private method for testing
const insertFilterToQuery = (PPLFilterUtils as any).insertFilterToQuery;

const createQuery = (queryString: string): Query => ({
  language: 'PPL',
  query: queryString,
});

const createFilter = (field: string, value: string, negate: boolean = false): Filter => ({
  meta: {
    alias: null,
    disabled: false,
    index: 'mock-index',
    negate,
  },
  query: { match_phrase: { [field]: value } },
});

describe('PPLFilterUtils', () => {
  describe('insertWhereCommand', () => {
    it('should return original query when whereCommand is empty', () => {
      const query = 'source=test_index | fields *';
      expect(PPLFilterUtils.insertWhereCommand(query, '')).toBe(query);
    });

    it('should insert where command after first command', () => {
      const query = 'source=test_index | fields *';
      const whereCommand = 'WHERE field = "test"';
      expect(PPLFilterUtils.insertWhereCommand(query, whereCommand)).toBe(
        'source=test_index | WHERE field = "test" | fields *'
      );
    });

    it('should handle queries with no pipes', () => {
      const query = 'source=test_index';
      const whereCommand = 'WHERE field = "test"';
      expect(PPLFilterUtils.insertWhereCommand(query, whereCommand)).toBe(
        'source=test_index | WHERE field = "test"'
      );
    });

    it('should properly trim and format commands', () => {
      const query = 'source=test_index  |  fields  *  ';
      const whereCommand = '  WHERE field = "test"  ';
      // The implementation keeps spaces within the command parts
      expect(PPLFilterUtils.insertWhereCommand(query, whereCommand)).toBe(
        'source=test_index | WHERE field = "test" | fields  *'
      );
    });
  });

  describe('insertFilterToQuery (private method)', () => {
    it('should return original query when query is not a string', () => {
      const query = ({ language: 'PPL', query: { something: 'other' } } as unknown) as Query;
      const filter = createFilter('field1', 'value1');
      const result = insertFilterToQuery(query, filter);
      expect(result).toEqual(query);
    });

    it('should return original query when predicate is undefined', () => {
      const query = createQuery('source=test_index | fields *');
      // Create a filter that will result in undefined predicate
      const filter = {
        meta: { type: 'unknown', negate: false },
      } as Filter;

      const result = insertFilterToQuery(query, filter);
      expect(result).toEqual(query);
    });

    it('should insert a filter as WHERE clause', () => {
      const query = createQuery('source=test_index | fields *');
      const filter = createFilter('field1', 'value1');
      const result = insertFilterToQuery(query, filter);
      expect(result.query).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });

    it('should not add duplicate filter', () => {
      const query = createQuery("source=test_index | WHERE `field1` = 'value1' | fields *");
      const filter = createFilter('field1', 'value1');
      const result = insertFilterToQuery(query, filter);
      expect(result.query).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });

    it('should replace negated version of a filter', () => {
      const query = createQuery("source=test_index | WHERE `field1` != 'value1' | fields *");
      const filter = createFilter('field1', 'value1', false);
      const result = insertFilterToQuery(query, filter);
      expect(result.query).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });
  });

  describe('insertFiltersToQuery', () => {
    it('should return original query when filters array is empty', () => {
      const query = createQuery('source=test_index | fields *');
      const result = PPLFilterUtils.addFiltersToQuery(query, []);
      expect(result).toEqual(query);
    });

    it('should return original query when query is not a string', () => {
      const query = ({ language: 'PPL', query: { something: 'other' } } as unknown) as Query;
      const filters = [createFilter('field1', 'value1')];
      const result = PPLFilterUtils.addFiltersToQuery(query, filters);
      expect(result).toEqual(query);
    });

    it('should insert a single filter', () => {
      const query = createQuery('source=test_index | fields *');
      const filters = [createFilter('field1', 'value1')];
      const result = PPLFilterUtils.addFiltersToQuery(query, filters);
      expect(result.query).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });

    it('should insert multiple filters', () => {
      const query = createQuery('source=test_index | fields *');
      const filters = [createFilter('field1', 'value1'), createFilter('field2', 'value2')];
      const result = PPLFilterUtils.addFiltersToQuery(query, filters);

      expect(result.query).toContain('source=test_index');
      expect(result.query).toContain("WHERE `field1` = 'value1'");
      expect(result.query).toContain("WHERE `field2` = 'value2'");
      expect(result.query).toContain('fields *');
    });

    it('should not add duplicate filters', () => {
      const query = createQuery("source=test_index | WHERE `field1` = 'value1' | fields *");
      const filters = [createFilter('field1', 'value1')];
      const result = PPLFilterUtils.addFiltersToQuery(query, filters);
      expect(result.query).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });

    it('should replace negated version of a filter', () => {
      const query = createQuery("source=test_index | WHERE `field1` != 'value1' | fields *");
      const filters = [createFilter('field1', 'value1', false)]; // Non-negated version
      const result = PPLFilterUtils.addFiltersToQuery(query, filters);
      expect(result.query).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });
  });
});
