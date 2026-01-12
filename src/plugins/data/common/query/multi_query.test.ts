/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getQueryLabel,
  isInsideString,
  findDelimiterPositions,
  splitMultiQueries,
  supportsMultiQuery,
} from './multi_query';

describe('multi_query', () => {
  describe('supportsMultiQuery', () => {
    it('should return true for PROMQL', () => {
      expect(supportsMultiQuery('PROMQL')).toBe(true);
    });

    it('should return false for other languages', () => {
      expect(supportsMultiQuery('SQL')).toBe(false);
      expect(supportsMultiQuery('PPL')).toBe(false);
      expect(supportsMultiQuery('DQL')).toBe(false);
      expect(supportsMultiQuery('')).toBe(false);
    });
  });

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

  describe('isInsideString', () => {
    it('should return false for position outside strings', () => {
      expect(isInsideString('hello world', 5)).toBe(false);
    });

    it('should return true for position inside double quotes', () => {
      expect(isInsideString('hello "world" test', 8)).toBe(true);
    });

    it('should return true for position inside single quotes', () => {
      expect(isInsideString("hello 'world' test", 8)).toBe(true);
    });

    it('should return true for position inside backticks', () => {
      expect(isInsideString('hello `world` test', 8)).toBe(true);
    });

    it('should handle escaped quotes', () => {
      // Position after escaped quote should still be inside string
      expect(isInsideString('hello "wo\\"rld" test', 12)).toBe(true);
    });

    it('should handle nested quote types', () => {
      // Single quote inside double quotes doesn't close the string
      expect(isInsideString('hello "wo\'rld" test', 10)).toBe(true);
    });
  });

  describe('findDelimiterPositions', () => {
    it('should find semicolons outside strings', () => {
      expect(findDelimiterPositions('a; b; c')).toEqual([1, 4]);
    });

    it('should not find semicolons inside double-quoted strings', () => {
      expect(findDelimiterPositions('a ";"; b')).toEqual([5]);
    });

    it('should not find semicolons inside single-quoted strings', () => {
      expect(findDelimiterPositions("a ';'; b")).toEqual([5]);
    });

    it('should not find semicolons inside backticks', () => {
      expect(findDelimiterPositions('a `;`; b')).toEqual([5]);
    });

    it('should return empty array when no delimiters', () => {
      expect(findDelimiterPositions('hello world')).toEqual([]);
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

    it('should trim whitespace from queries', () => {
      const result = splitMultiQueries('  up  ;  down  ');
      expect(result[0].query).toBe('up');
      expect(result[1].query).toBe('down');
    });

    it('should handle many queries with correct labels', () => {
      const queries = Array.from({ length: 30 }, (_, i) => `metric_${i}`).join('; ');
      const result = splitMultiQueries(queries);
      expect(result.length).toBe(30);
      expect(result[0].label).toBe('A');
      expect(result[25].label).toBe('Z');
      expect(result[26].label).toBe('AA');
      expect(result[27].label).toBe('AB');
    });
  });
});
