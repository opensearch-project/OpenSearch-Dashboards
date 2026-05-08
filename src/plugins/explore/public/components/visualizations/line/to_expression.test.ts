/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSimpleLineChart,
  createLineBarChart,
  createMultiLineChart,
  createFacetedMultiLineChart,
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
    titleOptions: { show: true, titleName: '' },
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
      expect(result.title).toEqual({ text: 'Value Over Time' });
    });

    it('produces line-type series', () => {
      const result = createSimpleLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result.series.length).toBeGreaterThanOrEqual(1);
      expect(result.series[0].type).toBe('line');
    });

    it('handles title display options', () => {
      const noTitle = createSimpleLineChart(
        mockData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisMappings
      );
      expect(noTitle.title.text).toBeUndefined();

      const customTitle = createSimpleLineChart(
        mockData,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Line' } },
        mockAxisMappings
      );
      expect(customTitle.title.text).toBe('Custom Line');
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
      expect(result.title.text).toBe('Value (Bar) and Value2 (Line) Over Time');
      expect(result.series.length).toBeGreaterThanOrEqual(2);
    });

    it('handles title display options', () => {
      const noTitle = createLineBarChart(
        mockData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisMappings
      );
      expect(noTitle.title.text).toBeUndefined();
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
      expect(result.title.text).toBe('Value Over Time by Category');
      expect(result.series.length).toBeGreaterThanOrEqual(1);
    });

    it('handles title display options', () => {
      const noTitle = createMultiLineChart(
        mockData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisMappings
      );
      expect(noTitle.title.text).toBeUndefined();

      const customTitle = createMultiLineChart(
        mockData,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Multi-Line' } },
        mockAxisMappings
      );
      expect(customTitle.title.text).toBe('Custom Multi-Line');
    });
  });

  describe('createFacetedMultiLineChart', () => {
    const mockAxisMappings = {
      [AxisRole.Y]: mockNumericColumn,
      [AxisRole.X]: mockDateColumn,
      [AxisRole.COLOR]: mockCategoricalColumn,
      [AxisRole.FACET]: mockCategoricalColumn2,
    };

    it('returns an ECharts spec with faceted datasets', () => {
      const result = createFacetedMultiLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.title.text).toBe('Value Over Time by Category (Faceted by Category2)');
    });

    it('handles title display options', () => {
      const noTitle = createFacetedMultiLineChart(
        mockData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisMappings
      );
      expect(noTitle.title.text).toBeUndefined();
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
      expect(result.title.text).toBe('Value by Category');
      expect(result.series[0].type).toBe('line');
    });

    it('handles title display options', () => {
      const noTitle = createCategoryLineChart(
        mockData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisMappings
      );
      expect(noTitle.title.text).toBeUndefined();
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
      expect(result.title.text).toBe('Value by Category and Category2');
      expect(result.series.length).toBeGreaterThanOrEqual(1);
    });

    it('handles title display options', () => {
      const noTitle = createCategoryMultiLineChart(
        mockData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisMappings
      );
      expect(noTitle.title.text).toBeUndefined();
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
