/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createNumericalHistogramChart, createSingleHistogramChart } from './to_expression';
import { VisColumn, VisFieldType, AxisRole, AggregationType } from '../types';
import { defaultHistogramChartStyles } from './histogram_vis_config';

describe('Histogram to_expression', () => {
  const mockNumericalColumn: VisColumn = {
    id: 1,
    name: 'Count',
    column: 'count',
    schema: VisFieldType.Numerical,
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  const mockNumericalColumn2: VisColumn = {
    id: 2,
    name: 'Sum',
    column: 'sum',
    schema: VisFieldType.Numerical,
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  const mockData = [
    { count: 10, sum: 100 },
    { count: 20, sum: 200 },
    { count: 30, sum: 300 },
  ];

  describe('createSingleHistogramChart', () => {
    const mockAxisColumnMappings = {
      [AxisRole.X]: mockNumericalColumn,
    };

    it('returns an ECharts spec with dataset, series, and axes', () => {
      const spec = createSingleHistogramChart(
        mockData,
        [mockNumericalColumn],
        defaultHistogramChartStyles,
        mockAxisColumnMappings
      );

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec).toHaveProperty('xAxis');
      expect(spec).toHaveProperty('yAxis');
      expect(Array.isArray(spec.series)).toBe(true);
    });

    it('produces custom-type series for histogram rendering', () => {
      const spec = createSingleHistogramChart(
        mockData,
        [mockNumericalColumn],
        defaultHistogramChartStyles,
        mockAxisColumnMappings
      );

      const customSeries = spec.series.filter((s: any) => s.type === 'custom');
      expect(customSeries.length).toBeGreaterThanOrEqual(1);
    });

    it('throws when x axis is missing', () => {
      expect(() =>
        createSingleHistogramChart(mockData, [mockNumericalColumn], defaultHistogramChartStyles, {})
      ).toThrow('Missing axis config for Histogram chart');
    });
  });

  describe('createNumericalHistogramChart', () => {
    const mockAxisColumnMappings = {
      [AxisRole.X]: mockNumericalColumn,
      [AxisRole.Y]: mockNumericalColumn2,
    };

    it('returns an ECharts spec with dataset, series, and axes', () => {
      const spec = createNumericalHistogramChart(
        mockData,
        [mockNumericalColumn, mockNumericalColumn2],
        defaultHistogramChartStyles,
        mockAxisColumnMappings
      );

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec).toHaveProperty('xAxis');
      expect(spec).toHaveProperty('yAxis');
      expect(Array.isArray(spec.series)).toBe(true);
    });

    it('produces custom-type series for histogram rendering', () => {
      const spec = createNumericalHistogramChart(
        mockData,
        [mockNumericalColumn, mockNumericalColumn2],
        defaultHistogramChartStyles,
        mockAxisColumnMappings
      );

      const customSeries = spec.series.filter((s: any) => s.type === 'custom');
      expect(customSeries.length).toBeGreaterThanOrEqual(1);
    });

    it('throws when x axis is missing', () => {
      expect(() =>
        createNumericalHistogramChart(
          mockData,
          [mockNumericalColumn, mockNumericalColumn2],
          defaultHistogramChartStyles,
          {}
        )
      ).toThrow('Missing axis config for Histogram chart');
    });
  });
});
