/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { convertTo2DArray, transform, aggregate, flatten, pivot } from './data_transformation';
import { AggregationType, TimeUnit } from '../types';

describe('convertTo2DArray', () => {
  it('returns empty array for empty input', () => {
    expect(convertTo2DArray()([])).toEqual([]);
  });

  it('converts array of objects to 2D array without headers', () => {
    const data = [
      { name: 'foo', age: 10, height: 100 },
      { name: 'bar', age: 15, height: 130 },
    ];
    const result = convertTo2DArray()(data);
    expect(result).toEqual([
      ['name', 'age', 'height'],
      ['foo', 10, 100],
      ['bar', 15, 130],
    ]);
  });

  it('converts array of objects to 2D array with specified headers', () => {
    const data = [
      { name: 'foo', age: 10, height: 100 },
      { name: 'bar', age: 15, height: 130 },
    ];
    const result = convertTo2DArray(['name', 'age'])(data);
    expect(result).toEqual([
      ['name', 'age'],
      ['foo', 10],
      ['bar', 15],
    ]);
  });

  it('handles single object', () => {
    const data = [{ name: 'foo', age: 10 }];
    const result = convertTo2DArray()(data);
    expect(result).toEqual([
      ['name', 'age'],
      ['foo', 10],
    ]);
  });

  it('handles objects with undefined values', () => {
    const data = [
      { name: 'foo', age: undefined },
      { name: 'bar', age: 15 },
    ];
    const result = convertTo2DArray()(data);
    expect(result).toEqual([
      ['name', 'age'],
      ['foo', undefined],
      ['bar', 15],
    ]);
  });
});

describe('transform', () => {
  it('applies single transformation function', () => {
    const state = { data: [{ a: 1 }, { a: 2 }] } as any;
    const addB = (data: any[]) => data.map((item) => ({ ...item, b: item.a * 2 }));

    const result = transform(addB)(state);

    expect(result.transformedData).toEqual([
      { a: 1, b: 2 },
      { a: 2, b: 4 },
    ]);
  });

  it('applies multiple transformation functions in sequence', () => {
    const state = { data: [{ a: 1 }, { a: 2 }] } as any;
    const addB = (data: any[]) => data.map((item) => ({ ...item, b: item.a * 2 }));
    const addC = (data: any[]) => data.map((item) => ({ ...item, c: item.a + item.b }));

    const result = transform(addB, addC)(state);

    expect(result.transformedData).toEqual([
      { a: 1, b: 2, c: 3 },
      { a: 2, b: 4, c: 6 },
    ]);
  });

  it('preserves original state properties', () => {
    const state = { data: [{ a: 1 }], otherProp: 'value' } as any;
    const identity = (data: any[]) => data;

    const result = transform(identity)(state);

    // @ts-ignore
    expect(result.otherProp).toBe('value');
  });
});

