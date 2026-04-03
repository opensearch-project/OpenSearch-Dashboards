/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createBarSpec,
  createStackedBarSpec,
  createTimeBarChart,
  createGroupedTimeBarChart,
  createFacetedTimeBarChart,
  createDoubleNumericalBarChart,
} from './to_expression';
import { defaultBarChartStyles, BarChartStyle } from './bar_vis_config';
import { VisColumn, VisFieldType, AxisRole, ThresholdMode, AggregationType } from '../types';

describe('bar to_expression', () => {
  const mockNumericalColumn: VisColumn = {
    id: 1,
    name: 'Count',
    column: 'count',
    schema: VisFieldType.Numerical,
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  const mockCategoricalColumn: VisColumn = {
    id: 2,
    name: 'Category',
    column: 'category',
    schema: VisFieldType.Categorical,
    validValuesCount: 100,
    uniqueValuesCount: 10,
  };

  const mockCategoricalColumn2: VisColumn = {
    id: 3,
    name: 'Category2',
    column: 'category2',
    schema: VisFieldType.Categorical,
    validValuesCount: 100,
    uniqueValuesCount: 10,
  };

  const mockDateColumn: VisColumn = {
    id: 4,
    name: 'Date',
    column: 'date',
    schema: VisFieldType.Date,
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  const mockData = [
    { count: 10, category: 'A', category2: 'X', date: '2023-01-01' },
    { count: 20, category: 'B', category2: 'Y', date: '2023-01-02' },
    { count: 30, category: 'C', category2: 'Z', date: '2023-01-03' },
  ];

  describe('createBarSpec', () => {
    test('creates an ECharts bar chart spec with dataset and series', () => {
      const spec = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        defaultBarChartStyles,
        { [AxisRole.X]: mockCategoricalColumn, [AxisRole.Y]: mockNumericalColumn }
      );

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec).toHaveProperty('xAxis');
      expect(spec).toHaveProperty('yAxis');
      expect(spec.series.length).toBeGreaterThanOrEqual(1);
      expect(spec.series[0].type).toBe('bar');
    });

    test('handles title display options', () => {
      const axisMappings = {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };

      const noTitleResult = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        { ...defaultBarChartStyles, titleOptions: { show: false, titleName: '' } },
        axisMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const defaultTitleResult = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        { ...defaultBarChartStyles, titleOptions: { show: true, titleName: '' } },
        axisMappings
      );
      expect(defaultTitleResult.title.text).toBe('Count by Category');

      const customTitleResult = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        {
          ...defaultBarChartStyles,
          titleOptions: { show: true, titleName: 'Custom Bar Chart Title' },
        },
        axisMappings
      );
      expect(customTitleResult.title.text).toBe('Custom Bar Chart Title');
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

      const spec = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        customStyles,
        { [AxisRole.X]: mockCategoricalColumn, [AxisRole.Y]: mockNumericalColumn }
      );

      const seriesWithMarkLine = spec.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });
  });

  describe('createStackedBarSpec', () => {
    test('creates a stacked bar chart ECharts spec', () => {
      const spec = createStackedBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [],
        defaultBarChartStyles,
        {
          [AxisRole.X]: mockCategoricalColumn,
          [AxisRole.Y]: mockNumericalColumn,
          [AxisRole.COLOR]: mockCategoricalColumn2,
        }
      );

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec.series.length).toBeGreaterThanOrEqual(1);
      expect(spec.series[0].type).toBe('bar');
    });

    test('handles title display options', () => {
      const axisMappings = {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn2,
      };

      const noTitleResult = createStackedBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [],
        { ...defaultBarChartStyles, titleOptions: { show: false, titleName: '' } },
        axisMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const defaultTitleResult = createStackedBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [],
        { ...defaultBarChartStyles, titleOptions: { show: true, titleName: '' } },
        axisMappings
      );
      expect(defaultTitleResult.title.text).toBe('Count by Category and Category2');

      const customTitleResult = createStackedBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [],
        {
          ...defaultBarChartStyles,
          titleOptions: { show: true, titleName: 'Custom Stacked Bar Chart' },
        },
        axisMappings
      );
      expect(customTitleResult.title.text).toBe('Custom Stacked Bar Chart');
    });
  });

  describe('createTimeBarChart', () => {
    test('creates a time bar chart ECharts spec', () => {
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };

      const spec = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        defaultBarChartStyles,
        axisMappings
      );

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec).toHaveProperty('xAxis');
      expect(spec).toHaveProperty('yAxis');
      expect(spec.series.length).toBeGreaterThanOrEqual(1);
      expect(spec.series[0].type).toBe('bar');
    });

    test('handles title display options', () => {
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };

      const noTitleResult = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        { ...defaultBarChartStyles, titleOptions: { show: false, titleName: '' } },
        axisMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const defaultTitleResult = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        { ...defaultBarChartStyles, titleOptions: { show: true, titleName: '' } },
        axisMappings
      );
      expect(defaultTitleResult.title.text).toBe('Count Over Time');

      const customTitleResult = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        {
          ...defaultBarChartStyles,
          titleOptions: { show: true, titleName: 'Custom Time Bar Chart' },
        },
        axisMappings
      );
      expect(customTitleResult.title.text).toBe('Custom Time Bar Chart');
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

      const spec = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        customStyles,
        { [AxisRole.X]: mockDateColumn, [AxisRole.Y]: mockNumericalColumn }
      );

      const seriesWithMarkLine = spec.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });

    describe('bucketing vs skip bucketing', () => {
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };

      // Timestamps within the same second — auto-inferred interval will bucket them together
      const sameBucketData = [
        { count: 10, category: 'A', date: '2023-01-01T08:00:00.100Z' },
        { count: 20, category: 'B', date: '2023-01-01T08:00:00.200Z' },
        { count: 30, category: 'C', date: '2023-01-01T08:00:00.300Z' },
      ];

      test('with bucketing, aggregates data into fewer rows', () => {
        const bucketedSpec = createTimeBarChart(
          sameBucketData,
          [mockNumericalColumn],
          [mockDateColumn],
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

        const noBucketSpec = createTimeBarChart(
          sameBucketData,
          [mockNumericalColumn],
          [mockDateColumn],
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

      const spec = createGroupedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [mockDateColumn],
        defaultBarChartStyles,
        axisMappings
      );

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec.series.length).toBeGreaterThanOrEqual(1);
      expect(spec.series[0].type).toBe('bar');
    });

    test('handles title display options', () => {
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
      };

      const noTitleResult = createGroupedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [mockDateColumn],
        { ...defaultBarChartStyles, titleOptions: { show: false, titleName: '' } },
        axisMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const defaultTitleResult = createGroupedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [mockDateColumn],
        { ...defaultBarChartStyles, titleOptions: { show: true, titleName: '' } },
        axisMappings
      );
      expect(defaultTitleResult.title.text).toBe('Count Over Time by Category');
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
        const bucketedSpec = createGroupedTimeBarChart(
          sameBucketData,
          [mockNumericalColumn],
          [mockCategoricalColumn],
          [mockDateColumn],
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

        const noBucketSpec = createGroupedTimeBarChart(
          sameBucketData,
          [mockNumericalColumn],
          [mockCategoricalColumn],
          [mockDateColumn],
          noBucketStyles,
          axisMappings
        );

        // No bucketing: pivot groups by raw timestamp strings (3 unique = header + 3 data rows)
        expect(noBucketSpec.dataset.source.length).toBe(4);
      });
    });
  });

  describe('createFacetedTimeBarChart', () => {
    test('creates a faceted time bar chart ECharts spec', () => {
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
        [AxisRole.FACET]: mockCategoricalColumn2,
      };

      const spec = createFacetedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [mockDateColumn],
        defaultBarChartStyles,
        axisMappings
      );

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec.series.length).toBeGreaterThanOrEqual(1);
    });

    test('handles title display options', () => {
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
        [AxisRole.FACET]: mockCategoricalColumn2,
      };

      const noTitleResult = createFacetedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [mockDateColumn],
        { ...defaultBarChartStyles, titleOptions: { show: false, titleName: '' } },
        axisMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const defaultTitleResult = createFacetedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [mockDateColumn],
        { ...defaultBarChartStyles, titleOptions: { show: true, titleName: '' } },
        axisMappings
      );
      expect(defaultTitleResult.title.text).toBe(
        'Count Over Time by Category (Faceted by Category2)'
      );
    });

    describe('bucketing vs skip bucketing', () => {
      // Timestamps within the same second — auto-inferred interval will bucket them together
      const sameBucketData = [
        { count: 10, category: 'A', category2: 'X', date: '2023-01-01T08:00:00.100Z' },
        { count: 20, category: 'B', category2: 'X', date: '2023-01-01T08:00:00.200Z' },
        { count: 30, category: 'A', category2: 'Y', date: '2023-01-01T08:00:00.300Z' },
      ];
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
        [AxisRole.FACET]: mockCategoricalColumn2,
      };

      test('with bucketing, merges same-bucket timestamps within each facet', () => {
        const spec = createFacetedTimeBarChart(
          sameBucketData,
          [mockNumericalColumn],
          [mockCategoricalColumn, mockCategoricalColumn2],
          [mockDateColumn],
          defaultBarChartStyles,
          axisMappings
        );

        const bucketedTotalRows = spec.dataset.reduce(
          (sum: number, ds: any) => sum + ds.source.length - 1,
          0
        );

        // Each facet: bucketing merges timestamps into 1 row per facet
        expect(bucketedTotalRows).toBe(spec.dataset.length);
      });

      test('without bucketing, preserves raw timestamps within each facet', () => {
        const noBucketStyles: BarChartStyle = {
          ...defaultBarChartStyles,
          bucket: { ...defaultBarChartStyles.bucket, aggregationType: AggregationType.NONE },
        };

        const noBucketSpec = createFacetedTimeBarChart(
          sameBucketData,
          [mockNumericalColumn],
          [mockCategoricalColumn, mockCategoricalColumn2],
          [mockDateColumn],
          noBucketStyles,
          axisMappings
        );

        const unbucketedTotalRows = noBucketSpec.dataset.reduce(
          (sum: number, ds: any) => sum + ds.source.length - 1,
          0
        );

        // No bucketing: raw timestamps preserved, more data rows than facet count
        expect(unbucketedTotalRows).toBeGreaterThan(noBucketSpec.dataset.length);
      });
    });
  });

  describe('createDoubleNumericalBarChart', () => {
    const mockNumericalColumn2: VisColumn = {
      id: 5,
      name: 'sum',
      column: 'sum',
      schema: VisFieldType.Numerical,
      validValuesCount: 100,
      uniqueValuesCount: 50,
    };

    test('creates a double numerical bar chart ECharts spec', () => {
      const spec = createDoubleNumericalBarChart(
        mockData,
        [mockNumericalColumn, mockNumericalColumn2],
        defaultBarChartStyles,
        { [AxisRole.X]: mockNumericalColumn, [AxisRole.Y]: mockNumericalColumn2 }
      );

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec.series.length).toBeGreaterThanOrEqual(1);
      expect(spec.series[0].type).toBe('bar');
    });
  });
});
