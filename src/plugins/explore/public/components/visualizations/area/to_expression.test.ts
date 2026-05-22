/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSimpleAreaChart,
  createMultiAreaChart,
  createCategoryAreaChart,
  createStackedAreaChart,
} from './to_expression';
import { VisColumn, VisFieldType, ThresholdMode, Positions, AxisRole } from '../types';
import { AreaChartStyle } from './area_vis_config';

describe('Area Chart to_expression', () => {
  const mockTransformedData = [
    { date: '2023-01-01', value: 10, category: 'A', category2: 'X' },
    { date: '2023-01-02', value: 20, category: 'A', category2: 'X' },
    { date: '2023-01-03', value: 15, category: 'A', category2: 'X' },
    { date: '2023-01-01', value: 5, category: 'B', category2: 'Y' },
    { date: '2023-01-02', value: 15, category: 'B', category2: 'Y' },
    { date: '2023-01-03', value: 25, category: 'B', category2: 'Y' },
  ];

  const mockNumericalColumn: VisColumn = {
    id: 1,
    name: 'Value',
    schema: VisFieldType.Numerical,
    column: 'value',
    validValuesCount: 6,
    uniqueValuesCount: 5,
  };

  const mockDateColumn: VisColumn = {
    id: 2,
    name: 'Date',
    schema: VisFieldType.Date,
    column: 'date',
    validValuesCount: 6,
    uniqueValuesCount: 3,
  };

  const mockCategoricalColumns: VisColumn[] = [
    {
      id: 3,
      name: 'Category',
      schema: VisFieldType.Categorical,
      column: 'category',
      validValuesCount: 6,
      uniqueValuesCount: 2,
    },
    {
      id: 4,
      name: 'Category2',
      schema: VisFieldType.Categorical,
      column: 'category2',
      validValuesCount: 6,
      uniqueValuesCount: 2,
    },
  ];

  const mockStyles: AreaChartStyle = {
    addLegend: true,
    legendPosition: Positions.RIGHT,
    addTimeMarker: false,
    areaOpacity: 0.6,
    tooltipOptions: {
      mode: 'all',
    },
    thresholdOptions: {
      baseColor: '#00BD6B',
      thresholds: [],
      thresholdStyle: ThresholdMode.Solid,
    },
    standardAxes: [],
    showFullTimeRange: false,
  };

  describe('createSimpleAreaChart', () => {
    const axisColumnMappings = {
      [AxisRole.Y]: [mockNumericalColumn],
      [AxisRole.X]: mockDateColumn,
    };

    it('returns an ECharts spec with dataset, series, and axes', () => {
      const result = createSimpleAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result).toHaveProperty('xAxis');
      expect(result).toHaveProperty('yAxis');
    });

    it('returns series with line type and area style', () => {
      const result = createSimpleAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result.series.length).toBeGreaterThanOrEqual(1);
      const mainSeries = result.series[0];
      expect(mainSeries.type).toBe('line');
      expect(mainSeries).toHaveProperty('areaStyle');
    });
  });

  describe('createMultiAreaChart', () => {
    const axisColumnMappings = {
      [AxisRole.Y]: mockNumericalColumn,
      [AxisRole.X]: mockDateColumn,
      [AxisRole.COLOR]: mockCategoricalColumns[0],
    };

    it('returns an ECharts spec with multiple series for each category', () => {
      const result = createMultiAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.series.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('createCategoryAreaChart', () => {
    const axisColumnMappings = {
      [AxisRole.Y]: [mockNumericalColumn],
      [AxisRole.X]: mockCategoricalColumns[0],
    };

    it('returns an ECharts spec for category-based area chart', () => {
      const result = createCategoryAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.series.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('createStackedAreaChart', () => {
    const axisColumnMappings = {
      [AxisRole.Y]: mockNumericalColumn,
      [AxisRole.X]: mockCategoricalColumns[0],
      [AxisRole.COLOR]: mockCategoricalColumns[1],
    };

    it('returns an ECharts spec with stacked series', () => {
      const result = createStackedAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.series.length).toBeGreaterThanOrEqual(1);

      // Verify stacked series
      const mainSeries = result.series[0];
      expect(mainSeries.type).toBe('line');
      expect(mainSeries).toHaveProperty('areaStyle');
      expect(mainSeries).toHaveProperty('stack');
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

      const result = createStackedAreaChart(
        mockTransformedData,
        stylesWithThreshold,
        axisColumnMappings
      );

      // ECharts uses markLine within series for thresholds
      const seriesWithMarkLine = result.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });
  });
});
