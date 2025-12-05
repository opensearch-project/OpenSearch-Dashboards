/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  mergeThresholdsWithBase,
  locateThreshold,
  generateRanges,
  getMaxAndMinBase,
} from './threshold_utils';

describe('gauge_chart_utils', () => {
  describe('mergeThresholdsWithBase', () => {
    it('returns base range when no thresholds exist', () => {
      const result = mergeThresholdsWithBase(5, 10, '#blue', [], 7);
      expect(result.mergedThresholds).toEqual([{ value: 5, color: '#blue' }]);
      expect(result.textColor).toBe('#blue');
    });

    it('returns base range and grey text color when no thresholds exist and no targetValue', () => {
      const result = mergeThresholdsWithBase(5, 10, '#blue', [], 7);
      expect(result.mergedThresholds).toEqual([{ value: 5, color: '#blue' }]);
      expect(result.textColor).toBe('#blue');
    });

    it('update thresholds when minBase exceeds one of them', () => {
      const thresholds = [
        { value: 10, color: '#red' },
        { value: 20, color: '#green' },
      ];
      const result = mergeThresholdsWithBase(30, 40, '#blue', thresholds);
      expect(result.mergedThresholds).toEqual([{ value: 30, color: '#green' }]);

      const newThresholds = [
        { value: 10, color: '#red' },
        { value: 20, color: '#green' },
      ];
      const newResult = mergeThresholdsWithBase(15, 40, '#blue', newThresholds);
      expect(newResult.mergedThresholds).toEqual([
        { value: 15, color: '#red' },
        { value: 20, color: '#green' },
      ]);
    });

    it('add minBase as threshold when all thresholds exceed minBase', () => {
      const thresholds = [
        { value: 10, color: '#red' },
        { value: 20, color: '#green' },
      ];
      const result = mergeThresholdsWithBase(0, 30, '#blue', thresholds);
      expect(result.mergedThresholds).toEqual([
        { value: 0, color: '#blue' },
        { value: 10, color: '#red' },
        { value: 20, color: '#green' },
      ]);
    });

    it('filters thresholds above maxBase', () => {
      const thresholds = [
        { value: 5, color: '#red' },
        { value: 15, color: '#green' },
      ];
      const result = mergeThresholdsWithBase(0, 12, '#blue', thresholds);
      expect(result.mergedThresholds).toEqual([
        { value: 0, color: '#blue' },
        { value: 5, color: '#red' },
      ]);
    });

    it('sets textColor based on targetValue', () => {
      const thresholds = [
        { value: 5, color: '#red' },
        { value: 15, color: '#green' },
      ];
      const result = mergeThresholdsWithBase(0, 20, '#blue', thresholds, 10);
      expect(result.textColor).toBe('#red');
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
});

describe('getMaxAndMinBase', () => {
  it('uses provided min and max values', () => {
    const result = getMaxAndMinBase(0, 50, 10, 100, 75);
    expect(result.minBase).toBe(10);
    expect(result.maxBase).toBe(100);
  });

  it('uses min(0,minNumber) as default min when not provided', () => {
    const result = getMaxAndMinBase(-10, 50, undefined, 100, 75);
    expect(result.minBase).toBe(-10);
    expect(result.maxBase).toBe(100);
    const result2 = getMaxAndMinBase(3, 50, undefined, 100, 75);
    expect(result2.minBase).toBe(0);
    expect(result2.maxBase).toBe(100);
  });

  it('uses Math.max of maxNumber and calculatedValue when max is undefined', () => {
    const result = getMaxAndMinBase(0, 30, undefined, undefined, 60);
    expect(result.minBase).toBe(0);
    expect(result.maxBase).toBe(60);
  });

  it('uses maxNumber when calculatedValue is undefined', () => {
    const result = getMaxAndMinBase(0, 40, undefined, undefined, undefined);
    expect(result.minBase).toBe(0);
    expect(result.maxBase).toBe(40);
  });
});
