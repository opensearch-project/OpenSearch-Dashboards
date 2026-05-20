/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSimpleLineChart,
  createLineBarChart,
  createMultiLineChart,
  createCategoryLineChart,
  createCategoryMultiLineChart,
} from './to_expression';
import { VisColumn, VisFieldType, ThresholdMode, Positions, AxisRole } from '../types';
import { defaultLineChartStyles } from './line_vis_config';

describe('Line Chart to_expression', () => {
  const mockData = [
    { date: '2023-01-01', value: 10, value2: 5, category: 'A', category2: 'X' },
    { date: '2023-01-02', value: 20, value2: 15, category: 'B', category2: 'Y' },
    { date: '2023-01-03', value: 15, value2: 10, category: 'A', category2: 'X' },
  ];

  const mockDateColumn: VisColumn = {
    id: 0,
    name: 'Date',
    schema: VisFieldType.Date,
    column: 'date',
    validValuesCount: 3,
    uniqueValuesCount: 3,
  };

  const mockNumericColumn: VisColumn = {
    id: 1,
    name: 'Value',
    schema: VisFieldType.Numerical,
    column: 'value',
    validValuesCount: 3,
    uniqueValuesCount: 3,
  };

  const mockNumericColumn2: VisColumn = {
    id: 2,
    name: 'Value2',
    schema: VisFieldType.Numerical,
    column: 'value2',
    validValuesCount: 3,
    uniqueValuesCount: 3,
  };

  const mockCategoricalColumn: VisColumn = {
    id: 3,
    name: 'Category',
    schema: VisFieldType.Categorical,
    column: 'category',
    validValuesCount: 3,
    uniqueValuesCount: 2,
  };

  const mockCategoricalColumn2: VisColumn = {
    id: 4,
    name: 'Category2',
    schema: VisFieldType.Categorical,
    column: 'category2',
    validValuesCount: 3,
    uniqueValuesCount: 2,
  };

  const mockStyles = {
    ...defaultLineChartStyles,
    addLegend: true,
    legendPosition: Positions.RIGHT,
    thresholdOptions: {
      baseColor: '#00BD6B',
      thresholds: [],
      thresholdStyle: ThresholdMode.Off,
    },
    showFullTimeRange: false,
  };

  describe('createSimpleLineChart', () => {
    const mockAxisMappings = {
      [AxisRole.Y]: [mockNumericColumn],
      [AxisRole.X]: mockDateColumn,
    };

    it('returns an ECharts spec with dataset, series, and axes', () => {
      const result = createSimpleLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result).toHaveProperty('xAxis');
      expect(result).toHaveProperty('yAxis');
    });

    it('produces line-type series', () => {
      const result = createSimpleLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result.series.length).toBeGreaterThanOrEqual(1);
      expect(result.series[0].type).toBe('line');
    });
  });

  describe('createLineBarChart', () => {
    const mockAxisMappings = {
      [AxisRole.Y]: [mockNumericColumn],
      [AxisRole.X]: mockDateColumn,
      [AxisRole.Y_SECOND]: [mockNumericColumn2],
    };

    it('returns an ECharts spec with dataset and series', () => {
      const result = createLineBarChart(mockData, mockStyles, mockAxisMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.series.length).toBeGreaterThanOrEqual(2);
    });

    it('throws when axis config is missing', () => {
      expect(() => createLineBarChart(mockData, mockStyles, {} as any)).toThrow();
    });
  });

  describe('createMultiLineChart', () => {
    const mockAxisMappings = {
      [AxisRole.Y]: mockNumericColumn,
      [AxisRole.X]: mockDateColumn,
      [AxisRole.COLOR]: mockCategoricalColumn,
    };

    it('returns an ECharts spec with multiple series', () => {
      const result = createMultiLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.series.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('createCategoryLineChart', () => {
    const mockAxisMappings = {
      [AxisRole.Y]: [mockNumericColumn],
      [AxisRole.X]: mockCategoricalColumn,
    };

    it('returns an ECharts spec for category-based line chart', () => {
      const result = createCategoryLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.series[0].type).toBe('line');
    });
  });

  describe('createCategoryMultiLineChart', () => {
    const mockAxisMappings = {
      [AxisRole.Y]: mockNumericColumn,
      [AxisRole.X]: mockCategoricalColumn,
      [AxisRole.COLOR]: mockCategoricalColumn2,
    };

    it('returns an ECharts spec with multiple category-based series', () => {
      const result = createCategoryMultiLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.series.length).toBeGreaterThanOrEqual(1);
    });

    it('includes markLine for threshold when enabled', () => {
      const stylesWithThreshold = {
        ...mockStyles,
        thresholdOptions: {
          baseColor: '#00BD6B',
          thresholds: [{ value: 15, color: '#E7664C' }],
          thresholdStyle: ThresholdMode.Solid,
        },
      };

      const result = createCategoryMultiLineChart(mockData, stylesWithThreshold, mockAxisMappings);

      const seriesWithMarkLine = result.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });
  });
});
