/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createBarSpec,
  createStackedBarSpec,
  createTimeBarChart,
  createGroupedTimeBarChart,
  createDoubleNumericalBarChart,
} from './to_expression';
import { BarChartStyle, defaultBarChartStyles } from './bar_vis_config';
import { VisColumn, VisFieldType, AxisRole, ThresholdMode, AggregationType } from '../types';
import { getColors } from '../theme/default_colors';
import { DEFAULT_BAR_FILL_OPACITY } from '../style_panel/share';

describe('bar to_expression', () => {
  const mockNumericalColumn: VisColumn = {
    id: 1,
    name: 'Count',
    column: 'count',
    schema: VisFieldType.Numerical,
  };

  const mockCategoricalColumn: VisColumn = {
    id: 2,
    name: 'Category',
    column: 'category',
    schema: VisFieldType.Categorical,
  };

  const mockCategoricalColumn2: VisColumn = {
    id: 3,
    name: 'Category2',
    column: 'category2',
    schema: VisFieldType.Categorical,
  };

  const mockDateColumn: VisColumn = {
    id: 4,
    name: 'Date',
    column: 'date',
    schema: VisFieldType.Date,
  };

  const mockData = [
    { count: 10, category: 'A', category2: 'X', date: '2023-01-01' },
    { count: 20, category: 'B', category2: 'Y', date: '2023-01-02' },
    { count: 30, category: 'C', category2: 'Z', date: '2023-01-03' },
  ];

  describe('createBarSpec', () => {
    test('creates an ECharts bar chart spec with dataset and series', () => {
      const { spec, legendItems } = createBarSpec(mockData, defaultBarChartStyles, {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: [mockNumericalColumn],
      });

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec).toHaveProperty('xAxis');
      expect(spec).toHaveProperty('yAxis');
      expect(spec.series.length).toBeGreaterThanOrEqual(1);
      expect(spec.series[0].type).toBe('bar');
      expect(legendItems).toEqual([
        {
          label: 'Count',
          color: getColors().categories[0],
          target: { type: 'series', name: 'Count' },
        },
      ]);
    });

    test('includes markLine for threshold when enabled', () => {
      const customStyles = {
        ...defaultBarChartStyles,
        thresholdOptions: {
          baseColor: '#00BD6B',
          thresholds: [{ value: 15, color: '#00FF00' }],
          thresholdStyle: ThresholdMode.Solid,
        },
      };

      const { spec } = createBarSpec(mockData, customStyles, {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: [mockNumericalColumn],
      });

      const seriesWithMarkLine = spec.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });

    describe('fill opacity', () => {
      const opacityOf = (styles: Partial<BarChartStyle>) =>
        createBarSpec(
          mockData,
          { ...defaultBarChartStyles, ...styles },
          {
            [AxisRole.X]: mockCategoricalColumn,
            [AxisRole.Y]: [mockNumericalColumn],
          }
        ).spec.series[0].itemStyle.opacity;

      test('applies fillOpacity as a fraction of the 0-100 percentage', () => {
        expect(opacityOf({ fillOpacity: 80 })).toBe(0.8);
      });

      test('falls back to the default fill opacity when fillOpacity is unset', () => {
        expect(opacityOf({ fillOpacity: undefined })).toBe(DEFAULT_BAR_FILL_OPACITY / 100);
      });
    });
  });

  describe('createStackedBarSpec', () => {
    test('creates a stacked bar chart ECharts spec', () => {
      const { spec, legendItems } = createStackedBarSpec(mockData, defaultBarChartStyles, {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn2,
      });

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec.series.length).toBeGreaterThanOrEqual(1);
      expect(spec.series[0].type).toBe('bar');
      expect(legendItems).toEqual([
        {
          label: 'X',
          color: getColors().categories[0],
          target: { type: 'series', name: 'X' },
        },
        {
          label: 'Y',
          color: getColors().categories[1],
          target: { type: 'series', name: 'Y' },
        },
        {
          label: 'Z',
          color: getColors().categories[2],
          target: { type: 'series', name: 'Z' },
        },
      ]);
    });

    test('uses provided full data when assigning stacked series colors', () => {
      const palette = getColors().categories;
      const result = createStackedBarSpec(
        [
          { count: 10, category: 'A', category2: 'X' },
          { count: 30, category: 'C', category2: 'Z' },
        ],
        defaultBarChartStyles,
        {
          [AxisRole.X]: mockCategoricalColumn,
          [AxisRole.Y]: mockNumericalColumn,
          [AxisRole.COLOR]: mockCategoricalColumn2,
        },
        [
          { count: 10, category: 'A', category2: 'X' },
          { count: 20, category: 'B', category2: 'Y' },
          { count: 30, category: 'C', category2: 'Z' },
        ]
      );

      expect(result.spec.series).toEqual([
        expect.objectContaining({
          name: 'X',
          itemStyle: expect.objectContaining({ color: palette[0] }),
        }),
        expect.objectContaining({
          name: 'Z',
          itemStyle: expect.objectContaining({ color: palette[2] }),
        }),
      ]);
      expect(result.legendItems.map((item) => item.color)).toEqual([palette[0], palette[2]]);
    });
  });

  describe('createTimeBarChart', () => {
    test('creates a time bar chart ECharts spec', () => {
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: [mockNumericalColumn],
      };

      const { spec, legendItems } = createTimeBarChart(
        mockData,
        defaultBarChartStyles,
        axisMappings
      );

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec).toHaveProperty('xAxis');
      expect(spec).toHaveProperty('yAxis');
      expect(spec.series.length).toBeGreaterThanOrEqual(1);
      expect(spec.series[0].type).toBe('bar');
      expect(legendItems).toEqual([
        {
          label: 'Count',
          color: getColors().categories[0],
          target: { type: 'series', name: 'Count' },
        },
      ]);
    });

    test('includes markLine for threshold when enabled', () => {
      const customStyles = {
        ...defaultBarChartStyles,
        thresholdOptions: {
          baseColor: '#00BD6B',
          thresholds: [{ value: 15, color: '#00FF00' }],
          thresholdStyle: ThresholdMode.Solid,
        },
      };

      const { spec } = createTimeBarChart(mockData, customStyles, {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: [mockNumericalColumn],
      });

      const seriesWithMarkLine = spec.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });

    describe('bucketing vs skip bucketing', () => {
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: [mockNumericalColumn],
      };

      // Timestamps within the same second — auto-inferred interval will bucket them together
      const sameBucketData = [
        { count: 10, category: 'A', date: '2023-01-01T08:00:00.100Z' },
        { count: 20, category: 'B', date: '2023-01-01T08:00:00.200Z' },
        { count: 30, category: 'C', date: '2023-01-01T08:00:00.300Z' },
      ];

      test('with bucketing, aggregates data into fewer rows', () => {
        const { spec: bucketedSpec } = createTimeBarChart(
          sameBucketData,
          defaultBarChartStyles,
          axisMappings
        );

        // Bucketing merges all 3 into 1 row (same second bucket): header + 1 data row
        expect(bucketedSpec.dataset.source.length).toBe(2);
      });

      test('without bucketing, preserves all raw data points', () => {
        const noBucketStyles: BarChartStyle = {
          ...defaultBarChartStyles,
          bucket: { ...defaultBarChartStyles.bucket, aggregationType: AggregationType.NONE },
        };

        const { spec: noBucketSpec } = createTimeBarChart(
          sameBucketData,
          noBucketStyles,
          axisMappings
        );

        // No bucketing: all 3 raw data points preserved (header + 3 data rows)
        expect(noBucketSpec.dataset.source.length).toBe(4);
      });
    });
  });

  describe('createGroupedTimeBarChart', () => {
    test('creates a grouped time bar chart ECharts spec', () => {
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
      };

      const { spec, legendItems } = createGroupedTimeBarChart(
        mockData,
        defaultBarChartStyles,
        axisMappings
      );

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec.series.length).toBeGreaterThanOrEqual(1);
      expect(spec.series[0].type).toBe('bar');
      expect(legendItems).toEqual([
        {
          label: 'A',
          color: getColors().categories[0],
          target: { type: 'series', name: 'A' },
        },
        {
          label: 'B',
          color: getColors().categories[1],
          target: { type: 'series', name: 'B' },
        },
        {
          label: 'C',
          color: getColors().categories[2],
          target: { type: 'series', name: 'C' },
        },
      ]);
    });

    test('uses provided full data when assigning grouped time series colors', () => {
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
      };
      const palette = getColors().categories;
      const result = createGroupedTimeBarChart(
        [
          { count: 10, category: 'A', date: '2023-01-01' },
          { count: 30, category: 'C', date: '2023-01-03' },
        ],
        defaultBarChartStyles,
        axisMappings,
        undefined,
        [
          { count: 10, category: 'A', date: '2023-01-01' },
          { count: 20, category: 'B', date: '2023-01-02' },
          { count: 30, category: 'C', date: '2023-01-03' },
        ]
      );

      expect(result.spec.series).toEqual([
        expect.objectContaining({
          name: 'A',
          itemStyle: expect.objectContaining({ color: palette[0] }),
        }),
        expect.objectContaining({
          name: 'C',
          itemStyle: expect.objectContaining({ color: palette[2] }),
        }),
      ]);
      expect(result.legendItems.map((item) => item.color)).toEqual([palette[0], palette[2]]);
    });

    describe('bucketing vs skip bucketing', () => {
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
      };

      // Timestamps within the same second — auto-inferred interval will bucket them together
      const sameBucketData = [
        { count: 10, category: 'A', date: '2023-01-01T08:00:00.100Z' },
        { count: 20, category: 'B', date: '2023-01-01T08:00:00.200Z' },
        { count: 30, category: 'A', date: '2023-01-01T08:00:00.300Z' },
      ];

      test('with bucketing, merges same-bucket timestamps into fewer rows', () => {
        const { spec: bucketedSpec } = createGroupedTimeBarChart(
          sameBucketData,
          defaultBarChartStyles,
          axisMappings
        );

        // Bucketing merges all 3 into 1 time bucket: header + 1 data row
        expect(bucketedSpec.dataset.source.length).toBe(2);
      });

      test('without bucketing, preserves all raw timestamps', () => {
        const noBucketStyles: BarChartStyle = {
          ...defaultBarChartStyles,
          bucket: { ...defaultBarChartStyles.bucket, aggregationType: AggregationType.NONE },
        };

        const { spec: noBucketSpec } = createGroupedTimeBarChart(
          sameBucketData,
          noBucketStyles,
          axisMappings
        );

        // No bucketing: pivot groups by raw timestamp strings (3 unique = header + 3 data rows)
        expect(noBucketSpec.dataset.source.length).toBe(4);
      });
    });
  });

  describe('createDoubleNumericalBarChart', () => {
    const mockNumericalColumn2: VisColumn = {
      id: 5,
      name: 'sum',
      column: 'sum',
      schema: VisFieldType.Numerical,
    };

    test('creates a double numerical bar chart ECharts spec', () => {
      const { spec, legendItems } = createDoubleNumericalBarChart(mockData, defaultBarChartStyles, {
        [AxisRole.X]: mockNumericalColumn,
        [AxisRole.Y]: [mockNumericalColumn2],
      });

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec.series.length).toBeGreaterThanOrEqual(1);
      expect(spec.series[0].type).toBe('bar');
      expect(legendItems).toEqual([
        {
          label: 'sum',
          color: getColors().categories[0],
          target: { type: 'series', name: 'sum' },
        },
      ]);
    });
  });
});
