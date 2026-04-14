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
    titleOptions: {
      show: true,
      titleName: '',
    },
    standardAxes: [],
    showFullTimeRange: false,
  };

  describe('createSimpleAreaChart', () => {
    const axisColumnMappings: AxisColumnMappings = {
      [AxisRole.Y]: mockNumericalColumn,
      [AxisRole.X]: mockDateColumn,
    };

    it('returns an ECharts spec with dataset, series, and axes', () => {
      const result = createSimpleAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result).toHaveProperty('xAxis');
      expect(result).toHaveProperty('yAxis');
      expect(result.title).toEqual({ text: 'Value Over Time' });
    });

    it('returns series with line type and area style', () => {
      const result = createSimpleAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result.series.length).toBeGreaterThanOrEqual(1);
      const mainSeries = result.series[0];
      expect(mainSeries.type).toBe('line');
      expect(mainSeries).toHaveProperty('areaStyle');
    });

    it('handles title display options', () => {
      // No title
      const noTitleResult = createSimpleAreaChart(
        mockTransformedData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        axisColumnMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      // Default title
      const defaultTitleResult = createSimpleAreaChart(
        mockTransformedData,
        { ...mockStyles, titleOptions: { show: true, titleName: '' } },
        axisColumnMappings
      );
      expect(defaultTitleResult.title.text).toBe('Value Over Time');

      // Custom title
      const customTitleResult = createSimpleAreaChart(
        mockTransformedData,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Area Chart Title' } },
        axisColumnMappings
      );
      expect(customTitleResult.title.text).toBe('Custom Area Chart Title');
    });
  });

  describe('createMultiAreaChart', () => {
    const axisColumnMappings: AxisColumnMappings = {
      [AxisRole.Y]: mockNumericalColumn,
      [AxisRole.X]: mockDateColumn,
      [AxisRole.COLOR]: mockCategoricalColumns[0],
    };

    it('returns an ECharts spec with multiple series for each category', () => {
      const result = createMultiAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.title.text).toBe('Value Over Time by Category');
      expect(result.series.length).toBeGreaterThanOrEqual(1);
    });

    it('handles title display options', () => {
      const noTitleResult = createMultiAreaChart(
        mockTransformedData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        axisColumnMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const customTitleResult = createMultiAreaChart(
        mockTransformedData,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Multi-Area Chart' } },
        axisColumnMappings
      );
      expect(customTitleResult.title.text).toBe('Custom Multi-Area Chart');
    });
  });

  describe('createFacetedMultiAreaChart', () => {
    const axisColumnMappings: AxisColumnMappings = {
      [AxisRole.Y]: mockNumericalColumn,
      [AxisRole.X]: mockDateColumn,
      [AxisRole.COLOR]: mockCategoricalColumns[0],
      [AxisRole.FACET]: mockCategoricalColumns[1],
    };

    it('returns an ECharts spec with faceted datasets', () => {
      const result = createFacetedMultiAreaChart(
        mockTransformedData,
        mockStyles,
        axisColumnMappings
      );

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.title.text).toBe('Value Over Time by Category (Faceted by Category2)');
    });

    it('handles title display options', () => {
      const noTitleResult = createFacetedMultiAreaChart(
        mockTransformedData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        axisColumnMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const customTitleResult = createFacetedMultiAreaChart(
        mockTransformedData,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Faceted Chart' } },
        axisColumnMappings
      );
      expect(customTitleResult.title.text).toBe('Custom Faceted Chart');
    });
  });

  describe('createCategoryAreaChart', () => {
    const axisColumnMappings: AxisColumnMappings = {
      [AxisRole.Y]: mockNumericalColumn,
      [AxisRole.X]: mockCategoricalColumns[0],
    };

    it('returns an ECharts spec for category-based area chart', () => {
      const result = createCategoryAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.title.text).toBe('Value by Category');
      expect(result.series.length).toBeGreaterThanOrEqual(1);
    });

    it('handles title display options', () => {
      const noTitleResult = createCategoryAreaChart(
        mockTransformedData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        axisColumnMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const customTitleResult = createCategoryAreaChart(
        mockTransformedData,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Category Chart' } },
        axisColumnMappings
      );
      expect(customTitleResult.title.text).toBe('Custom Category Chart');
    });
  });

  describe('createStackedAreaChart', () => {
    const axisColumnMappings: AxisColumnMappings = {
      [AxisRole.Y]: mockNumericalColumn,
      [AxisRole.X]: mockCategoricalColumns[0],
      [AxisRole.COLOR]: mockCategoricalColumns[1],
    };

    it('returns an ECharts spec with stacked series', () => {
      const result = createStackedAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

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
      const noTitleResult = createStackedAreaChart(
        mockTransformedData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        axisColumnMappings
      );
      expect(noTitleResult.title.text).toBeUndefined();

      const customTitleResult = createStackedAreaChart(
        mockTransformedData,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Stacked Chart' } },
        axisColumnMappings
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
