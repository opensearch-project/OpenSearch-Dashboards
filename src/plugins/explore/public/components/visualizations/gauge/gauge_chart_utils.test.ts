/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  mergeCustomRangesWithBase,
  locateRange,
  generateRanges,
  generateArcExpression,
} from './gauge_chart_utils';

describe('gauge_chart_utils', () => {
  describe('mergeCustomRangesWithBase', () => {
    it('returns base range when no thresholds exist', () => {
      const result = mergeCustomRangesWithBase(0, '#blue', []);
      expect(result).toEqual([{ value: 0, color: '#blue' }]);
    });

    it('returns base range when minBase exceeds all thresholds', () => {
      const thresholds = [
        { value: 10, color: '#red' },
        { value: 20, color: '#green' },
      ];
      const result = mergeCustomRangesWithBase(30, '#blue', thresholds);
      expect(result).toEqual([{ value: 30, color: '#blue' }]);
    });

    it('returns existing thresholds when minBase already exists', () => {
      const thresholds = [
        { value: 0, color: '#red' },
        { value: 20, color: '#green' },
      ];
      const result = mergeCustomRangesWithBase(0, '#blue', thresholds);
      expect(result).toEqual(thresholds);
    });

    it('inserts base range and excludes thresholds below minBase', () => {
      const thresholds = [
        { value: 5, color: '#red' },
        { value: 15, color: '#green' },
      ];
      const result = mergeCustomRangesWithBase(10, '#blue', thresholds);
      expect(result).toEqual([
        { value: 10, color: '#blue' },
        { value: 15, color: '#green' },
      ]);
    });
  });

  describe('locateRange', () => {
    const ranges = [
      { value: 5, color: '#blue' },
      { value: 10, color: '#red' },
      { value: 20, color: '#green' },
    ];

    it('returns -1 when target is below minimum range', () => {
      expect(locateRange(ranges, 1)).toBe(-1);
    });

    it('returns correct index for target within range', () => {
      expect(locateRange(ranges, 5)).toBe(0);
      expect(locateRange(ranges, 15)).toBe(1);
    });

    it('returns last index for target above all ranges', () => {
      expect(locateRange(ranges, 25)).toBe(2);
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
      const result = generateRanges(mergedRanges, 15);
      expect(result).toEqual([
        { min: 5, max: 10, color: '#blue' },
        { min: 10, max: 15, color: '#red' },
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

      expect(result.type).toBe('arc');
      expect(result.encode.enter.startAngle.signal).toBe('0');
      expect(result.encode.update.endAngle.signal).toBe('90');
      expect(result.encode.update.fill.value).toBe('#red');
      expect(result.encode.update.x.signal).toBe('centerX');
      expect(result.encode.update.y.signal).toBe('centerY');
    });
  });
});
