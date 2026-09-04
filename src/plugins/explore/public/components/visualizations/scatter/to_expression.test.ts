/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createTwoMetricScatter,
  createTwoMetricOneCateScatter,
  createThreeMetricOneCateScatter,
} from './to_expression';
import { VisColumn, VisFieldType, Positions, AxisRole } from '../types';
import { defaultScatterChartStyles, ScatterChartStyle } from './scatter_vis_config';
import { getColors } from '../theme/default_colors';

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
    },
    {
      id: 2,
      name: 'Y Value',
      schema: VisFieldType.Numerical,
      column: 'y',
    },
    {
      id: 3,
      name: 'Size',
      schema: VisFieldType.Numerical,
      column: 'size',
    },
  ];

  const mockCategoricalColumn: VisColumn = {
    id: 4,
    name: 'Category',
    schema: VisFieldType.Categorical,
    column: 'category',
  };

  const mockStyles: ScatterChartStyle = {
    ...defaultScatterChartStyles,
    addLegend: true,
    legendPosition: Positions.RIGHT,
  };

  describe('createTwoMetricScatter', () => {
    const mockAxisMappings = {
      [AxisRole.X]: mockNumericalColumns[0],
      [AxisRole.Y]: mockNumericalColumns[1],
    };

    it('returns an ECharts spec with dataset, series, and axes', () => {
      const result = createTwoMetricScatter(mockData, mockStyles, mockAxisMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec).toHaveProperty('xAxis');
      expect(result.spec).toHaveProperty('yAxis');
      expect(result.legendItems).toEqual([]);
    });

    it('produces scatter-type series', () => {
      const result = createTwoMetricScatter(mockData, mockStyles, mockAxisMappings);

      const scatterSeries = result.spec.series.filter((s: any) => s.type === 'scatter');
      expect(scatterSeries.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('createTwoMetricOneCateScatter', () => {
    const mockAxisMappings = {
      [AxisRole.X]: mockNumericalColumns[0],
      [AxisRole.Y]: mockNumericalColumns[1],
      [AxisRole.COLOR]: mockCategoricalColumn,
    };

    it('returns an ECharts spec with colored scatter series', () => {
      const result = createTwoMetricOneCateScatter(mockData, mockStyles, mockAxisMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
    });

    it('emits series-target legend items while assigning category colors', () => {
      const palette = getColors().categories;
      const result = createTwoMetricOneCateScatter(mockData, mockStyles, mockAxisMappings);

      expect(result.legendItems).toEqual([
        {
          label: 'A',
          color: palette[0],
          target: { type: 'series', name: 'A' },
        },
        {
          label: 'B',
          color: palette[1],
          target: { type: 'series', name: 'B' },
        },
      ]);
      expect(result.spec.series).toEqual([
        expect.objectContaining({
          name: 'A',
          itemStyle: expect.objectContaining({ color: palette[0] }),
        }),
        expect.objectContaining({
          name: 'B',
          itemStyle: expect.objectContaining({ color: palette[1] }),
        }),
      ]);
    });

    it('uses provided full data when assigning category colors', () => {
      const palette = getColors().categories;
      const result = createTwoMetricOneCateScatter(
        [
          { x: 10, y: 20, category: 'A' },
          { x: 20, y: 30, category: 'C' },
        ],
        mockStyles,
        mockAxisMappings,
        [
          { x: 10, y: 20, category: 'A' },
          { x: 15, y: 25, category: 'B' },
          { x: 20, y: 30, category: 'C' },
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

    it('emits builder-owned colors for unfilled category scatter', () => {
      const palette = getColors().categories;
      const result = createTwoMetricOneCateScatter(
        mockData,
        { ...mockStyles, exclusive: { ...mockStyles.exclusive, filled: false } },
        mockAxisMappings
      );

      expect(result.legendItems.map((item) => item.color)).toEqual([palette[0], palette[1]]);
      expect(result.spec.series).toEqual([
        expect.objectContaining({
          name: 'A',
          itemStyle: expect.objectContaining({
            color: 'transparent',
            borderColor: palette[0],
          }),
        }),
        expect.objectContaining({
          name: 'B',
          itemStyle: expect.objectContaining({
            color: 'transparent',
            borderColor: palette[1],
          }),
        }),
      ]);
    });

    it('throws when color field is missing', () => {
      expect(() =>
        createTwoMetricOneCateScatter(mockData, mockStyles, {
          [AxisRole.X]: mockNumericalColumns[0],
          [AxisRole.Y]: mockNumericalColumns[1],
        } as any)
      ).toThrow();
    });
  });

  describe('createThreeMetricOneCateScatter', () => {
    const mockAxisMappings = {
      [AxisRole.X]: mockNumericalColumns[0],
      [AxisRole.Y]: mockNumericalColumns[1],
      [AxisRole.COLOR]: mockCategoricalColumn,
      [AxisRole.SIZE]: mockNumericalColumns[2],
    };

    const mockSizeOnlyAxisMappings = {
      [AxisRole.X]: mockNumericalColumns[0],
      [AxisRole.Y]: mockNumericalColumns[1],
      [AxisRole.SIZE]: mockNumericalColumns[2],
    };

    it('returns an ECharts spec with size-encoded scatter series', () => {
      const result = createThreeMetricOneCateScatter(mockData, mockStyles, mockAxisMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec).toHaveProperty('visualMap');
    });

    it('emits category legend items while preserving size visualMap', () => {
      const palette = getColors().categories;
      const result = createThreeMetricOneCateScatter(mockData, mockStyles, mockAxisMappings);

      expect(result.legendItems).toEqual([
        {
          label: 'A',
          color: palette[0],
          target: { type: 'series', name: 'A' },
        },
        {
          label: 'B',
          color: palette[1],
          target: { type: 'series', name: 'B' },
        },
      ]);
      expect(result.spec.visualMap).toEqual([expect.objectContaining({ dimension: 2 })]);
    });

    it('uses provided full data when assigning color and size scatter colors', () => {
      const palette = getColors().categories;
      const result = createThreeMetricOneCateScatter(
        [
          { x: 10, y: 20, category: 'A', size: 5 },
          { x: 20, y: 30, category: 'C', size: 15 },
        ],
        mockStyles,
        mockAxisMappings,
        [
          { x: 10, y: 20, category: 'A', size: 5 },
          { x: 15, y: 25, category: 'B', size: 10 },
          { x: 20, y: 30, category: 'C', size: 15 },
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
      expect(result.spec.visualMap).toEqual([expect.objectContaining({ dimension: 2 })]);
    });

    it('does not emit custom legend items for size-only scatter charts', () => {
      const styles = {
        ...mockStyles,
        exclusive: {
          ...mockStyles.exclusive,
          filled: false,
        },
      };

      const result = createThreeMetricOneCateScatter(mockData, styles, mockSizeOnlyAxisMappings);

      expect(result.legendItems).toEqual([]);
      expect(result.spec.series).toEqual([
        expect.objectContaining({
          name: 'Y Value',
          itemStyle: expect.objectContaining({
            color: 'transparent',
            borderColor: getColors().categories[0],
          }),
        }),
      ]);
      expect(result.spec.visualMap).toEqual([expect.objectContaining({ dimension: 2 })]);
    });

    it('keeps category legend entries when color and size mappings are both present', () => {
      const palette = getColors().categories;

      const result = createThreeMetricOneCateScatter(mockData, mockStyles, mockAxisMappings);

      expect(result.legendItems).toEqual([
        {
          label: 'A',
          color: palette[0],
          target: { type: 'series', name: 'A' },
        },
        {
          label: 'B',
          color: palette[1],
          target: { type: 'series', name: 'B' },
        },
      ]);
    });

    it('throws when size field is missing', () => {
      expect(() =>
        createThreeMetricOneCateScatter(mockData, mockStyles, {
          [AxisRole.X]: mockNumericalColumns[0],
          [AxisRole.Y]: mockNumericalColumns[1],
          [AxisRole.COLOR]: mockCategoricalColumn,
        } as any)
      ).toThrow();
    });
  });
});
