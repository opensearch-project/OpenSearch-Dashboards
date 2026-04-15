/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRegularHeatmap } from './to_expression';
import { VisColumn, VisFieldType, AxisRole, AxisColumnMappings, Positions } from '../types';
import { defaultHeatmapChartStyles, HeatmapChartStyle } from './heatmap_vis_config';

describe('Heatmap to_expression', () => {
  const mockData = [
    { category1: 'A', category2: 'X', value: 10 },
    { category1: 'A', category2: 'Y', value: 20 },
    { category1: 'B', category2: 'X', value: 30 },
    { category1: 'B', category2: 'Y', value: 40 },
  ];

  const mockCategoricalColumns: VisColumn[] = [
    {
      id: 1,
      name: 'Category1',
      schema: VisFieldType.Categorical,
      column: 'category1',
      validValuesCount: 4,
      uniqueValuesCount: 2,
    },
    {
      id: 2,
      name: 'Category2',
      schema: VisFieldType.Categorical,
      column: 'category2',
      validValuesCount: 4,
      uniqueValuesCount: 2,
    },
  ];

  const mockNumericalColumns: VisColumn[] = [
    {
      id: 3,
      name: 'Value',
      schema: VisFieldType.Numerical,
      column: 'value',
      validValuesCount: 4,
      uniqueValuesCount: 4,
    },
  ];

  const mockStyles: HeatmapChartStyle = {
    ...defaultHeatmapChartStyles,
    addLegend: true,
    legendPosition: Positions.BOTTOM,
  };

  describe('createRegularHeatmap', () => {
    const mockAxisColumnMappings: AxisColumnMappings = {
      [AxisRole.X]: mockCategoricalColumns[0],
      [AxisRole.Y]: mockCategoricalColumns[1],
      [AxisRole.COLOR]: mockNumericalColumns[0],
    };

    it('returns an ECharts spec with dataset, series, and axes', () => {
      const result = createRegularHeatmap(mockData, mockStyles, mockAxisColumnMappings);

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result).toHaveProperty('xAxis');
      expect(result).toHaveProperty('yAxis');
      expect(result).toHaveProperty('visualMap');
    });

    it('produces heatmap-type series', () => {
      const result = createRegularHeatmap(mockData, mockStyles, mockAxisColumnMappings);

      expect(Array.isArray(result?.series)).toBe(true);
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      const heatmapSeries = (result?.series ?? []).filter((s: any) => s.type === 'heatmap');
      expect(heatmapSeries.length).toBeGreaterThanOrEqual(1);
    });

    it('handles title display options', () => {
      const noTitleResult = createRegularHeatmap(
        mockData,
        { ...mockStyles, titleOptions: { show: false, titleName: '' } },
        mockAxisColumnMappings
      );
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      expect(noTitleResult?.title?.text).toBeUndefined();

      const defaultTitleResult = createRegularHeatmap(
        mockData,
        { ...mockStyles, titleOptions: { show: true, titleName: '' } },
        mockAxisColumnMappings
      );
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      expect(defaultTitleResult?.title?.text).toBe('Value by Category1 and Category2');

      const customTitleResult = createRegularHeatmap(
        mockData,
        { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Heatmap' } },
        mockAxisColumnMappings
      );
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      expect(customTitleResult?.title?.text).toBe('Custom Heatmap');
    });

    it('throws when axis config is missing', () => {
      expect(() => createRegularHeatmap(mockData, mockStyles, {})).toThrow(
        'Missing axis config for heatmap chart'
      );
    });
  });
});
