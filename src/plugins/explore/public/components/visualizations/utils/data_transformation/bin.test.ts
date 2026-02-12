/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { bin } from './bin';
import { AggregationType } from '../../types';

describe('bin', () => {
  describe('basic binning', () => {
    it('should bin data with explicit size', () => {
      const data = [{ age: 5 }, { age: 15 }, { age: 17 }, { age: 25 }, { age: 35 }];

      const result = bin({
        bin: { size: 10 },
        binField: 'age',
      })(data);

      expect(result).toEqual([
        { start: 0, end: 10, value: 1 },
        { start: 10, end: 20, value: 2 },
        { start: 20, end: 30, value: 1 },
        { start: 30, end: 40, value: 1 },
      ]);
    });

    it('should bin data with count', () => {
      const data = [{ value: 5 }, { value: 15 }, { value: 25 }, { value: 35 }];

      const result = bin({
        bin: { count: 2 },
        binField: 'value',
      })(data);

      // (35-5)/2 = 15, getNiceNumber(15) = 20
      // binStart = floor(5/20)*20 = 0
      // Bins: 0-20, 20-40
      expect(result).toEqual([
        { start: 0, end: 20, value: 2 },
        { start: 20, end: 40, value: 2 },
      ]);
    });

    it('should align bins to nice boundaries', () => {
      const data = [{ value: 42.2 }, { value: 47 }, { value: 52 }];

      const result = bin({
        bin: { size: 5 },
        binField: 'value',
      })(data);

      // binStart = floor(42.2/5)*5 = floor(8.44)*5 = 40
      expect(result).toEqual([
        { start: 40, end: 45, value: 1 },
        { start: 45, end: 50, value: 1 },
        { start: 50, end: 55, value: 1 },
      ]);
    });

    it('should handle max value correctly', () => {
      const data = [{ value: 40 }, { value: 45 }, { value: 50 }];

      const result = bin({
        bin: { size: 5 },
        binField: 'value',
      })(data);

      expect(result).toEqual([
        { start: 40, end: 45, value: 1 },
        { start: 45, end: 50, value: 1 },
        { start: 50, end: 55, value: 1 },
      ]);
    });
  });

  describe('aggregation', () => {
    const data = [
      { price: 5, sales: 100 },
      { price: 15, sales: 150 },
      { price: 17, sales: 200 },
      { price: 25, sales: 120 },
    ];

    it('should aggregate with SUM', () => {
      const result = bin({
        bin: { size: 10 },
        binField: 'price',
        valueField: 'sales',
        aggregationType: AggregationType.SUM,
      })(data);

      expect(result).toEqual([
        { start: 0, end: 10, value: 100 },
        { start: 10, end: 20, value: 350 },
        { start: 20, end: 30, value: 120 },
      ]);
    });

    it('should aggregate with MEAN', () => {
      const result = bin({
        bin: { size: 10 },
        binField: 'price',
        valueField: 'sales',
        aggregationType: AggregationType.MEAN,
      })(data);

      expect(result).toEqual([
        { start: 0, end: 10, value: 100 },
        { start: 10, end: 20, value: 175 },
        { start: 20, end: 30, value: 120 },
      ]);
    });

    it('should aggregate with MAX', () => {
      const result = bin({
        bin: { size: 10 },
        binField: 'price',
        valueField: 'sales',
        aggregationType: AggregationType.MAX,
      })(data);

      expect(result).toEqual([
        { start: 0, end: 10, value: 100 },
        { start: 10, end: 20, value: 200 },
        { start: 20, end: 30, value: 120 },
      ]);
    });

    it('should aggregate with MIN', () => {
      const result = bin({
        bin: { size: 10 },
        binField: 'price',
        valueField: 'sales',
        aggregationType: AggregationType.MIN,
      })(data);

      expect(result).toEqual([
        { start: 0, end: 10, value: 100 },
        { start: 10, end: 20, value: 150 },
        { start: 20, end: 30, value: 120 },
      ]);
    });

    it('should aggregate with COUNT', () => {
      const result = bin({
        bin: { size: 10 },
        binField: 'price',
        valueField: 'sales',
        aggregationType: AggregationType.COUNT,
      })(data);

      expect(result).toEqual([
        { start: 0, end: 10, value: 1 },
        { start: 10, end: 20, value: 2 },
        { start: 20, end: 30, value: 1 },
      ]);
    });

    it('should default to COUNT when no aggregation field provided', () => {
      const result = bin({
        bin: { size: 10 },
        binField: 'price',
      })(data);

      expect(result).toEqual([
        { start: 0, end: 10, value: 1 },
        { start: 10, end: 20, value: 2 },
        { start: 20, end: 30, value: 1 },
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty data', () => {
      const result = bin({
        bin: { size: 10 },
        binField: 'value',
      })([]);

      expect(result).toEqual([]);
    });

    it('should handle data with no valid values', () => {
      const data = [{ value: null }, { value: undefined }, { value: NaN }];

      const result = bin({
        bin: { size: 10 },
        binField: 'value',
      })(data);

      expect(result).toEqual([]);
    });

    it('should skip null and undefined values', () => {
      const data = [
        { value: 5 },
        { value: null },
        { value: 15 },
        { value: undefined },
        { value: 25 },
      ];

      const result = bin({
        bin: { size: 10 },
        binField: 'value',
      })(data);

      expect(result).toEqual([
        { start: 0, end: 10, value: 1 },
        { start: 10, end: 20, value: 1 },
        { start: 20, end: 30, value: 1 },
      ]);
    });

    it('should handle single value', () => {
      const data = [{ value: 42 }, { value: 42 }, { value: 42 }];

      const result = bin({
        bin: { size: 10 },
        binField: 'value',
      })(data);

      expect(result).toEqual([{ start: 42, end: 42, value: 3 }]);
    });

    it('should handle negative values', () => {
      const data = [{ value: -15 }, { value: -5 }, { value: 5 }, { value: 15 }];

      const result = bin({
        bin: { size: 10 },
        binField: 'value',
      })(data);

      expect(result).toEqual([
        { start: -20, end: -10, value: 1 },
        { start: -10, end: 0, value: 1 },
        { start: 0, end: 10, value: 1 },
        { start: 10, end: 20, value: 1 },
      ]);
    });

    it('should handle decimal values', () => {
      const data = [{ value: 0.1 }, { value: 0.25 }, { value: 0.7 }, { value: 0.9 }];

      const result = bin({
        bin: { size: 0.5 },
        binField: 'value',
      })(data);

      expect(result).toEqual([
        { start: 0, end: 0.5, value: 2 },
        { start: 0.5, end: 1, value: 2 },
      ]);
    });
  });

  describe('nice number rounding', () => {
    it('should round step to nice numbers for count-based binning', () => {
      const data = [{ value: 0 }, { value: 37 }];

      // (37-0)/3 = 12.333..., getNiceNumber should round to 10 or 20
      const result = bin({
        bin: { count: 3 },
        binField: 'value',
      })(data);

      // With nice number rounding, step should be 20
      // binStart = 0
      expect(result).toEqual([
        { start: 0, end: 20, value: 1 },
        { start: 20, end: 40, value: 1 },
      ]);
    });

    it('should not round explicit size', () => {
      const data = [{ value: 0 }, { value: 7.5 }, { value: 15 }];

      // Explicit size should be used as-is without rounding
      const result = bin({
        bin: { size: 7.5 },
        binField: 'value',
      })(data);

      expect(result).toEqual([
        { start: 0, end: 7.5, value: 1 },
        { start: 7.5, end: 15, value: 1 },
        { start: 15, end: 22.5, value: 1 },
      ]);
    });
  });

  describe('priority handling', () => {
    it('should prioritize size over count', () => {
      const data = [{ value: 0 }, { value: 50 }];

      const result = bin({
        bin: { size: 10, count: 2 },
        binField: 'value',
      })(data);

      // Should use size=10, not count=2
      expect(result).toEqual(
        [
          { start: 0, end: 10, value: 1 },
          { start: 40, end: 50, value: 0 },
          { start: 50, end: 60, value: 1 },
        ].filter((b) => b.value > 0)
      );
    });
  });

  describe('empty bins filtering', () => {
    it('should not include empty bins in result', () => {
      const data = [{ value: 0 }, { value: 50 }];

      const result = bin({
        bin: { size: 10 },
        binField: 'value',
      })(data);

      // Should only include bins with data
      expect(result.length).toBe(2);
      expect(result).toEqual([
        { start: 0, end: 10, value: 1 },
        { start: 50, end: 60, value: 1 },
      ]);
    });
  });
});
