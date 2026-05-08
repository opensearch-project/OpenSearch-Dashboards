/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getQueryLabel } from '../../../../data/common';
import {
  splitMultiQueries,
  findQueryAtPosition,
  getQueryRelativePosition,
  createMultiQueryCacheKey,
  parseMultiQueryCacheKey,
  offsetToLineColumn,
} from './multi_query_utils';

describe('multi_query_utils', () => {
  describe('getQueryLabel', () => {
    it('should return A-Z for indices 0-25', () => {
      expect(getQueryLabel(0)).toBe('A');
      expect(getQueryLabel(1)).toBe('B');
      expect(getQueryLabel(25)).toBe('Z');
    });

    it('should return AA, AB, etc. for indices >= 26', () => {
      expect(getQueryLabel(26)).toBe('AA');
      expect(getQueryLabel(27)).toBe('AB');
      expect(getQueryLabel(51)).toBe('AZ');
      expect(getQueryLabel(52)).toBe('BA');
    });
  });

  describe('splitMultiQueries', () => {
    it('should return empty array for empty input', () => {
      expect(splitMultiQueries('')).toEqual([]);
      expect(splitMultiQueries('   ')).toEqual([]);
    });

    it('should return single query when no delimiter', () => {
      const result = splitMultiQueries('up{job="test"}');
      expect(result.length).toBe(1);
      expect(result[0].label).toBe('A');
      expect(result[0].query).toBe('up{job="test"}');
    });

    it('should split multiple queries by semicolon', () => {
      const result = splitMultiQueries('up; down; left');
      expect(result.length).toBe(3);
      expect(result[0].label).toBe('A');
      expect(result[0].query).toBe('up');
      expect(result[1].label).toBe('B');
      expect(result[1].query).toBe('down');
      expect(result[2].label).toBe('C');
      expect(result[2].query).toBe('left');
    });

    it('should ignore semicolons inside double-quoted strings', () => {
      const result = splitMultiQueries('metric{label=";test"}; other_metric');
      expect(result.length).toBe(2);
      expect(result[0].query).toBe('metric{label=";test"}');
      expect(result[1].query).toBe('other_metric');
    });

    it('should ignore semicolons inside single-quoted strings', () => {
      const result = splitMultiQueries("metric{label=';test'}; other_metric");
      expect(result.length).toBe(2);
      expect(result[0].query).toBe("metric{label=';test'}");
      expect(result[1].query).toBe('other_metric');
    });

    it('should ignore semicolons inside backticks', () => {
      const result = splitMultiQueries('metric{label=`;test`}; other_metric');
      expect(result.length).toBe(2);
      expect(result[0].query).toBe('metric{label=`;test`}');
      expect(result[1].query).toBe('other_metric');
    });

    it('should handle escaped quotes', () => {
      const result = splitMultiQueries('metric{label="test\\"with;quote"}; other');
      expect(result.length).toBe(2);
      expect(result[0].query).toBe('metric{label="test\\"with;quote"}');
    });

    it('should skip empty segments', () => {
      const result = splitMultiQueries('up; ; down');
      expect(result.length).toBe(2);
      expect(result[0].query).toBe('up');
      expect(result[1].query).toBe('down');
    });

    it('should handle trailing semicolon', () => {
      const result = splitMultiQueries('up; down;');
      expect(result.length).toBe(2);
    });

    it('should track line numbers correctly', () => {
      const result = splitMultiQueries('up;\ndown;\nleft');
      expect(result[0].startLine).toBe(0);
      expect(result[1].startLine).toBe(1);
      expect(result[2].startLine).toBe(2);
    });

    it('should track offsets correctly', () => {
      const query = 'up; down';
      const result = splitMultiQueries(query);
      expect(result[0].startOffset).toBe(0);
      expect(result[0].endOffset).toBe(2); // 'up'
      expect(result[1].startOffset).toBe(4);
      expect(result[1].endOffset).toBe(8); // 'down'
    });
  });

  describe('findQueryAtPosition', () => {
    it('should return undefined for empty query', () => {
      expect(findQueryAtPosition('', 0)).toBeUndefined();
    });

    it('should find query containing cursor', () => {
      const query = 'up; down; left';
      // Cursor at position 0 (in 'up')
      expect(findQueryAtPosition(query, 0)?.label).toBe('A');
      // Cursor at position 4 (in 'down')
      expect(findQueryAtPosition(query, 5)?.label).toBe('B');
      // Cursor at position 10 (in 'left')
      expect(findQueryAtPosition(query, 11)?.label).toBe('C');
    });

    it('should return last query when cursor is at end', () => {
      const query = 'up; down';
      expect(findQueryAtPosition(query, query.length)?.label).toBe('B');
    });

    it('should handle cursor exactly at query end', () => {
      const query = 'up; down';
      // Position 2 is end of 'up'
      expect(findQueryAtPosition(query, 2)?.label).toBe('A');
    });
  });

  describe('getQueryRelativePosition', () => {
    it('should return undefined for empty query', () => {
      expect(getQueryRelativePosition('', 0)).toBeUndefined();
    });

    it('should return correct relative offset', () => {
      const query = 'up; down';
      const result = getQueryRelativePosition(query, 5);
      expect(result?.query.label).toBe('B');
      expect(result?.relativeOffset).toBe(1); // 'd' is 1 char into 'down'
    });

    it('should handle cursor at start of query', () => {
      const query = 'up; down';
      const result = getQueryRelativePosition(query, 4);
      expect(result?.query.label).toBe('B');
      expect(result?.relativeOffset).toBe(0);
    });

    it('should handle typing after semicolon (new query)', () => {
      const query = 'up; d';
      const result = getQueryRelativePosition(query, 5);
      expect(result?.query.label).toBe('B');
      expect(result?.relativeOffset).toBe(1);
    });
  });

  describe('createMultiQueryCacheKey', () => {
    it('should create cache key with label and query', () => {
      expect(createMultiQueryCacheKey('A', 'up')).toBe('A:up');
      expect(createMultiQueryCacheKey('AA', 'test{foo="bar"}')).toBe('AA:test{foo="bar"}');
    });
  });

  describe('parseMultiQueryCacheKey', () => {
    it('should parse valid cache keys', () => {
      expect(parseMultiQueryCacheKey('A:up')).toEqual({ label: 'A', query: 'up' });
      expect(parseMultiQueryCacheKey('AA:test{foo="bar"}')).toEqual({
        label: 'AA',
        query: 'test{foo="bar"}',
      });
    });

    it('should return null for invalid cache keys', () => {
      expect(parseMultiQueryCacheKey('invalid')).toBeNull();
      expect(parseMultiQueryCacheKey('1:query')).toBeNull();
    });

    it('should handle colons in query string', () => {
      const result = parseMultiQueryCacheKey('A:metric:with:colons');
      expect(result?.label).toBe('A');
      expect(result?.query).toBe('metric:with:colons');
    });
  });

  describe('offsetToLineColumn', () => {
    it('should return line 1 column 1 for offset 0', () => {
      expect(offsetToLineColumn('hello', 0)).toEqual({ lineNumber: 1, column: 1 });
    });

    it('should calculate column correctly on first line', () => {
      expect(offsetToLineColumn('hello', 3)).toEqual({ lineNumber: 1, column: 4 });
    });

    it('should handle newlines', () => {
      const text = 'line1\nline2\nline3';
      expect(offsetToLineColumn(text, 6)).toEqual({ lineNumber: 2, column: 1 });
      expect(offsetToLineColumn(text, 8)).toEqual({ lineNumber: 2, column: 3 });
      expect(offsetToLineColumn(text, 12)).toEqual({ lineNumber: 3, column: 1 });
    });

    it('should clamp offset to valid range', () => {
      expect(offsetToLineColumn('hello', -1)).toEqual({ lineNumber: 1, column: 1 });
      expect(offsetToLineColumn('hello', 100)).toEqual({ lineNumber: 1, column: 6 });
    });

    it('should handle empty string', () => {
      expect(offsetToLineColumn('', 0)).toEqual({ lineNumber: 1, column: 1 });
    });
  });
});
