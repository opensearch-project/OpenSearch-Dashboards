/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { Chart } from './type';

describe('Chart interface', () => {
  it('should define a valid Chart object structure', () => {
    const mockChart: Chart = {
      values: [
        { x: 1609459200000, y: 10 },
        { x: 1609462800000, y: 15 },
      ],
      xAxisOrderedValues: [1609459200000, 1609462800000],
      xAxisFormat: { id: 'date', params: { pattern: 'YYYY-MM-DD' } },
      xAxisLabel: 'timestamp',
      yAxisLabel: 'Count',
      ordered: {
        date: true as const,
        interval: moment.duration(1, 'hour'),
        intervalOpenSearchUnit: 'h',
        intervalOpenSearchValue: 1,
        min: moment(1609459200000),
        max: moment(1609462800000),
      },
    };

    // Test that the Chart interface accepts valid data
    expect(mockChart.values).toHaveLength(2);
    expect(mockChart.xAxisOrderedValues).toHaveLength(2);
    expect(mockChart.xAxisLabel).toBe('timestamp');
    expect(mockChart.yAxisLabel).toBe('Count');
    expect(mockChart.ordered.date).toBe(true);
  });

  it('should allow optional yAxisLabel', () => {
    const chartWithoutYLabel: Chart = {
      values: [{ x: 1, y: 2 }],
      xAxisOrderedValues: [1],
      xAxisFormat: { id: 'number' },
      xAxisLabel: 'x-axis',
      ordered: {
        date: true as const,
        interval: moment.duration(1, 'minute'),
        intervalOpenSearchUnit: 'm',
        intervalOpenSearchValue: 1,
        min: moment(0),
        max: moment(10),
      },
    };

    expect(chartWithoutYLabel.yAxisLabel).toBeUndefined();
    expect(chartWithoutYLabel.xAxisLabel).toBe('x-axis');
  });

  it('should handle empty values array', () => {
    const emptyChart: Chart = {
      values: [],
      xAxisOrderedValues: [],
      xAxisFormat: { id: 'date' },
      xAxisLabel: 'time',
      ordered: {
        date: true as const,
        interval: moment.duration(1, 'hour'),
        intervalOpenSearchUnit: 'h',
        intervalOpenSearchValue: 1,
        min: moment(0),
        max: moment(0),
      },
    };

    expect(emptyChart.values).toHaveLength(0);
    expect(emptyChart.xAxisOrderedValues).toHaveLength(0);
  });
});
