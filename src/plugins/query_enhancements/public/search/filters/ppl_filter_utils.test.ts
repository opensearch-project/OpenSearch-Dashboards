/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Filter } from '../../../../data/common';
import { PPLFilterUtils } from './ppl_filter_utils';

// Access private method for testing
const addFilterToQuery = (PPLFilterUtils as any).addFilterToQuery;

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

  describe('addFilterToQuery (private method)', () => {
    it('should return original query when predicate is undefined', () => {
      const query = 'source=test_index | fields *';
      // Create a filter that will result in undefined predicate
      const filter = {
        meta: { type: 'unknown', negate: false },
      } as Filter;

      const result = addFilterToQuery(query, filter);
      expect(result).toEqual(query);
    });

    it('should insert a filter as WHERE clause', () => {
      const query = 'source=test_index | fields *';
      const filter = createFilter('field1', 'value1');
      const result = addFilterToQuery(query, filter);
      expect(result).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });

    it('should not add duplicate filter', () => {
      const query = "source=test_index | WHERE `field1` = 'value1' | fields *";
      const filter = createFilter('field1', 'value1');
      const result = addFilterToQuery(query, filter);
      expect(result).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });

    it('should replace negated version of a filter', () => {
      const query = "source=test_index | WHERE `field1` != 'value1' | fields *";
      const filter = createFilter('field1', 'value1', false);
      const result = addFilterToQuery(query, filter);
      expect(result).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });

    it('should not duplicate a filter emitted by the builder as lowercase where', () => {
      const query = "source=test_index | where `field1` = 'value1' | fields *";
      const filter = createFilter('field1', 'value1');
      const result = addFilterToQuery(query, filter);
      expect(result).toBe("source=test_index | where `field1` = 'value1' | fields *");
    });

    it('should replace a negated lowercase where clause', () => {
      const query = "source=test_index | where `field1` != 'value1' | fields *";
      const filter = createFilter('field1', 'value1', false);
      const result = addFilterToQuery(query, filter);
      expect(result).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });
  });

  describe('addFiltersToQuery', () => {
    it('should return original query when filters array is empty', () => {
      const query = 'source=test_index | fields *';
      const result = PPLFilterUtils.addFiltersToQuery(query, []);
      expect(result).toEqual(query);
    });

    it('should insert a single filter', () => {
      const query = 'source=test_index | fields *';
      const filters = [createFilter('field1', 'value1')];
      const result = PPLFilterUtils.addFiltersToQuery(query, filters);
      expect(result).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });

    it('should insert multiple filters', () => {
      const query = 'source=test_index | fields *';
      const filters = [createFilter('field1', 'value1'), createFilter('field2', 'value2')];
      const result = PPLFilterUtils.addFiltersToQuery(query, filters);

      expect(result).toContain('source=test_index');
      expect(result).toContain("WHERE `field1` = 'value1'");
      expect(result).toContain("WHERE `field2` = 'value2'");
      expect(result).toContain('fields *');
    });

    it('should not add duplicate filters', () => {
      const query = "source=test_index | WHERE `field1` = 'value1' | fields *";
      const filters = [createFilter('field1', 'value1')];
      const result = PPLFilterUtils.addFiltersToQuery(query, filters);
      expect(result).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });

    it('should replace negated version of a filter', () => {
      const query = "source=test_index | WHERE `field1` != 'value1' | fields *";
      const filters = [createFilter('field1', 'value1', false)]; // Non-negated version
      const result = PPLFilterUtils.addFiltersToQuery(query, filters);
      expect(result).toBe("source=test_index | WHERE `field1` = 'value1' | fields *");
    });

    it('should handle empty query', () => {
      const query = '';
      const filters = [createFilter('field1', 'value1')];
      const result = PPLFilterUtils.addFiltersToQuery(query, filters);
      expect(result).toBe("| WHERE `field1` = 'value1'");
    });
  });

  describe('extractSourceIndex', () => {
    it('extracts the index from a simple source= query', () => {
      expect(PPLFilterUtils.extractSourceIndex('source=my_index | head 10')).toBe('my_index');
    });

    it('tolerates whitespace around the equals sign', () => {
      expect(PPLFilterUtils.extractSourceIndex('source = my_index')).toBe('my_index');
    });

    it('strips surrounding backticks and quotes', () => {
      expect(PPLFilterUtils.extractSourceIndex('source=`my_index`')).toBe('my_index');
      expect(PPLFilterUtils.extractSourceIndex("source='my_index'")).toBe('my_index');
      expect(PPLFilterUtils.extractSourceIndex('source="my_index"')).toBe('my_index');
    });

    it('is case-insensitive on the keyword', () => {
      expect(PPLFilterUtils.extractSourceIndex('SOURCE=my_index')).toBe('my_index');
    });

    it('returns undefined when there is no source clause', () => {
      expect(PPLFilterUtils.extractSourceIndex('search field=1')).toBeUndefined();
      expect(PPLFilterUtils.extractSourceIndex('')).toBeUndefined();
    });

    it('matches the first source= token only', () => {
      expect(PPLFilterUtils.extractSourceIndex('source=first | join source=second')).toBe('first');
    });
  });

  describe('sourceDiffersFromDataset', () => {
    it('is false when the source matches the dataset title', () => {
      expect(PPLFilterUtils.sourceDiffersFromDataset('source=request_logs', 'request_logs')).toBe(
        false
      );
    });

    it('ignores a trailing wildcard on the dataset title', () => {
      expect(PPLFilterUtils.sourceDiffersFromDataset('source=request_logs', 'request_logs*')).toBe(
        false
      );
    });

    it('compares case-insensitively', () => {
      expect(PPLFilterUtils.sourceDiffersFromDataset('source=Request_Logs', 'request_logs')).toBe(
        false
      );
    });

    it('is true when the source names a different index (the lookup case)', () => {
      expect(PPLFilterUtils.sourceDiffersFromDataset('source=endpoints', 'request_logs*')).toBe(
        true
      );
    });

    it('is false (fall back to normal behavior) when either side is missing', () => {
      expect(PPLFilterUtils.sourceDiffersFromDataset('search field=1', 'request_logs')).toBe(false);
      expect(PPLFilterUtils.sourceDiffersFromDataset('source=endpoints', undefined)).toBe(false);
    });
  });
});
