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
import { getColors } from '../theme/default_colors';

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
  };

  const mockDateColumn: VisColumn = {
    id: 2,
    name: 'Date',
    schema: VisFieldType.Date,
    column: 'date',
  };

  const mockCategoricalColumns: VisColumn[] = [
    {
      id: 3,
      name: 'Category',
      schema: VisFieldType.Categorical,
      column: 'category',
    },
    {
      id: 4,
      name: 'Category2',
      schema: VisFieldType.Categorical,
      column: 'category2',
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

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec).toHaveProperty('xAxis');
      expect(result.spec).toHaveProperty('yAxis');
    });

    it('returns series with line type and area style', () => {
      const result = createSimpleAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);
      const mainSeries = result.spec.series[0];
      expect(mainSeries.type).toBe('line');
      expect(mainSeries).toHaveProperty('areaStyle');
    });

    it('emits series-target legend items while assigning metric colors', () => {
      const palette = getColors().categories;
      const result = createSimpleAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result.legendItems).toEqual([
        {
          label: 'Value',
          color: palette[0],
          target: { type: 'series', name: 'Value' },
        },
      ]);
      expect(result.spec.series[0]).toEqual(
        expect.objectContaining({
          name: 'Value',
          itemStyle: { color: palette[0] },
        })
      );
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

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);
    });

    it('uses provided full data when assigning color series colors', () => {
      const palette = getColors().categories;
      const result = createMultiAreaChart(
        [
          { date: '2023-01-01', value: 10, category: 'A' },
          { date: '2023-01-03', value: 15, category: 'C' },
        ],
        mockStyles,
        axisColumnMappings,
        undefined,
        [
          { date: '2023-01-01', value: 10, category: 'A' },
          { date: '2023-01-02', value: 20, category: 'B' },
          { date: '2023-01-03', value: 15, category: 'C' },
        ]
      );

      expect(result.spec.series).toEqual([
        expect.objectContaining({
          name: 'A',
          itemStyle: { color: palette[0] },
        }),
        expect.objectContaining({
          name: 'C',
          itemStyle: { color: palette[2] },
        }),
      ]);
      expect(result.legendItems.map((item) => item.color)).toEqual([palette[0], palette[2]]);
    });
  });

  describe('createCategoryAreaChart', () => {
    const axisColumnMappings = {
      [AxisRole.Y]: [mockNumericalColumn],
      [AxisRole.X]: mockCategoricalColumns[0],
    };

    it('returns an ECharts spec for category-based area chart', () => {
      const result = createCategoryAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);
    });

    it('emits series-target legend items for category-based metric areas', () => {
      const palette = getColors().categories;
      const result = createCategoryAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result.legendItems).toEqual([
        {
          label: 'Value',
          color: palette[0],
          target: { type: 'series', name: 'Value' },
        },
      ]);
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

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);

      // Verify stacked series
      const mainSeries = result.spec.series[0];
      expect(mainSeries.type).toBe('line');
      expect(mainSeries).toHaveProperty('areaStyle');
      expect(mainSeries).toHaveProperty('stack');
    });

    it('uses provided full data when assigning stacked color series colors', () => {
      const palette = getColors().categories;
      const result = createStackedAreaChart(
        [
          { category: 'A', value: 10, category2: 'X' },
          { category: 'C', value: 15, category2: 'Z' },
        ],
        mockStyles,
        axisColumnMappings,
        [
          { category: 'A', value: 10, category2: 'X' },
          { category: 'B', value: 20, category2: 'Y' },
          { category: 'C', value: 15, category2: 'Z' },
        ]
      );

      expect(result.spec.series).toEqual([
        expect.objectContaining({
          name: 'X',
          itemStyle: { color: palette[0] },
        }),
        expect.objectContaining({
          name: 'Z',
          itemStyle: { color: palette[2] },
        }),
      ]);
      expect(result.legendItems.map((item) => item.color)).toEqual([palette[0], palette[2]]);
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
      const seriesWithMarkLine = result.spec.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });
  });
});
