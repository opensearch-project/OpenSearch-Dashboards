/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  inferTimeIntervals,
  transformIntervelsToTickCount,
  inferBucketSize,
  adjustBucketBins,
  buildEncoding,
  buildTooltipEncoding,
} from './bar_chart_utils';
import { TimeUnit, VisFieldType, AggregationType, VisColumn, StandardAxes } from '../types';

jest.mock('../utils/utils', () => ({
  applyAxisStyling: jest.fn(() => ({ grid: true })),
  getSchemaByAxis: jest.fn((axis) => {
    if (axis?.schema === 'date') return 'temporal';
    return 'nominal';
  }),
}));

describe('bar_chart_utils', () => {
  describe('inferTimeIntervals', () => {
    it('returns DATE for empty data', () => {
      expect(inferTimeIntervals([], 'date')).toBe(TimeUnit.DATE);
    });

    it('returns YEAR for large intervals', () => {
      const data = [{ date: '2020-01-01' }, { date: '2023-01-01' }];
      expect(inferTimeIntervals(data, 'date')).toBe(TimeUnit.YEAR);
    });

    it('returns SECOND for small intervals', () => {
      const now = Date.now();
      const data = [{ date: new Date(now) }, { date: new Date(now + 1000) }];
      expect(inferTimeIntervals(data, 'date')).toBe(TimeUnit.SECOND);
    });
  });

  describe('transformIntervelsToTickCount', () => {
    it('transforms time units correctly', () => {
      expect(transformIntervelsToTickCount(TimeUnit.YEAR)).toBe('year');
      expect(transformIntervelsToTickCount(TimeUnit.MONTH)).toBe('month');
      expect(transformIntervelsToTickCount(TimeUnit.DATE)).toBe('day');
      expect(transformIntervelsToTickCount(undefined)).toBe('day');
    });
  });

  describe('inferBucketSize', () => {
    it('returns null for empty data', () => {
      expect(inferBucketSize([], 'value')).toBeNull();
    });

    it('calculates bucket size correctly', () => {
      const data = [{ value: 1000 }, { value: 5999 }];
      expect(inferBucketSize(data, 'value')).toBe(100);
    });
  });

  describe('adjustBucketBins', () => {
    const data = [{ value: 100 }];

    it('returns step when bucketSize is provided', () => {
      const styles = { bucketSize: 50 };
      expect(adjustBucketBins(styles, data, 'value')).toEqual({ step: 50 });
    });

    it('returns maxbins when bucketCount is provided', () => {
      const styles = { bucketCount: 20 };
      expect(adjustBucketBins(styles, data, 'value')).toEqual({ maxbins: 20 });
    });

    it('returns inferred step when no options provided', () => {
      expect(adjustBucketBins(undefined, data, 'value')).toEqual({ step: 10 });
    });
  });

  describe('buildEncoding', () => {
    const axis = { column: 'test', schema: VisFieldType.Date, name: 'Test' } as VisColumn;
    const axisStyle = { title: { text: 'Custom Title' } } as StandardAxes;

    it('builds basic encoding', () => {
      const result = buildEncoding(axis, axisStyle, undefined, undefined);
      expect(result.field).toBe('test');
      expect(result.type).toBe('temporal');
    });

    it('adds timeUnit for date fields', () => {
      const result = buildEncoding(axis, axisStyle, TimeUnit.YEAR, undefined);
      expect(result.timeUnit).toBe(TimeUnit.YEAR);
      expect(result.axis.tickCount).toBe('year');
    });

    it('adds aggregate for numerical fields', () => {
      const numAxis = { ...axis, schema: VisFieldType.Numerical } as VisColumn;
      const result = buildEncoding(numAxis, axisStyle, undefined, AggregationType.SUM);
      expect(result.aggregate).toBe(AggregationType.SUM);
    });
  });

  describe('buildTooltipEncoding', () => {
    const axis = { column: 'test', schema: VisFieldType.Numerical, name: 'Test' } as VisColumn;
    const axisStyle = { title: { text: 'Custom Title' } } as StandardAxes;

    it('builds tooltip encoding with custom title for aggregated numerical fields', () => {
      const result = buildTooltipEncoding(axis, axisStyle, undefined, AggregationType.SUM);
      expect(result.title).toBe('Custom Title');
      expect(result.aggregate).toBe(AggregationType.SUM);
    });

    it('uses default title format for aggregated fields without custom title', () => {
      const result = buildTooltipEncoding(axis, undefined, undefined, AggregationType.MEAN);
      expect(result.title).toBe('Test(mean)');
    });
  });
});
