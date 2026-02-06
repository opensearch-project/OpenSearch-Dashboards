/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { aggregate, aggregateByGroups } from './aggregate';
import { AggregationType, TimeUnit } from '../../types';

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
describe('aggregateByGroups', () => {
  const data = [
    { region: 'North', product: 'A', sales: 100 },
    { region: 'North', product: 'A', sales: 150 },
    { region: 'North', product: 'B', sales: 200 },
    { region: 'South', product: 'A', sales: 120 },
    { region: 'South', product: 'B', sales: 180 },
  ];

  it('aggregates by multiple groups with SUM', () => {
    const result = aggregateByGroups({
      groupBy: ['region', 'product'],
      field: 'sales',
      aggregationType: AggregationType.SUM,
    })(data);

    expect(result).toEqual([
      { region: 'North', product: 'A', sales: 250 },
      { region: 'North', product: 'B', sales: 200 },
      { region: 'South', product: 'A', sales: 120 },
      { region: 'South', product: 'B', sales: 180 },
    ]);
  });

  it('aggregates by multiple groups with MEAN', () => {
    const result = aggregateByGroups({
      groupBy: ['region', 'product'],
      field: 'sales',
      aggregationType: AggregationType.MEAN,
    })(data);

    expect(result).toEqual([
      { region: 'North', product: 'A', sales: 125 },
      { region: 'North', product: 'B', sales: 200 },
      { region: 'South', product: 'A', sales: 120 },
      { region: 'South', product: 'B', sales: 180 },
    ]);
  });

  it('handles single group field', () => {
    const result = aggregateByGroups({
      groupBy: ['product'],
      field: 'sales',
      aggregationType: AggregationType.SUM,
    })(data);

    expect(result).toEqual([
      { product: 'A', sales: 370 },
      { product: 'B', sales: 380 },
    ]);
  });

  it('handles empty data', () => {
    const result = aggregateByGroups({
      groupBy: ['region', 'product'],
      field: 'sales',
      aggregationType: AggregationType.SUM,
    })([]);

    expect(result).toEqual([]);
  });

  it('handles NaN values', () => {
    const dataWithNaN = [
      { region: 'North', product: 'A', sales: 100 },
      { region: 'North', product: 'A', sales: 'invalid' },
      { region: 'North', product: 'A', sales: 150 },
    ];

    const result = aggregateByGroups({
      groupBy: ['region', 'product'],
      field: 'sales',
      aggregationType: AggregationType.SUM,
    })(dataWithNaN);

    expect(result).toEqual([{ region: 'North', product: 'A', sales: 250 }]);
  });

  it('aggregates with MAX', () => {
    const result = aggregateByGroups({
      groupBy: ['region', 'product'],
      field: 'sales',
      aggregationType: AggregationType.MAX,
    })(data);

    expect(result).toEqual([
      { region: 'North', product: 'A', sales: 150 },
      { region: 'North', product: 'B', sales: 200 },
      { region: 'South', product: 'A', sales: 120 },
      { region: 'South', product: 'B', sales: 180 },
    ]);
  });

  it('handles undefined and null group values', () => {
    const dataWithNulls = [
      { region: null, product: 'A', sales: 100 },
      { region: undefined, product: 'B', sales: 150 },
      { region: 'North', product: null, sales: 200 },
    ];

    const result = aggregateByGroups({
      groupBy: ['region', 'product'],
      field: 'sales',
      aggregationType: AggregationType.SUM,
    })(dataWithNulls);

    expect(result).toEqual([
      { region: null, product: 'A', sales: 100 },
      { region: undefined, product: 'B', sales: 150 },
      { region: 'North', product: null, sales: 200 },
    ]);
  });
});