describe('aggregate', () => {
  describe('categorical aggregation', () => {
    const data = [
      { product: 'A', sales: 100 },
      { product: 'A', sales: 150 },
      { product: 'B', sales: 200 },
      { product: 'B', sales: 120 },
    ];

    it('aggregates with SUM', () => {
      const result = aggregate({
        groupBy: 'product',
        field: 'sales',
        aggregationType: AggregationType.SUM,
      })(data);

      expect(result).toEqual([
        { product: 'A', sales: 250 },
        { product: 'B', sales: 320 },
      ]);
    });

    it('aggregates with MEAN', () => {
      const result = aggregate({
        groupBy: 'product',
        field: 'sales',
        aggregationType: AggregationType.MEAN,
      })(data);

      expect(result).toEqual([
        { product: 'A', sales: 125 },
        { product: 'B', sales: 160 },
      ]);
    });

    it('aggregates with MAX', () => {
      const result = aggregate({
        groupBy: 'product',
        field: 'sales',
        aggregationType: AggregationType.MAX,
      })(data);

      expect(result).toEqual([
        { product: 'A', sales: 150 },
        { product: 'B', sales: 200 },
      ]);
    });

    it('aggregates with MIN', () => {
      const result = aggregate({
        groupBy: 'product',
        field: 'sales',
        aggregationType: AggregationType.MIN,
      })(data);

      expect(result).toEqual([
        { product: 'A', sales: 100 },
        { product: 'B', sales: 120 },
      ]);
    });

    it('aggregates with COUNT', () => {
      const result = aggregate({
        groupBy: 'product',
        field: 'sales',
        aggregationType: AggregationType.COUNT,
      })(data);

      expect(result).toEqual([
        { product: 'A', sales: 2 },
        { product: 'B', sales: 2 },
      ]);
    });

    it('aggregates with NONE (returns first value)', () => {
      const result = aggregate({
        groupBy: 'product',
        field: 'sales',
        aggregationType: AggregationType.NONE,
      })(data);

      expect(result).toEqual([
        { product: 'A', sales: 100 },
        { product: 'B', sales: 200 },
      ]);
    });
  });

  describe('time-based aggregation', () => {
    const data = [
      { timestamp: '2024-01-01T00:00:00Z', sales: 100 },
      { timestamp: '2024-01-01T12:00:00Z', sales: 150 },
      { timestamp: '2024-01-02T00:00:00Z', sales: 200 },
      { timestamp: '2024-01-02T12:00:00Z', sales: 180 },
    ];

    it('aggregates by DATE with SUM', () => {
      const result = aggregate({
        groupBy: 'timestamp',
        field: 'sales',
        timeUnit: TimeUnit.DATE,
        aggregationType: AggregationType.SUM,
      })(data);

      expect(result).toEqual([
        { timestamp: new Date('2024-01-01T00:00:00.000Z'), sales: 250 },
        { timestamp: new Date('2024-01-02T00:00:00.000Z'), sales: 380 },
      ]);
    });

    it('sorts results by time', () => {
      const unsortedData = [
        { timestamp: '2024-01-02T09:00:00Z', sales: 200 },
        { timestamp: '2024-01-01T08:00:00Z', sales: 100 },
      ];

      const result = aggregate({
        groupBy: 'timestamp',
        field: 'sales',
        timeUnit: TimeUnit.DATE,
        aggregationType: AggregationType.SUM,
      })(unsortedData);

      expect(result).toEqual([
        { timestamp: new Date('2024-01-01T00:00:00.000Z'), sales: 100 },
        { timestamp: new Date('2024-01-02T00:00:00.000Z'), sales: 200 },
      ]);
    });

    it('skips invalid dates', () => {
      const dataWithInvalidDate = [
        { timestamp: 'invalid-date', sales: 100 },
        { timestamp: '2024-01-01T08:00:00Z', sales: 150 },
      ];

      const result = aggregate({
        groupBy: 'timestamp',
        field: 'sales',
        timeUnit: TimeUnit.DATE,
        aggregationType: AggregationType.SUM,
      })(dataWithInvalidDate);

      expect(result).toHaveLength(1);
      expect(result[0].sales).toBe(150);
    });
  });

  describe('edge cases', () => {
    it('handles empty data', () => {
      const result = aggregate({
        groupBy: 'product',
        field: 'sales',
        aggregationType: AggregationType.SUM,
      })([]);

      expect(result).toEqual([]);
    });

    it('handles NaN values', () => {
      const data = [
        { product: 'A', sales: 100 },
        { product: 'A', sales: 'invalid' },
        { product: 'A', sales: 150 },
      ];

      const result = aggregate({
        groupBy: 'product',
        field: 'sales',
        aggregationType: AggregationType.SUM,
      })(data);

      expect(result).toEqual([{ product: 'A', sales: 250 }]);
    });

    it('handles groups with no valid values', () => {
      const data = [
        { product: 'A', sales: 'invalid' },
        { product: 'A', sales: 'also-invalid' },
      ];

      const result = aggregate({
        groupBy: 'product',
        field: 'sales',
        aggregationType: AggregationType.SUM,
      })(data);

      // When all values are invalid, the group is not included in the result
      expect(result).toEqual([]);
    });
  });
});

describe('flatten', () => {
  it('auto-detects and flattens array fields', () => {
    const data = [
      { key: 'alpha', foo: [1, 2], bar: ['A', 'B'] },
      { key: 'beta', foo: [3, 4, 5], bar: ['C', 'D'] },
    ];

    const result = flatten()(data);

    expect(result).toEqual([
      { key: 'alpha', foo: 1, bar: 'A' },
      { key: 'alpha', foo: 2, bar: 'B' },
      { key: 'beta', foo: 3, bar: 'C' },
      { key: 'beta', foo: 4, bar: 'D' },
      { key: 'beta', foo: 5, bar: null },
    ]);
  });

  it('flattens specified fields only', () => {
    const data = [
      { time: '<time1>', type1: [1, 2, 3], type2: null },
      { time: '<time2>', type1: null, type2: [2] },
    ];

    const result = flatten(['type1', 'type2'])(data);

    expect(result).toEqual([
      { time: '<time1>', type1: 1, type2: null },
      { time: '<time1>', type1: 2, type2: null },
      { time: '<time1>', type1: 3, type2: null },
      { time: '<time2>', type1: null, type2: 2 },
    ]);
  });

  it('handles mixed array and non-array values', () => {
    const data = [
      { key: 'alpha', foo: 1, bar: 'A' },
      { key: 'beta', foo: [3, 4, 5], bar: ['C', 'D'] },
    ];

    const result = flatten()(data);

    expect(result).toEqual([
      { key: 'alpha', foo: 1, bar: 'A' },
      { key: 'beta', foo: 3, bar: 'C' },
      { key: 'beta', foo: 4, bar: 'D' },
      { key: 'beta', foo: 5, bar: null },
    ]);
  });

  it('returns data as-is when no array fields exist', () => {
    const data = [
      { key: 'alpha', foo: 1, bar: 'A' },
      { key: 'beta', foo: 2, bar: 'B' },
    ];

    const result = flatten()(data);

    expect(result).toEqual(data);
  });

  it('handles empty data', () => {
    const result = flatten()([]);
    expect(result).toEqual([]);
  });

  it('handles empty arrays', () => {
    const data = [{ key: 'alpha', foo: [], bar: [] }];

    const result = flatten()(data);

    expect(result).toEqual([{ key: 'alpha', foo: null, bar: null }]);
  });

  it('handles arrays of different lengths', () => {
    const data = [{ key: 'alpha', foo: [1, 2, 3], bar: ['A'] }];

    const result = flatten()(data);

    expect(result).toEqual([
      { key: 'alpha', foo: 1, bar: 'A' },
      { key: 'alpha', foo: 2, bar: null },
      { key: 'alpha', foo: 3, bar: null },
    ]);
  });
});

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
