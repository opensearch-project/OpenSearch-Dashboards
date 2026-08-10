/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSimpleLineChart,
  createLineBarChart,
  createMultiLineChart,
  createCategoryLineChart,
  createCategoryMultiLineChart,
} from './to_expression';
import { VisColumn, VisFieldType, ThresholdMode, Positions, AxisRole } from '../types';
import { defaultLineChartStyles, LineChartStyle } from './line_vis_config';
import { LineStyle } from './line_exclusive_vis_options';
import { getColors } from '../theme/default_colors';

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
  };

  const mockNumericColumn: VisColumn = {
    id: 1,
    name: 'Value',
    schema: VisFieldType.Numerical,
    column: 'value',
  };

  const mockNumericColumn2: VisColumn = {
    id: 2,
    name: 'Value2',
    schema: VisFieldType.Numerical,
    column: 'value2',
  };

  const mockCategoricalColumn: VisColumn = {
    id: 3,
    name: 'Category',
    schema: VisFieldType.Categorical,
    column: 'category',
  };

  const mockCategoricalColumn2: VisColumn = {
    id: 4,
    name: 'Category2',
    schema: VisFieldType.Categorical,
    column: 'category2',
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
    showFullTimeRange: false,
  };

  describe('createSimpleLineChart', () => {
    const mockAxisMappings = {
      [AxisRole.Y]: [mockNumericColumn],
      [AxisRole.X]: mockDateColumn,
    };

    it('returns an ECharts spec with dataset, series, and axes', () => {
      const result = createSimpleLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec).toHaveProperty('xAxis');
      expect(result.spec).toHaveProperty('yAxis');
    });

    it('produces line-type series', () => {
      const result = createSimpleLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);
      expect(result.spec.series[0].type).toBe('line');
    });

    it('emits series-target legend items while assigning metric colors', () => {
      const palette = getColors().categories;
      const result = createSimpleLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result.legendItems).toEqual([
        {
          label: 'Value',
          color: palette[0],
          target: { type: 'series', name: 'Value' },
        },
      ]);
      expect(result.spec.series[0]).toEqual(
        expect.objectContaining({
          name: 'Value',
          itemStyle: { color: palette[0] },
        })
      );
    });

    describe('point size and value labels', () => {
      const seriesOf = (styles: Partial<LineChartStyle>) =>
        createSimpleLineChart(mockData, { ...mockStyles, ...styles }, mockAxisMappings).spec
          .series[0];

      it.each(['both', 'line'] as LineStyle[])(
        'leaves the symbols and labels untouched in %s mode',
        (lineStyle) => {
          // Both controls are dots-only, so the other styles keep ECharts' own sizing
          const series = seriesOf({ lineStyle, pointSize: 8, showValues: true });

          expect(series.symbolSize).toBeUndefined();
          expect(series.label).toBeUndefined();
        }
      );

      it('applies the point size in dots mode', () => {
        const series = seriesOf({ lineStyle: 'dots', pointSize: 8 });

        expect(series.showSymbol).toBe(true);
        expect(series.symbolSize).toBe(8);
      });

      it('hides the symbols in dots mode when the point size is 0', () => {
        const series = seriesOf({ lineStyle: 'dots', pointSize: 0 });

        expect(series.showSymbol).toBe(false);
        expect(series.symbolSize).toBeUndefined();
      });

      it('keeps zeroing the stroke width in dots mode', () => {
        expect(seriesOf({ lineStyle: 'dots', lineWidth: 5 }).lineStyle.width).toBe(0);
      });

      it('renders value labels in dots mode when showValues is set', () => {
        const series = seriesOf({ lineStyle: 'dots', showValues: true });

        expect(series.label.show).toBe(true);
        expect(series.label.position).toBe('top');
        expect(series.labelLayout).toEqual({ hideOverlap: true });
      });

      it('rounds the formatted value to two decimals', () => {
        const { formatter } = seriesOf({ lineStyle: 'dots', showValues: true }).label;
        // The dataset source is a 2D array, so echarts hands the formatter the row
        // array plus the dimension names to look the field up by
        const dimensionNames = ['date', 'value'];

        expect(formatter({ value: ['2023-01-01', 12.3456], dimensionNames })).toBe('12.35');
        expect(formatter({ value: ['2023-01-01', null], dimensionNames })).toBe('');
      });

      it('keeps zero-sized symbols alive so value labels can attach to them', () => {
        const series = seriesOf({ lineStyle: 'dots', pointSize: 0, showValues: true });

        expect(series.showSymbol).toBe(true);
        expect(series.symbolSize).toBe(0);
      });
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

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series.length).toBeGreaterThanOrEqual(2);
    });

    it('emits legend items for line and bar series', () => {
      const palette = getColors().categories;
      const result = createLineBarChart(mockData, mockStyles, mockAxisMappings);

      expect(result.legendItems).toEqual([
        {
          label: 'Value',
          color: palette[0],
          target: { type: 'series', name: 'Value' },
        },
        {
          label: 'Value2',
          color: palette[1],
          target: { type: 'series', name: 'Value2' },
        },
      ]);
      expect(result.spec.series).toEqual([
        expect.objectContaining({
          type: 'line',
          name: 'Value',
          itemStyle: { color: palette[0] },
        }),
        expect.objectContaining({
          type: 'bar',
          name: 'Value2',
          itemStyle: { color: palette[1] },
        }),
      ]);
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

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);
    });

    it('uses provided full data when assigning color series colors', () => {
      const palette = getColors().categories;
      const result = createMultiLineChart(
        [
          { date: '2023-01-01', value: 10, category: 'A' },
          { date: '2023-01-02', value: 20, category: 'C' },
        ],
        mockStyles,
        mockAxisMappings,
        undefined,
        [
          { date: '2023-01-01', value: 10, category: 'A' },
          { date: '2023-01-02', value: 20, category: 'B' },
          { date: '2023-01-03', value: 30, category: 'C' },
        ]
      );

      expect(result.spec.series).toEqual([
        expect.objectContaining({
          name: 'A',
          itemStyle: { color: palette[0] },
        }),
        expect.objectContaining({
          name: 'C',
          itemStyle: { color: palette[2] },
        }),
      ]);
      expect(result.legendItems.map((item) => item.color)).toEqual([palette[0], palette[2]]);
    });
  });

  describe('createCategoryLineChart', () => {
    const mockAxisMappings = {
      [AxisRole.Y]: [mockNumericColumn],
      [AxisRole.X]: mockCategoricalColumn,
    };

    it('returns an ECharts spec for category-based line chart', () => {
      const result = createCategoryLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series[0].type).toBe('line');
    });

    it('emits series-target legend items for category-based metric lines', () => {
      const palette = getColors().categories;
      const result = createCategoryLineChart(mockData, mockStyles, mockAxisMappings);

      expect(result.legendItems).toEqual([
        {
          label: 'Value',
          color: palette[0],
          target: { type: 'series', name: 'Value' },
        },
      ]);
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

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);
    });

    it('uses provided full data when assigning category color series colors', () => {
      const palette = getColors().categories;
      const result = createCategoryMultiLineChart(
        [
          { category: 'A', value: 10, category2: 'X' },
          { category: 'B', value: 20, category2: 'Z' },
        ],
        mockStyles,
        mockAxisMappings,
        [
          { category: 'A', value: 10, category2: 'X' },
          { category: 'B', value: 20, category2: 'Y' },
          { category: 'C', value: 30, category2: 'Z' },
        ]
      );

      expect(result.spec.series).toEqual([
        expect.objectContaining({
          name: 'X',
          itemStyle: { color: palette[0] },
        }),
        expect.objectContaining({
          name: 'Z',
          itemStyle: { color: palette[2] },
        }),
      ]);
      expect(result.legendItems.map((item) => item.color)).toEqual([palette[0], palette[2]]);
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

      const seriesWithMarkLine = result.spec.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });
  });
});
