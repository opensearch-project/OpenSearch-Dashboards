/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  mergeThresholdsWithBase,
  locateThreshold,
  generateRanges,
  generateArcExpression,
} from './gauge_chart_utils';

describe('gauge_chart_utils', () => {
  describe('mergeThresholdsWithBase', () => {
    it('returns base range when no thresholds exist', () => {
      const result = mergeThresholdsWithBase(0, 10, '#blue', []);
      expect(result).toEqual([{ value: 0, color: '#blue' }]);
    });

    it('returns base range when minBase exceeds all thresholds', () => {
      const thresholds = [
        { value: 10, color: '#red' },
        { value: 20, color: '#green' },
      ];
      const result = mergeThresholdsWithBase(30, 40, '#blue', thresholds);
      expect(result).toEqual([{ value: 30, color: '#blue' }]);
    });

    it('returns existing thresholds when minBase already exists', () => {
      const thresholds = [
        { value: 0, color: '#red' },
        { value: 20, color: '#green' },
      ];
      const result = mergeThresholdsWithBase(0, 30, '#blue', thresholds);
      expect(result).toEqual(thresholds);
    });

    it('inserts base range and excludes thresholds below minBase', () => {
      const thresholds = [
        { value: 5, color: '#red' },
        { value: 15, color: '#green' },
      ];
      const result = mergeThresholdsWithBase(10, 20, '#blue', thresholds);
      expect(result).toEqual([
        { value: 10, color: '#blue' },
        { value: 15, color: '#green' },
      ]);
    });

    it('includes thresholds below maxBase', () => {
      const thresholds = [
        { value: 5, color: '#red' },
        { value: 15, color: '#green' },
      ];
      const result = mergeThresholdsWithBase(10, 12, '#blue', thresholds);
      expect(result).toEqual([{ value: 10, color: '#blue' }]);
    });
  });

  describe('locateThreshold', () => {
    const ranges = [
      { value: 5, color: '#blue' },
      { value: 10, color: '#red' },
      { value: 20, color: '#green' },
    ];

    it('returns -1 when target is below minimum range', () => {
      expect(locateThreshold(ranges, 1)).toBe(null);
    });

    it('returns correct index for target within range', () => {
      expect(locateThreshold(ranges, 5)).toStrictEqual({ value: 5, color: '#blue' });
      expect(locateThreshold(ranges, 15)).toStrictEqual({ value: 10, color: '#red' });
    });

    it('returns last index for target above all ranges', () => {
      expect(locateThreshold(ranges, 25)).toStrictEqual({ value: 20, color: '#green' });
    });
  });

  describe('generateRanges', () => {
    const mergedRanges = [
      { value: 5, color: '#blue' },
      { value: 10, color: '#red' },
      { value: 20, color: '#green' },
    ];

    it('generates ranges within maxValue', () => {
      const result = generateRanges(mergedRanges, 30);
      expect(result).toEqual([
        { min: 5, max: 10, color: '#blue' },
        { min: 10, max: 20, color: '#red' },
        { min: 20, max: 30, color: '#green' },
      ]);
    });
    it('stops at maxValue when threshold exceeds it', () => {
      const result = generateRanges(mergedRanges, 20);
      expect(result).toEqual([
        { min: 5, max: 10, color: '#blue' },
        { min: 10, max: 20, color: '#red' },
        { min: 20, max: 20, color: '#green' },
      ]);
    });

    it('returns empty array when first threshold exceeds maxValue', () => {
      const result = generateRanges(mergedRanges, 1);
      expect(result).toEqual([]);
    });
  });

  describe('generateArcExpression', () => {
    it('generates correct arc expression', () => {
      const result = generateArcExpression(0, 90, '#red');

      expect(result.mark.type).toBe('arc');
      expect(result.mark.fill).toBe('#red');
    });
  });
});
