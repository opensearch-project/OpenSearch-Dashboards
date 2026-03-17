/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSingleMetric } from './to_expression';
import { VisColumn, VisFieldType, AxisRole, AxisColumnMappings } from '../types';
import { defaultMetricChartStyles, MetricChartStyle } from './metric_vis_config';

describe('Metric to_expression', () => {
  const mockData = [{ value: 100 }, { value: 200 }];

  const numericColumn: VisColumn = {
    id: 1,
    name: 'Value',
    schema: VisFieldType.Numerical,
    column: 'value',
    validValuesCount: 2,
    uniqueValuesCount: 2,
  };

  const dateColumn: VisColumn = {
    id: 2,
    name: 'Date',
    schema: VisFieldType.Date,
    column: 'date',
    validValuesCount: 2,
    uniqueValuesCount: 2,
  };

  const mockStyles: MetricChartStyle = {
    ...defaultMetricChartStyles,
    showTitle: true,
    title: 'Test Metric',
  };

  describe('createSingleMetric', () => {
    it('returns result with spec, name, and data', () => {
      const mockAxisMappings: AxisColumnMappings = {
        [AxisRole.Value]: numericColumn,
      };

      const result = createSingleMetric(
        mockData,
        [numericColumn],
        [],
        [],
        mockStyles,
        mockAxisMappings
      );

      expect(result).toHaveProperty('name', 'Value');
      expect(result).toHaveProperty('data', mockData);
      expect(result).toHaveProperty('spec');
      expect(result.spec).toBeUndefined();
    });

    it('adds sparkline series when date column is provided', () => {
      const timeSeriesData = [
        { value: 100, date: '2023-01-01' },
        { value: 200, date: '2023-01-02' },
      ];

      const mockAxisMappings: AxisColumnMappings = {
        [AxisRole.Value]: numericColumn,
        [AxisRole.Time]: dateColumn,
      };

      const result = createSingleMetric(
        timeSeriesData,
        [numericColumn],
        [],
        [dateColumn],
        mockStyles,
        mockAxisMappings
      );

      expect(result.spec).toBeDefined();
      expect(result.spec).toHaveProperty('series');
      const lineSeries = (result.spec?.series as any[])?.filter((s: any) => s.type === 'line');
      expect(lineSeries?.length).toBeGreaterThanOrEqual(1);
    });

    it('does not include line series when no date column', () => {
      const mockAxisMappings: AxisColumnMappings = {
        [AxisRole.Value]: numericColumn,
      };

      const result = createSingleMetric(
        mockData,
        [numericColumn],
        [],
        [],
        mockStyles,
        mockAxisMappings
      );

      expect(result.spec).toBeUndefined();
    });

    it('throws when no value column is provided', () => {
      expect(() => createSingleMetric(mockData, [numericColumn], [], [], mockStyles, {})).toThrow(
        'Missing value for metric chart'
      );
    });
  });
});
