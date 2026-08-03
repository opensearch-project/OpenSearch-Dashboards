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
import { getColors } from '../theme/default_colors';

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
  };

  const mockNumericColumn: VisColumn = {
    id: 1,
    name: 'Value',
    schema: VisFieldType.Numerical,
    column: 'value',
  };

  const mockNumericColumn2: VisColumn = {
    id: 2,
    name: 'Value2',
    schema: VisFieldType.Numerical,
    column: 'value2',
  };

  const mockCategoricalColumn: VisColumn = {
    id: 3,
    name: 'Category',
    schema: VisFieldType.Categorical,
    column: 'category',
  };

  const mockCategoricalColumn2: VisColumn = {
    id: 4,
    name: 'Category2',
    schema: VisFieldType.Categorical,
    column: 'category2',
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

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec).toHaveProperty('xAxis');
      expect(result.spec).toHaveProperty('yAxis');
    });

    it('produces line-type series', () => {
      const result = createSimpleLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);
      expect(result.spec.series[0].type).toBe('line');
    });

    it('emits series-target legend items while assigning metric colors', () => {
      const palette = getColors().categories;
      const result = createSimpleLineChart(mockData, mockStyles, mockAxisMappings);

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

  describe('createLineBarChart', () => {
    const mockAxisMappings = {
      [AxisRole.Y]: [mockNumericColumn],
      [AxisRole.X]: mockDateColumn,
      [AxisRole.Y_SECOND]: [mockNumericColumn2],
    };

    it('returns an ECharts spec with dataset and series', () => {
      const result = createLineBarChart(mockData, mockStyles, mockAxisMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series.length).toBeGreaterThanOrEqual(2);
    });

    it('emits legend items for line and bar series', () => {
      const palette = getColors().categories;
      const result = createLineBarChart(mockData, mockStyles, mockAxisMappings);

      expect(result.legendItems).toEqual([
        {
          label: 'Value',
          color: palette[0],
          target: { type: 'series', name: 'Value' },
        },
        {
          label: 'Value2',
          color: palette[1],
          target: { type: 'series', name: 'Value2' },
        },
      ]);
      expect(result.spec.series).toEqual([
        expect.objectContaining({
          type: 'line',
          name: 'Value',
          itemStyle: { color: palette[0] },
        }),
        expect.objectContaining({
          type: 'bar',
          name: 'Value2',
          itemStyle: { color: palette[1] },
        }),
      ]);
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

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);
    });

    it('uses provided full data when assigning color series colors', () => {
      const palette = getColors().categories;
      const result = createMultiLineChart(
        [
          { date: '2023-01-01', value: 10, category: 'A' },
          { date: '2023-01-02', value: 20, category: 'C' },
        ],
        mockStyles,
        mockAxisMappings,
        undefined,
        [
          { date: '2023-01-01', value: 10, category: 'A' },
          { date: '2023-01-02', value: 20, category: 'B' },
          { date: '2023-01-03', value: 30, category: 'C' },
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

  describe('createCategoryLineChart', () => {
    const mockAxisMappings = {
      [AxisRole.Y]: [mockNumericColumn],
      [AxisRole.X]: mockCategoricalColumn,
    };

    it('returns an ECharts spec for category-based line chart', () => {
      const result = createCategoryLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series[0].type).toBe('line');
    });

    it('emits series-target legend items for category-based metric lines', () => {
      const palette = getColors().categories;
      const result = createCategoryLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result.legendItems).toEqual([
        {
          label: 'Value',
          color: palette[0],
          target: { type: 'series', name: 'Value' },
        },
      ]);
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

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);
    });

    it('uses provided full data when assigning category color series colors', () => {
      const palette = getColors().categories;
      const result = createCategoryMultiLineChart(
        [
          { category: 'A', value: 10, category2: 'X' },
          { category: 'B', value: 20, category2: 'Z' },
        ],
        mockStyles,
        mockAxisMappings,
        [
          { category: 'A', value: 10, category2: 'X' },
          { category: 'B', value: 20, category2: 'Y' },
          { category: 'C', value: 30, category2: 'Z' },
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

      const result = createCategoryMultiLineChart(mockData, stylesWithThreshold, mockAxisMappings);

      const seriesWithMarkLine = result.spec.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });
  });
});
