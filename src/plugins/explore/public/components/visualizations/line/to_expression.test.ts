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
import { VisColumn, VisFieldType, ThresholdMode, Positions, AxisRole, DisableMode } from '../types';
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

  // Rows come back as a 2D array: [headers, ...rows]
  const seriesValues = (spec: any, seriesField: string) => {
    const [headers, ...rows] = spec.dataset.source;
    const columnIndex = headers.indexOf(seriesField);
    return rows.map((row: any[]) => row[columnIndex]);
  };

  // Multi-series charts give every series its own dataset, so the values for one
  // series are read out of the dataset its `datasetIndex` points at.
  const groupedSeriesValues = (spec: any, seriesName: string) => {
    const series = spec.series.find((s: any) => s.name === seriesName);
    const [headers, ...rows] = spec.dataset[series.datasetIndex].source;
    const columnIndex = headers.indexOf(series.encode.y);
    return rows.map((row: any[]) => row[columnIndex]);
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

    describe('connect / disconnect values', () => {
      // A single metric with one missing reading 30m into the series
      const gapData = [
        { date: '2023-01-01T00:00:00Z', value: 10 },
        { date: '2023-01-01T00:10:00Z', value: null },
        { date: '2023-01-01T00:30:00Z', value: 30 },
      ];

      it('bridges the gap at render time by default', () => {
        const result = createSimpleLineChart(gapData, mockStyles, mockAxisMappings);

        expect(result.spec.series[0].connectNulls).toBe(true);
        expect(seriesValues(result.spec, 'value')).toEqual([10, null, 30]);
      });

      it('interpolates gaps shorter than the threshold', () => {
        const result = createSimpleLineChart(
          gapData,
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Threshold, threshold: '1h' },
          },
          mockAxisMappings
        );

        expect(result.spec.series[0].connectNulls).toBe(false);
        const values = seriesValues(result.spec, 'value');
        expect(values[1]).toBeCloseTo(16.6667, 4);
      });

      it('inserts a break when two points sit further apart than the threshold', () => {
        const result = createSimpleLineChart(
          [
            { date: '2023-01-01T00:00:00Z', value: 10 },
            { date: '2023-01-01T01:00:00Z', value: 30 },
          ],
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Never, threshold: '1h' },
            disconnectValues: { disableMode: DisableMode.Threshold, threshold: '10m' },
          },
          mockAxisMappings
        );

        expect(seriesValues(result.spec, 'value')).toEqual([10, null, 30]);
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

    describe('per-series datasets', () => {
      const interleavedData = [
        { date: '2023-01-01T00:00:00Z', value: 1, category: 'A' },
        { date: '2023-01-01T00:04:00Z', value: 10, category: 'B' },
        { date: '2023-01-01T00:09:00Z', value: 2, category: 'A' },
        { date: '2023-01-01T00:10:00Z', value: 20, category: 'B' },
      ];

      it('gives every series its own dataset', () => {
        const result = createMultiLineChart(interleavedData, mockStyles, mockAxisMappings);

        expect(result.spec.dataset).toHaveLength(2);
        expect(result.spec.series.map((s: any) => s.datasetIndex)).toEqual([0, 1]);
      });

      it('keeps each series on its own timeline instead of a shared x column', () => {
        // A reports at :00/:09 and B at :04/:10. The pivoted pipeline put both on one
        // x column, so each series went null at the other's timestamps and rendered
        // as disconnected points. Now neither series carries the other's timestamps.
        const result = createMultiLineChart(interleavedData, mockStyles, mockAxisMappings);

        expect(groupedSeriesValues(result.spec, 'A')).toEqual([1, 2]);
        expect(groupedSeriesValues(result.spec, 'B')).toEqual([10, 20]);
      });

      it('does not let one series sampling beat break another', () => {
        // Every gap here is under 30m, so nothing may be broken even though the
        // interleaved rows sit closer together than either series' own spacing.
        const result = createMultiLineChart(
          interleavedData,
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Never, threshold: '1h' },
            disconnectValues: { disableMode: DisableMode.Threshold, threshold: '30m' },
          },
          mockAxisMappings
        );

        expect(groupedSeriesValues(result.spec, 'A')).toEqual([1, 2]);
        expect(groupedSeriesValues(result.spec, 'B')).toEqual([10, 20]);
      });
    });

    describe('connect null values', () => {
      // 'A' reports at :00 and :30 with an explicit missing reading at :10
      const gapData = [
        { date: '2023-01-01T00:00:00Z', value: 10, category: 'A' },
        { date: '2023-01-01T00:10:00Z', value: null, category: 'A' },
        { date: '2023-01-01T00:30:00Z', value: 30, category: 'A' },
      ];

      it('bridges gaps at render time by default', () => {
        // The default is `always`, which is what line series did before this was configurable
        const result = createMultiLineChart(gapData, mockStyles, mockAxisMappings);

        expect(result.spec.series.every((s: any) => s.connectNulls === true)).toBe(true);
      });

      it('leaves gaps as breaks when the mode is never', () => {
        const result = createMultiLineChart(
          gapData,
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Never, threshold: '1h' },
          },
          mockAxisMappings
        );

        expect(result.spec.series.every((s: any) => s.connectNulls === false)).toBe(true);
      });

      it('keeps a null inside a series as a break rather than dropping the row', () => {
        // The null is what renders the break, so grouping must not splice the row out
        // and connect straight across the hole
        const result = createMultiLineChart(
          gapData,
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Never, threshold: '1h' },
          },
          mockAxisMappings
        );

        expect(groupedSeriesValues(result.spec, 'A')).toEqual([10, null, 30]);
      });

      it('interpolates a gap shorter than the threshold within one series', () => {
        const result = createMultiLineChart(
          gapData,
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Threshold, threshold: '1h' },
          },
          mockAxisMappings
        );

        // The 30m span fits under 1h, so :10 lands a third of the way from 10 to 30
        expect(result.spec.series.every((s: any) => s.connectNulls === false)).toBe(true);
        const values = groupedSeriesValues(result.spec, 'A');
        expect(values[0]).toBe(10);
        expect(values[1]).toBeCloseTo(16.6667, 4);
        expect(values[2]).toBe(30);
      });

      it('leaves a gap longer than the threshold as a break', () => {
        const result = createMultiLineChart(
          gapData,
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Threshold, threshold: '5m' },
          },
          mockAxisMappings
        );

        expect(groupedSeriesValues(result.spec, 'A')).toEqual([10, null, 30]);
      });

      it('does not let one series null bridge into another series', () => {
        // 'B' has the null; 'A' is fully sampled and must be untouched
        const result = createMultiLineChart(
          [
            { date: '2023-01-01T00:00:00Z', value: 10, category: 'A' },
            { date: '2023-01-01T00:00:00Z', value: 1, category: 'B' },
            { date: '2023-01-01T00:10:00Z', value: 20, category: 'A' },
            { date: '2023-01-01T00:10:00Z', value: null, category: 'B' },
            { date: '2023-01-01T00:20:00Z', value: 30, category: 'A' },
            { date: '2023-01-01T00:20:00Z', value: 3, category: 'B' },
          ],
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Never, threshold: '1h' },
          },
          mockAxisMappings
        );

        expect(groupedSeriesValues(result.spec, 'A')).toEqual([10, 20, 30]);
        expect(groupedSeriesValues(result.spec, 'B')).toEqual([1, null, 3]);
      });
    });

    describe('disconnect values', () => {
      // Two valid points 1h apart, with no nulls between them.
      const sparseData = [
        { date: '2023-01-01T00:00:00Z', value: 10, category: 'A' },
        { date: '2023-01-01T01:00:00Z', value: 30, category: 'A' },
      ];

      it('keeps everything connected by default', () => {
        const result = createMultiLineChart(sparseData, mockStyles, mockAxisMappings);

        expect(groupedSeriesValues(result.spec, 'A')).toEqual([10, 30]);
      });

      it('inserts a break when the gap exceeds the threshold', () => {
        const result = createMultiLineChart(
          sparseData,
          {
            ...mockStyles,
            // Connecting has to be off for the inserted null to survive rendering
            connectNullValues: { connectMode: DisableMode.Never, threshold: '1h' },
            disconnectValues: { disableMode: DisableMode.Threshold, threshold: '10m' },
          },
          mockAxisMappings
        );

        // A null row lands 10m past the first point, splitting the line in two
        expect(groupedSeriesValues(result.spec, 'A')).toEqual([10, null, 30]);
        expect(result.spec.series.every((s: any) => s.connectNulls === false)).toBe(true);
      });

      it('leaves gaps within the threshold untouched', () => {
        const result = createMultiLineChart(
          sparseData,
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Never, threshold: '1h' },
            disconnectValues: { disableMode: DisableMode.Threshold, threshold: '2h' },
          },
          mockAxisMappings
        );

        expect(groupedSeriesValues(result.spec, 'A')).toEqual([10, 30]);
      });

      it('breaks only the series whose own gap is oversized', () => {
        // 'A' has a 1h gap while 'B' samples every 10m, so only 'A' may break
        const result = createMultiLineChart(
          [
            { date: '2023-01-01T00:00:00Z', value: 10, category: 'A' },
            { date: '2023-01-01T00:10:00Z', value: 1, category: 'B' },
            { date: '2023-01-01T00:20:00Z', value: 2, category: 'B' },
            { date: '2023-01-01T01:00:00Z', value: 30, category: 'A' },
          ],
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Never, threshold: '1h' },
            disconnectValues: { disableMode: DisableMode.Threshold, threshold: '30m' },
          },
          mockAxisMappings
        );

        expect(groupedSeriesValues(result.spec, 'A')).toEqual([10, null, 30]);
        expect(groupedSeriesValues(result.spec, 'B')).toEqual([1, 2]);
      });
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
