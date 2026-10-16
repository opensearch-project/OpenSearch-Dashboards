/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRegularHeatmap } from './to_expression';
import { VisColumn, VisFieldType, AxisRole, Positions } from '../types';
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
    },
    {
      id: 2,
      name: 'Category2',
      schema: VisFieldType.Categorical,
      column: 'category2',
    },
  ];

  const mockNumericalColumns: VisColumn[] = [
    {
      id: 3,
      name: 'Value',
      schema: VisFieldType.Numerical,
      column: 'value',
    },
  ];

  const mockStyles: HeatmapChartStyle = {
    ...defaultHeatmapChartStyles,
    addLegend: true,
    legendPosition: Positions.BOTTOM,
  };

  describe('createRegularHeatmap', () => {
    const mockAxisColumnMappings = {
      [AxisRole.X]: mockCategoricalColumns[0],
      [AxisRole.Y]: mockCategoricalColumns[1],
      [AxisRole.COLOR]: mockNumericalColumns[0],
    };

    it('returns an ECharts spec with dataset, series, and axes', () => {
      const { spec } = createRegularHeatmap(mockData, mockStyles, mockAxisColumnMappings);

      expect(spec).toHaveProperty('dataset');
      expect(spec).toHaveProperty('series');
      expect(spec).toHaveProperty('xAxis');
      expect(spec).toHaveProperty('yAxis');
      expect(spec).toHaveProperty('visualMap');
    });

    it('produces heatmap-type series', () => {
      const { spec } = createRegularHeatmap(mockData, mockStyles, mockAxisColumnMappings);

      expect(Array.isArray(spec?.series)).toBe(true);
      const heatmapSeries = (spec?.series ?? []).filter((s: any) => s.type === 'heatmap');
      expect(heatmapSeries.length).toBeGreaterThanOrEqual(1);
    });

    it('throws when axis config is missing', () => {
      expect(() => createRegularHeatmap(mockData, mockStyles, {} as any)).toThrow();
    });
  });
});
