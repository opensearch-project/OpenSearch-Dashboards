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
import { defaultBarChartStyles } from './bar_vis_config';
import { VisColumn, VisFieldType, AxisRole, ThresholdMode } from '../types';

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
      const spec = createBarSpec(mockData, defaultBarChartStyles, {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: mockNumericalColumn,
      });

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
        { ...defaultBarChartStyles, titleOptions: { show: false, titleName: '' } },
        axisMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const defaultTitleResult = createBarSpec(
        mockData,
        { ...defaultBarChartStyles, titleOptions: { show: true, titleName: '' } },
        axisMappings
      );
      expect(defaultTitleResult.title.text).toBe('Count by Category');

      const customTitleResult = createBarSpec(
        mockData,
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

      const spec = createBarSpec(mockData, customStyles, {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: mockNumericalColumn,
      });

      const seriesWithMarkLine = spec.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });
  });

  describe('createStackedBarSpec', () => {
    test('creates a stacked bar chart ECharts spec', () => {
      const spec = createStackedBarSpec(mockData, defaultBarChartStyles, {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn2,
      });

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
        { ...defaultBarChartStyles, titleOptions: { show: false, titleName: '' } },
        axisMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const defaultTitleResult = createStackedBarSpec(
        mockData,
        { ...defaultBarChartStyles, titleOptions: { show: true, titleName: '' } },
        axisMappings
      );
      expect(defaultTitleResult.title.text).toBe('Count by Category and Category2');

      const customTitleResult = createStackedBarSpec(
        mockData,
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

      const spec = createTimeBarChart(mockData, defaultBarChartStyles, axisMappings);

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
        { ...defaultBarChartStyles, titleOptions: { show: false, titleName: '' } },
        axisMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const defaultTitleResult = createTimeBarChart(
        mockData,
        { ...defaultBarChartStyles, titleOptions: { show: true, titleName: '' } },
        axisMappings
      );
      expect(defaultTitleResult.title.text).toBe('Count Over Time');

      const customTitleResult = createTimeBarChart(
        mockData,
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

      const spec = createTimeBarChart(mockData, customStyles, {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      });

      const seriesWithMarkLine = spec.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });
  });

  describe('createGroupedTimeBarChart', () => {
    test('creates a grouped time bar chart ECharts spec', () => {
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
      };

      const spec = createGroupedTimeBarChart(mockData, defaultBarChartStyles, axisMappings);

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
        { ...defaultBarChartStyles, titleOptions: { show: false, titleName: '' } },
        axisMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const defaultTitleResult = createGroupedTimeBarChart(
        mockData,
        { ...defaultBarChartStyles, titleOptions: { show: true, titleName: '' } },
        axisMappings
      );
      expect(defaultTitleResult.title.text).toBe('Count Over Time by Category');
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

      const spec = createFacetedTimeBarChart(mockData, defaultBarChartStyles, axisMappings);

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
        { ...defaultBarChartStyles, titleOptions: { show: false, titleName: '' } },
        axisMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const defaultTitleResult = createFacetedTimeBarChart(
        mockData,
        { ...defaultBarChartStyles, titleOptions: { show: true, titleName: '' } },
        axisMappings
      );
      expect(defaultTitleResult.title.text).toBe(
        'Count Over Time by Category (Faceted by Category2)'
      );
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
      const spec = createDoubleNumericalBarChart(mockData, defaultBarChartStyles, {
        [AxisRole.X]: mockNumericalColumn,
        [AxisRole.Y]: mockNumericalColumn2,
      });

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec.series.length).toBeGreaterThanOrEqual(1);
      expect(spec.series[0].type).toBe('bar');
    });
  });
});
