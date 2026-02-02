/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildPointSeriesData,
  buildChartFromBreakdownSeries,
  Dimensions,
  Table,
} from './point_series';
import moment from 'moment';

describe('buildPointSeriesData', () => {
  it('should build the chart data from the table and dimensions', () => {
    const table: Table = {
      columns: [
        { id: 'x', name: 'X Axis' },
        { id: 'y', name: 'Y Axis' },
      ],
      rows: [
        { x: 10, y: 100 },
        { x: 20, y: 200 },
        { x: 10, y: 'NaN' }, // This row should be ignored
      ],
    };

    const dimensions: Dimensions = {
      x: {
        accessor: 0,
        format: { id: 'number', params: { pattern: 'number' } },
        params: {
          date: true,
          interval: moment.duration(1, 'hour'),
          intervalOpenSearchValue: 1,
          intervalOpenSearchUnit: 'h',
          format: 'number',
          bounds: {
            min: moment('2023-01-01T00:00:00Z'),
            max: moment('2023-01-02T00:00:00Z'),
          },
        },
      },
      y: {
        accessor: 1,
        format: { id: 'number', params: { pattern: 'number' } },
      },
    };

    const result = buildPointSeriesData(table, dimensions);

    expect(result.xAxisOrderedValues).toEqual([10, 20]);
    expect(result.xAxisFormat).toEqual(dimensions.x.format);
    expect(result.xAxisLabel).toEqual('X Axis');
    expect(result.ordered.date).toBe(true);
    expect(result.ordered.interval.asHours()).toBe(1);
    expect(result.ordered.intervalOpenSearchUnit).toBe('h');
    expect(result.ordered.intervalOpenSearchValue).toBe(1);
    expect(result.ordered.min.format()).toBe(moment('2023-01-01T00:00:00+00:00').format());
    expect(result.ordered.max.format()).toBe(moment('2023-01-02T00:00:00+00:00').format());
    expect(result.yAxisLabel).toEqual('Y Axis');
    expect(result.values).toEqual([
      { x: 10, y: 100 },
      { x: 20, y: 200 },
    ]);
  });
});

describe('buildChartFromBreakdownSeries', () => {
  const createDimensions = (): Dimensions => ({
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
          min: moment('2023-01-01T00:00:00Z'),
          max: moment('2023-01-02T00:00:00Z'),
        },
      },
    },
    y: {
      accessor: 1,
      format: { id: 'number', params: { pattern: 'number' } },
    },
  });

  it('should transform breakdown series to chart format', () => {
    const breakdownSeries = {
      breakdownField: 'status',
      series: [
        {
          breakdownValue: 'success',
          dataPoints: [
            [1672531200000, 10],
            [1672534800000, 20],
          ] as Array<[number, number]>,
        },
        {
          breakdownValue: 'error',
          dataPoints: [
            [1672531200000, 5],
            [1672534800000, 15],
          ] as Array<[number, number]>,
        },
      ],
    };

    const result = buildChartFromBreakdownSeries(breakdownSeries, createDimensions());

    expect(result.series).toHaveLength(2);
    expect(result.series![0].id).toBe('success');
    expect(result.series![0].name).toBe('success');
    expect(result.series![0].data).toEqual([
      { x: 1672531200000, y: 10 },
      { x: 1672534800000, y: 20 },
    ]);
    expect(result.series![1].id).toBe('error');
    expect(result.series![1].name).toBe('error');
  });

  it('should flatten all data points to values array', () => {
    const breakdownSeries = {
      breakdownField: 'region',
      series: [
        {
          breakdownValue: 'us-east',
          dataPoints: [[1672531200000, 100]] as Array<[number, number]>,
        },
        {
          breakdownValue: 'us-west',
          dataPoints: [[1672531200000, 200]] as Array<[number, number]>,
        },
      ],
    };

    const result = buildChartFromBreakdownSeries(breakdownSeries, createDimensions());

    expect(result.values).toEqual([
      { x: 1672531200000, y: 100 },
      { x: 1672531200000, y: 200 },
    ]);
  });

  it('should set correct axis properties', () => {
    const breakdownSeries = {
      breakdownField: 'type',
      series: [
        {
          breakdownValue: 'typeA',
          dataPoints: [[1672531200000, 50]] as Array<[number, number]>,
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

  it('should extract unique x-axis values', () => {
    const breakdownSeries = {
      breakdownField: 'category',
      series: [
        {
          breakdownValue: 'A',
          dataPoints: [
            [1672531200000, 10],
            [1672534800000, 20],
          ] as Array<[number, number]>,
        },
        {
          breakdownValue: 'B',
          dataPoints: [[1672531200000, 30]] as Array<[number, number]>,
        },
      ],
    };

    const result = buildChartFromBreakdownSeries(breakdownSeries, createDimensions());

    expect(result.xAxisOrderedValues).toEqual([1672531200000, 1672534800000]);
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
