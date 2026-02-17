/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildPointSeriesData,
  buildChartFromBreakdownSeries,
  fillTimeBucketGaps,
  Dimensions,
  Table,
} from './point_series';
import moment from 'moment';

// Helper: bounds for a 4-hour window with 1-hour interval (4 buckets)
const HOUR_MS = 3600000;
const BOUNDS_MIN = moment('2023-01-01T00:00:00Z'); // 1672531200000
const BOUNDS_MAX = moment('2023-01-01T04:00:00Z'); // 1672545600000
const T0 = BOUNDS_MIN.valueOf(); // 1672531200000
const T1 = T0 + HOUR_MS; // 1672534800000
const T2 = T0 + 2 * HOUR_MS; // 1672538400000
const T3 = T0 + 3 * HOUR_MS; // 1672542000000

const createDimensions = (boundsMin = BOUNDS_MIN, boundsMax = BOUNDS_MAX): Dimensions => ({
  x: {
    accessor: 0,
    format: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
    params: {
      date: true,
      interval: moment.duration(1, 'hour'),
      intervalOpenSearchValue: 1,
      intervalOpenSearchUnit: 'h',
      format: 'date',
      bounds: {
        min: boundsMin,
        max: boundsMax,
      },
    },
  },
  y: {
    accessor: 1,
    format: { id: 'number', params: { pattern: 'number' } },
  },
});

describe('fillTimeBucketGaps', () => {
  it('fills missing buckets with zero', () => {
    const values = [
      { x: T0, y: 10 },
      { x: T2, y: 30 },
    ];
    const result = fillTimeBucketGaps(values, HOUR_MS, T0, BOUNDS_MAX.valueOf());

    expect(result).toEqual([
      { x: T0, y: 10 },
      { x: T1, y: 0 },
      { x: T2, y: 30 },
      { x: T3, y: 0 },
    ]);
  });

  it('returns unchanged data when no gaps exist', () => {
    const values = [
      { x: T0, y: 10 },
      { x: T1, y: 20 },
      { x: T2, y: 30 },
      { x: T3, y: 40 },
    ];
    const result = fillTimeBucketGaps(values, HOUR_MS, T0, BOUNDS_MAX.valueOf());

    expect(result).toEqual(values);
  });

  it('produces zero-filled range for empty input', () => {
    const result = fillTimeBucketGaps([], HOUR_MS, T0, BOUNDS_MAX.valueOf());

    expect(result).toEqual([
      { x: T0, y: 0 },
      { x: T1, y: 0 },
      { x: T2, y: 0 },
      { x: T3, y: 0 },
    ]);
  });

  it('returns original values when interval is zero or negative', () => {
    const values = [{ x: T0, y: 10 }];
    expect(fillTimeBucketGaps(values, 0, T0, BOUNDS_MAX.valueOf())).toEqual(values);
    expect(fillTimeBucketGaps(values, -1, T0, BOUNDS_MAX.valueOf())).toEqual(values);
  });

  it('returns original values when boundsMin >= boundsMax', () => {
    const values = [{ x: T0, y: 10 }];
    expect(fillTimeBucketGaps(values, HOUR_MS, T0, T0)).toEqual(values);
    expect(fillTimeBucketGaps(values, HOUR_MS, BOUNDS_MAX.valueOf(), T0)).toEqual(values);
  });

  it('aligns buckets to data points, not epoch, for weekly intervals', () => {
    // PPL span(timestamp, 1w) aligns to Mondays; epoch aligns to Thursdays.
    // Data timestamps must be preserved, not shifted to epoch-aligned weeks.
    const WEEK_MS = 7 * 24 * HOUR_MS;
    const mon1 = new Date('2026-01-26T00:00:00Z').getTime(); // Monday
    const mon2 = new Date('2026-02-02T00:00:00Z').getTime(); // Monday
    const mon3 = new Date('2026-02-09T00:00:00Z').getTime(); // Monday
    const mon4 = new Date('2026-02-16T00:00:00Z').getTime(); // Monday

    const values = [
      { x: mon1, y: 249 },
      { x: mon2, y: 1617 },
      { x: mon3, y: 1610 },
      { x: mon4, y: 226 },
    ];

    const result = fillTimeBucketGaps(values, WEEK_MS, mon1, mon4 + WEEK_MS);

    // All 4 Monday-aligned data points should be preserved with their counts
    expect(result).toEqual([
      { x: mon1, y: 249 },
      { x: mon2, y: 1617 },
      { x: mon3, y: 1610 },
      { x: mon4, y: 226 },
    ]);

    // Verify that epoch alignment would NOT match (Thursdays ≠ Mondays)
    const epochAligned = Math.floor(mon1 / WEEK_MS) * WEEK_MS;
    expect(epochAligned).not.toBe(mon1);
  });
});

