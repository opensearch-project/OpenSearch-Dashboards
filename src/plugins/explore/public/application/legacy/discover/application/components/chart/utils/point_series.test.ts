/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildPointSeriesData, Dimensions, Table } from './point_series';
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
