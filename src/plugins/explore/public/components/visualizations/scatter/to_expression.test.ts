/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createTwoMetricScatter,
  createTwoMetricOneCateScatter,
  createThreeMetricOneCateScatter,
} from './to_expression';
import { VisColumn, VisFieldType, Positions, AxisRole, AxisColumnMappings } from '../types';
import { defaultScatterChartStyles, ScatterChartStyle } from './scatter_vis_config';

describe('Scatter Chart to_expression', () => {
  const mockData = [
    { x: 10, y: 20, category: 'A', size: 5 },
    { x: 15, y: 25, category: 'A', size: 10 },
    { x: 20, y: 30, category: 'B', size: 15 },
  ];

  const mockNumericalColumns: VisColumn[] = [
    {
      id: 1,
      name: 'X Value',
      schema: VisFieldType.Numerical,
      column: 'x',
      validValuesCount: 3,
      uniqueValuesCount: 3,
    },
    {
      id: 2,
      name: 'Y Value',
      schema: VisFieldType.Numerical,
      column: 'y',
      validValuesCount: 3,
      uniqueValuesCount: 3,
    },
    {
      id: 3,
      name: 'Size',
      schema: VisFieldType.Numerical,
      column: 'size',
      validValuesCount: 3,
      uniqueValuesCount: 3,
    },
  ];

  const mockCategoricalColumn: VisColumn = {
    id: 4,
    name: 'Category',
    schema: VisFieldType.Categorical,
    column: 'category',
    validValuesCount: 3,
    uniqueValuesCount: 2,
  };

  const mockStyles: ScatterChartStyle = {
    ...defaultScatterChartStyles,
    addLegend: true,
    legendPosition: Positions.RIGHT,
  };

  describe('createTwoMetricScatter', () => {
    const mockAxisMappings: AxisColumnMappings = {
      [AxisRole.X]: mockNumericalColumns[0],
      [AxisRole.Y]: mockNumericalColumns[1],
    };

    it('returns an ECharts spec with dataset, series, and axes', () => {
      const result = createTwoMetricScatter(mockData, mockStyles, mockAxisMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result).toHaveProperty('xAxis');
      expect(result).toHaveProperty('yAxis');
    });

    it('produces scatter-type series', () => {
      const result = createTwoMetricScatter(mockData, mockStyles, mockAxisMappings);

      const scatterSeries = result.series.filter((s: any) => s.type === 'scatter');
      expect(scatterSeries.length).toBeGreaterThanOrEqual(1);
    });

    it('handles title display options', () => {
      const noTitle = createTwoMetricScatter(
        mockData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisMappings
      );
      expect(noTitle.title.text).toBeUndefined();

      const defaultTitle = createTwoMetricScatter(
        mockData,
        { ...mockStyles, titleOptions: { show: true, titleName: '' } },
        mockAxisMappings
      );
      expect(defaultTitle.title.text).toBe('X Value vs Y Value');

      const customTitle = createTwoMetricScatter(
        mockData,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Scatter' } },
        mockAxisMappings
      );
      expect(customTitle.title.text).toBe('Custom Scatter');
    });
  });

  describe('createTwoMetricOneCateScatter', () => {
    const mockAxisMappings: AxisColumnMappings = {
      [AxisRole.X]: mockNumericalColumns[0],
      [AxisRole.Y]: mockNumericalColumns[1],
      [AxisRole.COLOR]: mockCategoricalColumn,
    };

    it('returns an ECharts spec with colored scatter series', () => {
      const result = createTwoMetricOneCateScatter(
        mockData,
        { ...mockStyles, titleOptions: { show: true, titleName: '' } },
        mockAxisMappings
      );

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.title.text).toBe('X Value vs Y Value by Category');
    });

    it('handles title display options', () => {
      const noTitle = createTwoMetricOneCateScatter(
        mockData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisMappings
      );
      expect(noTitle.title.text).toBeUndefined();
    });

    it('throws when color field is missing', () => {
      expect(() =>
        createTwoMetricOneCateScatter(mockData, mockStyles, {
          [AxisRole.X]: mockNumericalColumns[0],
          [AxisRole.Y]: mockNumericalColumns[1],
        })
      ).toThrow();
    });
  });

  describe('createThreeMetricOneCateScatter', () => {
    const mockAxisMappings: AxisColumnMappings = {
      [AxisRole.X]: mockNumericalColumns[0],
      [AxisRole.Y]: mockNumericalColumns[1],
      [AxisRole.COLOR]: mockCategoricalColumn,
      [AxisRole.SIZE]: mockNumericalColumns[2],
    };

    it('returns an ECharts spec with size-encoded scatter series', () => {
      const result = createThreeMetricOneCateScatter(
        mockData,
        { ...mockStyles, titleOptions: { show: true, titleName: '' } },
        mockAxisMappings
      );

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result.title.text).toBe('X Value vs Y Value by Category (Size: Size)');
    });

    it('handles title display options', () => {
      const noTitle = createThreeMetricOneCateScatter(
        mockData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisMappings
      );
      expect(noTitle.title.text).toBeUndefined();

      const customTitle = createThreeMetricOneCateScatter(
        mockData,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Bubble' } },
        mockAxisMappings
      );
      expect(customTitle.title.text).toBe('Custom Bubble');
    });

    it('throws when size field is missing', () => {
      expect(() =>
        createThreeMetricOneCateScatter(mockData, mockStyles, {
          [AxisRole.X]: mockNumericalColumns[0],
          [AxisRole.Y]: mockNumericalColumns[1],
          [AxisRole.COLOR]: mockCategoricalColumn,
        })
      ).toThrow();
    });
  });
});