describe('buildPointSeriesData', () => {
  it('should build chart data with gap filling from the table and dimensions', () => {
    const table: Table = {
      columns: [
        { id: 'x', name: 'timestamp' },
        { id: 'y', name: 'Count' },
      ],
      rows: [
        { x: T0, y: 100 },
        { x: T2, y: 300 },
        { x: T0, y: 'NaN' }, // This row should be ignored
      ],
    };

    const dimensions = createDimensions();
    const result = buildPointSeriesData(table, dimensions);

    // Gap filling should produce all 4 hourly buckets
    expect(result.values).toEqual([
      { x: T0, y: 100 },
      { x: T1, y: 0 },
      { x: T2, y: 300 },
      { x: T3, y: 0 },
    ]);
    expect(result.xAxisOrderedValues).toEqual([T0, T1, T2, T3]);
    expect(result.xAxisFormat).toEqual(dimensions.x.format);
    expect(result.xAxisLabel).toEqual('timestamp');
    expect(result.ordered.date).toBe(true);
    expect(result.ordered.interval.asHours()).toBe(1);
    expect(result.ordered.intervalOpenSearchUnit).toBe('h');
    expect(result.ordered.intervalOpenSearchValue).toBe(1);
    expect(result.ordered.min.format()).toBe(BOUNDS_MIN.format());
    expect(result.ordered.max.format()).toBe(BOUNDS_MAX.format());
    expect(result.yAxisLabel).toEqual('Count');
  });
});

describe('buildChartFromBreakdownSeries', () => {
  it('should transform breakdown series to chart format with gap filling', () => {
    const breakdownSeries = {
      breakdownField: 'status',
      series: [
        {
          breakdownValue: 'success',
          dataPoints: [
            [T0, 10],
            [T1, 20],
          ] as Array<[number, number]>,
        },
        {
          breakdownValue: 'error',
          dataPoints: [
            [T0, 5],
            [T1, 15],
          ] as Array<[number, number]>,
        },
      ],
    };

    const result = buildChartFromBreakdownSeries(breakdownSeries, createDimensions());

    expect(result.series).toHaveLength(2);
    expect(result.series![0].id).toBe('success');
    expect(result.series![0].name).toBe('success');
    // Each series should have all 4 buckets with gaps filled
    expect(result.series![0].data).toEqual([
      { x: T0, y: 10 },
      { x: T1, y: 20 },
      { x: T2, y: 0 },
      { x: T3, y: 0 },
    ]);
    expect(result.series![1].id).toBe('error');
    expect(result.series![1].data).toEqual([
      { x: T0, y: 5 },
      { x: T1, y: 15 },
      { x: T2, y: 0 },
      { x: T3, y: 0 },
    ]);
  });

  it('should flatten all gap-filled data points to values array', () => {
    const breakdownSeries = {
      breakdownField: 'region',
      series: [
        {
          breakdownValue: 'us-east',
          dataPoints: [[T0, 100]] as Array<[number, number]>,
        },
        {
          breakdownValue: 'us-west',
          dataPoints: [[T0, 200]] as Array<[number, number]>,
        },
      ],
    };

    const result = buildChartFromBreakdownSeries(breakdownSeries, createDimensions());

    // Each series has 4 gap-filled buckets; values is the flat concatenation
    expect(result.values).toHaveLength(8);
    expect(result.values[0]).toEqual({ x: T0, y: 100 });
    expect(result.values[4]).toEqual({ x: T0, y: 200 });
  });

  it('should set correct axis properties', () => {
    const breakdownSeries = {
      breakdownField: 'type',
      series: [
        {
          breakdownValue: 'typeA',
          dataPoints: [[T0, 50]] as Array<[number, number]>,
        },
      ],
    };

    const dimensions = createDimensions();
    const result = buildChartFromBreakdownSeries(breakdownSeries, dimensions);

    expect(result.xAxisFormat.id).toBe('date');
    expect(result.xAxisFormat.params).toEqual({ pattern: 'YYYY-MM-DD HH:mm' });
    expect(result.yAxisLabel).toBe('Count');
    expect(result.ordered.date).toBe(true);
    expect(result.ordered.interval.asHours()).toBe(1);
  });

  it('should extract unique x-axis values including gap-filled buckets', () => {
    const breakdownSeries = {
      breakdownField: 'category',
      series: [
        {
          breakdownValue: 'A',
          dataPoints: [
            [T0, 10],
            [T1, 20],
          ] as Array<[number, number]>,
        },
        {
          breakdownValue: 'B',
          dataPoints: [[T0, 30]] as Array<[number, number]>,
        },
      ],
    };

    const result = buildChartFromBreakdownSeries(breakdownSeries, createDimensions());

    // Gap filling produces all 4 hourly buckets
    expect(result.xAxisOrderedValues).toEqual([T0, T1, T2, T3]);
  });

  it('should handle empty series', () => {
    const breakdownSeries = {
      breakdownField: 'status',
      series: [],
    };

    const result = buildChartFromBreakdownSeries(breakdownSeries, createDimensions());

    expect(result.series).toEqual([]);
    expect(result.values).toEqual([]);
    expect(result.xAxisOrderedValues).toEqual([]);
  });
});
