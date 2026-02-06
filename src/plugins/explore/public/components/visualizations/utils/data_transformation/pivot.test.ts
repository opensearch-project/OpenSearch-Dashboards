/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { pivot } from './pivot';
import { AggregationType, TimeUnit } from '../../types';

describe('pivot', () => {
  describe('categorical pivot', () => {
    const data = [
      { product: 'A', type: 'online', sales: 100 },
      { product: 'A', type: 'store', sales: 150 },
      { product: 'B', type: 'online', sales: 200 },
      { product: 'B', type: 'store', sales: 120 },
    ];

    it('pivots with SUM aggregation', () => {
      const result = pivot({
        groupBy: 'product',
        pivot: 'type',
        field: 'sales',
        aggregationType: AggregationType.SUM,
      })(data);

      expect(result).toEqual([
        { product: 'A', online: 100, store: 150 },
        { product: 'B', online: 200, store: 120 },
      ]);
    });

    it('pivots with MEAN aggregation', () => {
      const result = pivot({
        groupBy: 'product',
        pivot: 'type',
        field: 'sales',
        aggregationType: AggregationType.MEAN,
      })(data);

      expect(result).toEqual([
        { product: 'A', online: 100, store: 150 },
        { product: 'B', online: 200, store: 120 },
      ]);
    });

    it('pivots with MAX aggregation', () => {
      const dataWithDuplicates = [...data, { product: 'A', type: 'online', sales: 250 }];

      const result = pivot({
        groupBy: 'product',
        pivot: 'type',
        field: 'sales',
        aggregationType: AggregationType.MAX,
      })(dataWithDuplicates);

      expect(result).toEqual([
        { product: 'A', online: 250, store: 150 },
        { product: 'B', online: 200, store: 120 },
      ]);
    });

    it('pivots with MIN aggregation', () => {
      const dataWithDuplicates = [...data, { product: 'A', type: 'online', sales: 50 }];

      const result = pivot({
        groupBy: 'product',
        pivot: 'type',
        field: 'sales',
        aggregationType: AggregationType.MIN,
      })(dataWithDuplicates);

      expect(result).toEqual([
        { product: 'A', online: 50, store: 150 },
        { product: 'B', online: 200, store: 120 },
      ]);
    });

    it('pivots with COUNT aggregation', () => {
      const dataWithDuplicates = [...data, { product: 'A', type: 'online', sales: 250 }];

      const result = pivot({
        groupBy: 'product',
        pivot: 'type',
        field: 'sales',
        aggregationType: AggregationType.COUNT,
      })(dataWithDuplicates);

      expect(result).toEqual([
        { product: 'A', online: 2, store: 1 },
        { product: 'B', online: 1, store: 1 },
      ]);
    });
  });

  describe('pivot without aggregation', () => {
    it('returns arrays when no aggregationType is provided', () => {
      const data = [
        { time: '<time1>', value: 1, type: 'type1' },
        { time: '<time1>', value: 2, type: 'type1' },
        { time: '<time2>', value: 2, type: 'type2' },
        { time: '<time1>', value: 3, type: 'type1' },
      ];

      const result = pivot({
        groupBy: 'time',
        pivot: 'type',
        field: 'value',
      })(data);

      expect(result).toEqual([
        { time: '<time1>', type1: [1, 2, 3], type2: null },
        { time: '<time2>', type1: null, type2: 2 },
      ]);
    });

    it('unwraps single-value arrays to scalars', () => {
      const data = [
        { time: '<time1>', value: 1, type: 'type1' },
        { time: '<time2>', value: 2, type: 'type2' },
      ];

      const result = pivot({
        groupBy: 'time',
        pivot: 'type',
        field: 'value',
      })(data);

      expect(result).toEqual([
        { time: '<time1>', type1: 1, type2: null },
        { time: '<time2>', type1: null, type2: 2 },
      ]);
    });
  });

  describe('handling empty/null/undefined pivot values', () => {
    it('normalizes empty pivot values to "-"', () => {
      const data = [
        { region: 'US', category: '', sales: 100 },
        { region: 'EU', category: null, sales: 150 },
        { region: 'US', category: 'Electronics', sales: 200 },
      ];

      const result = pivot({
        groupBy: 'region',
        pivot: 'category',
        field: 'sales',
        aggregationType: AggregationType.SUM,
      })(data);

      expect(result).toEqual([
        { region: 'US', '-': 100, Electronics: 200 },
        { region: 'EU', '-': 150, Electronics: null },
      ]);
    });

    it('normalizes undefined pivot values to "-"', () => {
      const data = [
        { region: 'US', category: undefined, sales: 100 },
        { region: 'US', category: 'Electronics', sales: 200 },
      ];

      const result = pivot({
        groupBy: 'region',
        pivot: 'category',
        field: 'sales',
        aggregationType: AggregationType.SUM,
      })(data);

      expect(result).toEqual([{ region: 'US', '-': 100, Electronics: 200 }]);
    });
  });

  describe('time-based pivot', () => {
    const data = [
      { timestamp: '2024-01-01T00:00:00Z', product: 'A', sales: 100 },
      { timestamp: '2024-01-01T00:00:00Z', product: 'B', sales: 200 },
      { timestamp: '2024-01-02T00:00:00Z', product: 'A', sales: 150 },
      { timestamp: '2024-01-02T00:00:00Z', product: 'B', sales: 180 },
    ];

    it('pivots with time-based grouping', () => {
      const result = pivot({
        groupBy: 'timestamp',
        pivot: 'product',
        field: 'sales',
        timeUnit: TimeUnit.DATE,
        aggregationType: AggregationType.SUM,
      })(data);

      expect(result).toEqual([
        { timestamp: new Date('2024-01-01T00:00:00.000Z'), A: 100, B: 200 },
        { timestamp: new Date('2024-01-02T00:00:00.000Z'), A: 150, B: 180 },
      ]);
    });

    it('sorts results by time', () => {
      const unsortedData = [
        { timestamp: '2024-01-02T00:00:00Z', product: 'A', sales: 150 },
        { timestamp: '2024-01-01T00:00:00Z', product: 'A', sales: 100 },
      ];

      const result = pivot({
        groupBy: 'timestamp',
        pivot: 'product',
        field: 'sales',
        timeUnit: TimeUnit.DATE,
        aggregationType: AggregationType.SUM,
      })(unsortedData);

      expect(result).toEqual([
        { timestamp: new Date('2024-01-01T00:00:00.000Z'), A: 100 },
        { timestamp: new Date('2024-01-02T00:00:00.000Z'), A: 150 },
      ]);
    });

    it('skips invalid dates', () => {
      const dataWithInvalidDate = [
        { timestamp: 'invalid-date', product: 'A', sales: 100 },
        { timestamp: '2024-01-01T00:00:00Z', product: 'A', sales: 150 },
      ];

      const result = pivot({
        groupBy: 'timestamp',
        pivot: 'product',
        field: 'sales',
        timeUnit: TimeUnit.DATE,
        aggregationType: AggregationType.SUM,
      })(dataWithInvalidDate);

      expect(result).toHaveLength(1);
      expect(result[0].A).toBe(150);
    });

    it('preserves timestamp as Date object when input is Unix timestamp number', () => {
      // This test ensures that Unix timestamps (numbers) are preserved as Date objects
      // not converted to strings during the grouping process
      const timestampData = [
        { timestamp: 1704110400000, product: 'A', sales: 100 }, // 2024-01-01 12:00:00 UTC
        { timestamp: 1704110400000, product: 'B', sales: 200 },
        { timestamp: 1704196800000, product: 'A', sales: 150 }, // 2024-01-02 12:00:00 UTC
      ];

      const result = pivot({
        groupBy: 'timestamp',
        pivot: 'product',
        field: 'sales',
        timeUnit: TimeUnit.DATE,
        aggregationType: AggregationType.SUM,
      })(timestampData);

      // Verify that timestamp values are Date objects, not strings or numbers
      expect(result[0].timestamp).toBeInstanceOf(Date);
      expect(result[1].timestamp).toBeInstanceOf(Date);
      expect(typeof result[0].timestamp).not.toBe('string');
      expect(typeof result[0].timestamp).not.toBe('number');

      // Verify the aggregated data is correct
      expect(result).toEqual([
        { timestamp: new Date('2024-01-01T00:00:00.000Z'), A: 100, B: 200 },
        { timestamp: new Date('2024-01-02T00:00:00.000Z'), A: 150, B: null },
      ]);
    });

    it('preserves timestamp values in categorical grouping without timeUnit', () => {
      // This test ensures timestamps are preserved correctly even in categorical
      // grouping (without timeUnit), verifying the fix works for both code paths
      const timestampData = [
        { timestamp: 1704110400000, product: 'A', sales: 100 },
        { timestamp: 1704110400000, product: 'B', sales: 200 },
        { timestamp: 1704196800000, product: 'A', sales: 150 },
      ];

      const result = pivot({
        groupBy: 'timestamp',
        pivot: 'product',
        field: 'sales',
        // No timeUnit - categorical grouping
        aggregationType: AggregationType.SUM,
      })(timestampData);

      // Verify that the original timestamp values are preserved (not converted to strings)
      expect(result[0].timestamp).toBe(1704110400000);
      expect(result[1].timestamp).toBe(1704196800000);
      expect(typeof result[0].timestamp).toBe('number');
      expect(typeof result[1].timestamp).toBe('number');

      // Verify the aggregated data is correct
      expect(result).toEqual([
        { timestamp: 1704110400000, A: 100, B: 200 },
        { timestamp: 1704196800000, A: 150, B: null },
      ]);
    });
  });

  describe('edge cases', () => {
    it('handles empty data', () => {
      const result = pivot({
        groupBy: 'product',
        pivot: 'type',
        field: 'sales',
        aggregationType: AggregationType.SUM,
      })([]);

      expect(result).toEqual([]);
    });

    it('handles NaN values', () => {
      const data = [
        { product: 'A', type: 'online', sales: 100 },
        { product: 'A', type: 'online', sales: 'invalid' },
        { product: 'A', type: 'store', sales: 150 },
      ];

      const result = pivot({
        groupBy: 'product',
        pivot: 'type',
        field: 'sales',
        aggregationType: AggregationType.SUM,
      })(data);

      expect(result).toEqual([{ product: 'A', online: 100, store: 150 }]);
    });

    it('handles missing pivot values with null', () => {
      const data = [
        { product: 'A', type: 'online', sales: 100 },
        { product: 'B', type: 'store', sales: 150 },
      ];

      const result = pivot({
        groupBy: 'product',
        pivot: 'type',
        field: 'sales',
        aggregationType: AggregationType.SUM,
      })(data);

      expect(result).toEqual([
        { product: 'A', online: 100, store: null },
        { product: 'B', online: null, store: 150 },
      ]);
    });
  });
});
