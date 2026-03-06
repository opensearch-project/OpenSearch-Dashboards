/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSimpleAreaChart,
  createMultiAreaChart,
  createFacetedMultiAreaChart,
  createCategoryAreaChart,
  createStackedAreaChart,
} from './to_expression';
import {
  VisColumn,
  VisFieldType,
  ThresholdMode,
  Positions,
  AxisRole,
  AxisColumnMappings,
} from '../types';
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

  const mockNumericalColumns: VisColumn[] = [
    {
      id: 1,
      name: 'Value',
      schema: VisFieldType.Numerical,
      column: 'value',
      validValuesCount: 6,
      uniqueValuesCount: 5,
    },
  ];

  const mockDateColumns: VisColumn[] = [
    {
      id: 2,
      name: 'Date',
      schema: VisFieldType.Date,
      column: 'date',
      validValuesCount: 6,
      uniqueValuesCount: 3,
    },
  ];

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
    titleOptions: {
      show: true,
      titleName: '',
    },
    standardAxes: [],
    showFullTimeRange: false,
  };

  const mockTimeRange = {
    from: '2023-01-01',
    to: '2023-01-04',
  };

  describe('createSimpleAreaChart', () => {
    it('returns an ECharts spec with dataset, series, and axes', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
      };

      const result = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        mockStyles,
        mockAxisColumnMappings
      );

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result).toHaveProperty('xAxis');
      expect(result).toHaveProperty('yAxis');
      expect(result.title).toEqual({ text: 'Value Over Time' });
    });

    it('returns series with line type and area style', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
      };

      const result = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        mockStyles,
        mockAxisColumnMappings
      );

      expect(result.series.length).toBeGreaterThanOrEqual(1);
      const mainSeries = result.series[0];
      expect(mainSeries.type).toBe('line');
      expect(mainSeries).toHaveProperty('areaStyle');
    });

    it('handles title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
      };

      // No title
      const noTitleResult = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisColumnMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      // Default title
      const defaultTitleResult = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        { ...mockStyles, titleOptions: { show: true, titleName: '' } },
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title.text).toBe('Value Over Time');

      // Custom title
      const customTitleResult = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Area Chart Title' } },
        mockAxisColumnMappings
      );
      expect(customTitleResult.title.text).toBe('Custom Area Chart Title');
    });
  });

  describe('createMultiAreaChart', () => {
    it('returns an ECharts spec with multiple series for each category', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
      };

      const result = createMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        mockDateColumns,
        mockStyles,
        mockAxisColumnMappings
      );

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.title.text).toBe('Value Over Time by Category');
      expect(result.series.length).toBeGreaterThanOrEqual(1);
    });

    it('handles title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
      };

      const noTitleResult = createMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        mockDateColumns,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisColumnMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const customTitleResult = createMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        mockDateColumns,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Multi-Area Chart' } },
        mockAxisColumnMappings
      );
      expect(customTitleResult.title.text).toBe('Custom Multi-Area Chart');
    });
  });

  describe('createFacetedMultiAreaChart', () => {
    it('returns an ECharts spec with faceted datasets', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
        [AxisRole.FACET]: mockCategoricalColumns[1],
      };

      const result = createFacetedMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        mockStyles,
        mockAxisColumnMappings
      );

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.title.text).toBe('Value Over Time by Category (Faceted by Category2)');
    });

    it('handles title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
        [AxisRole.FACET]: mockCategoricalColumns[1],
      };

      const noTitleResult = createFacetedMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisColumnMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const customTitleResult = createFacetedMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Faceted Chart' } },
        mockAxisColumnMappings
      );
      expect(customTitleResult.title.text).toBe('Custom Faceted Chart');
    });
  });

  describe('createCategoryAreaChart', () => {
    it('returns an ECharts spec for category-based area chart', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockCategoricalColumns[0],
      };

      const result = createCategoryAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        [],
        mockStyles,
        mockAxisColumnMappings
      );

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.title.text).toBe('Value by Category');
      expect(result.series.length).toBeGreaterThanOrEqual(1);
    });

    it('handles title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockCategoricalColumns[0],
      };

      const noTitleResult = createCategoryAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        [],
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisColumnMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const customTitleResult = createCategoryAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        [],
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Category Chart' } },
        mockAxisColumnMappings
      );
      expect(customTitleResult.title.text).toBe('Custom Category Chart');
    });
  });

  describe('createStackedAreaChart', () => {
    it('returns an ECharts spec with stacked series', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockCategoricalColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[1],
      };

      const result = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        [],
        mockStyles,
        mockAxisColumnMappings
      );

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.title.text).toBe('Value by Category and Category2');
      expect(result.series.length).toBeGreaterThanOrEqual(1);

      // Verify stacked series
      const mainSeries = result.series[0];
      expect(mainSeries.type).toBe('line');
      expect(mainSeries).toHaveProperty('areaStyle');
      expect(mainSeries).toHaveProperty('stack');
    });

    it('handles title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockCategoricalColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[1],
      };

      const noTitleResult = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        [],
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisColumnMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const customTitleResult = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        [],
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Stacked Chart' } },
        mockAxisColumnMappings
      );
      expect(customTitleResult.title.text).toBe('Custom Stacked Chart');
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

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockCategoricalColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[1],
      };

      const result = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        [],
        stylesWithThreshold,
        mockAxisColumnMappings
      );

      // ECharts uses markLine within series for thresholds
      const seriesWithMarkLine = result.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });
  });
});
