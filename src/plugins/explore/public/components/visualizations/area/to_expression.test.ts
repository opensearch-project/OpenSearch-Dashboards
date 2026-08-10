/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSimpleAreaChart,
  createMultiAreaChart,
  createCategoryAreaChart,
  createStackedAreaChart,
} from './to_expression';
import { VisColumn, VisFieldType, ThresholdMode, Positions, AxisRole, DisableMode } from '../types';
import { AreaChartStyle } from './area_vis_config';
import { DEFAULT_FILL_OPACITY, DEFAULT_POINT_SIZE } from '../style_panel/share';
import { getColors } from '../theme/default_colors';

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
  };

  const mockDateColumn: VisColumn = {
    id: 2,
    name: 'Date',
    schema: VisFieldType.Date,
    column: 'date',
  };

  const mockCategoricalColumns: VisColumn[] = [
    {
      id: 3,
      name: 'Category',
      schema: VisFieldType.Categorical,
      column: 'category',
    },
    {
      id: 4,
      name: 'Category2',
      schema: VisFieldType.Categorical,
      column: 'category2',
    },
  ];

  const mockStyles: AreaChartStyle = {
    addLegend: true,
    legendPosition: Positions.RIGHT,
    addTimeMarker: false,
    areaOpacity: 30,
    gradientMode: 'none',
    tooltipOptions: {
      mode: 'all',
    },
    thresholdOptions: {
      baseColor: '#00BD6B',
      thresholds: [],
      thresholdStyle: ThresholdMode.Solid,
    },
    standardAxes: [],
    showFullTimeRange: false,
    stackMode: 'none',
    lineDashStyle: 'solid',
    lineMode: 'smooth',
    lineWidth: 2,
    pointSize: 0,
    showValues: false,
    connectNullValues: {
      connectMode: DisableMode.Never,
      threshold: '1h',
    },
    disconnectValues: {
      disableMode: DisableMode.Never,
      threshold: '1h',
    },
  };

  // Rows come back as a 2D array: [headers, ...rows]
  const seriesValues = (spec: any, seriesField: string) => {
    const [headers, ...rows] = spec.dataset.source;
    const columnIndex = headers.indexOf(seriesField);
    return rows.map((row: any[]) => row[columnIndex]);
  };

  describe('createSimpleAreaChart', () => {
    const axisColumnMappings = {
      [AxisRole.Y]: [mockNumericalColumn],
      [AxisRole.X]: mockDateColumn,
    };

    it('returns an ECharts spec with dataset, series, and axes', () => {
      const result = createSimpleAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec).toHaveProperty('xAxis');
      expect(result.spec).toHaveProperty('yAxis');
    });

    it('returns series with line type and area style', () => {
      const result = createSimpleAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);
      const mainSeries = result.spec.series[0];
      expect(mainSeries.type).toBe('line');
      expect(mainSeries).toHaveProperty('areaStyle');
    });

    it('emits series-target legend items while assigning metric colors', () => {
      const palette = getColors().categories;
      const result = createSimpleAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

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

    it('applies areaOpacity as a fraction of the 0-100 percentage', () => {
      const result = createSimpleAreaChart(
        mockTransformedData,
        { ...mockStyles, areaOpacity: 80 },
        axisColumnMappings
      );

      expect(result.spec.series[0].areaStyle.opacity).toBe(0.8);
    });

    it('falls back to the default fill opacity when areaOpacity is unset', () => {
      const stylesWithoutFillOpacity = { ...mockStyles };
      delete stylesWithoutFillOpacity.areaOpacity;

      const result = createSimpleAreaChart(
        mockTransformedData,
        stylesWithoutFillOpacity,
        axisColumnMappings
      );

      expect(result.spec.series[0].areaStyle.opacity).toBe(DEFAULT_FILL_OPACITY / 100);
    });

    it('uses a flat fill when gradientMode is none', () => {
      const result = createSimpleAreaChart(
        mockTransformedData,
        { ...mockStyles, gradientMode: 'none' },
        axisColumnMappings
      );

      expect(result.spec.series[0].areaStyle.color).toBeUndefined();
    });

    it('fades to transparent at the baseline when gradientMode is opacity', () => {
      const result = createSimpleAreaChart(
        mockTransformedData,
        { ...mockStyles, gradientMode: 'opacity' },
        axisColumnMappings
      );

      const fill = result.spec.series[0].areaStyle.color;
      // Vertical gradient: top of the bounding box down to the baseline
      expect(fill.x).toBe(0);
      expect(fill.y).toBe(0);
      expect(fill.x2).toBe(0);
      expect(fill.y2).toBe(1);
      expect(fill.colorStops[0].color).toBe(result.spec.series[0].itemStyle.color);
      expect(fill.colorStops[1].color).toBe('rgba(0, 0, 0, 0)');
    });

    it('fades to a lighter hue at the baseline when gradientMode is hue', () => {
      const result = createSimpleAreaChart(
        mockTransformedData,
        { ...mockStyles, gradientMode: 'hue' },
        axisColumnMappings
      );

      const fill = result.spec.series[0].areaStyle.color;
      const seriesColor = result.spec.series[0].itemStyle.color;
      expect(fill.colorStops[0].color).toBe(seriesColor);
      // The baseline stop is an opaque, lighter variant rather than transparent
      expect(fill.colorStops[1].color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(fill.colorStops[1].color).not.toBe(seriesColor);
    });

    it('does not add a time marker when addTimeMarker is disabled', () => {
      const result = createSimpleAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      const markLineData = result.spec.series[0].markLine?.data ?? [];
      expect(markLineData.some((d: any) => d.xAxis !== undefined)).toBe(false);
      expect(result.spec.xAxis.max).toBeUndefined();
    });

    it('adds a dashed time marker and extends the x-axis when addTimeMarker is enabled', () => {
      const result = createSimpleAreaChart(
        mockTransformedData,
        { ...mockStyles, addTimeMarker: true },
        axisColumnMappings
      );

      const timeMarker = result.spec.series[0].markLine.data.find(
        (d: any) => d.xAxis !== undefined
      );
      expect(timeMarker).toBeDefined();
      expect(timeMarker.lineStyle.type).toBe('dashed');
      // xAxis is extended to "now" so the marker stays inside the visible range
      expect(result.spec.xAxis.max).toBeInstanceOf(Date);
    });

    it('keeps threshold lines alongside the time marker', () => {
      const result = createSimpleAreaChart(
        mockTransformedData,
        {
          ...mockStyles,
          addTimeMarker: true,
          thresholdOptions: {
            baseColor: '#00BD6B',
            thresholds: [{ value: 15, color: '#E7664C' }],
            thresholdStyle: ThresholdMode.Solid,
          },
        },
        axisColumnMappings
      );

      const markLineData = result.spec.series[0].markLine.data;
      expect(markLineData.some((d: any) => d.yAxis === 15)).toBe(true);
      expect(markLineData.some((d: any) => d.xAxis !== undefined)).toBe(true);
    });

    it('does not stack series when stackMode is none', () => {
      const result = createSimpleAreaChart(
        mockTransformedData,
        { ...mockStyles, stackMode: 'none' },
        axisColumnMappings
      );

      expect(result.spec.series[0].stack).toBeUndefined();
      expect(result.spec.yAxis.max).toBeUndefined();
    });

    it('stacks series without rescaling when stackMode is total', () => {
      const result = createSimpleAreaChart(
        mockTransformedData,
        { ...mockStyles, stackMode: 'total' },
        axisColumnMappings
      );

      expect(result.spec.series.every((s: any) => s.stack === 'total')).toBe(true);
      // Raw values are preserved and the axis stays auto-scaled
      expect(seriesValues(result.spec, 'value')).toEqual([10, 5, 20, 15, 15, 25]);
      expect(result.spec.yAxis.max).toBeUndefined();
    });

    it('stacks but does not normalize when stackMode is percentage', () => {
      // Percentage normalization is intentionally not applied to the single-metric chart:
      // a percentage across unrelated metrics on shared axes is not meaningful.
      const result = createSimpleAreaChart(
        mockTransformedData,
        { ...mockStyles, stackMode: 'percentage' },
        axisColumnMappings
      );

      expect(result.spec.series.every((s: any) => s.stack === 'total')).toBe(true);
      expect(seriesValues(result.spec, 'value')).toEqual([10, 5, 20, 15, 15, 25]);
      expect(result.spec.yAxis.max).toBeUndefined();
    });

    describe('border line style', () => {
      const borderOf = (styles: Partial<AreaChartStyle>) =>
        createSimpleAreaChart(mockTransformedData, { ...mockStyles, ...styles }, axisColumnMappings)
          .spec.series[0];

      it.each([
        ['solid', 'solid'],
        ['dashed', [5, 3]],
        ['dotted', [2, 3]],
      ])('maps the %s dash style onto lineStyle.type', (lineDashStyle, expected) => {
        expect(borderOf({ lineDashStyle } as Partial<AreaChartStyle>).lineStyle.type).toEqual(
          expected
        );
      });

      it.each([
        // `straight` is ECharts' own default, so it sets no flag at all
        ['straight', { smooth: undefined, step: undefined }],
        ['smooth', { smooth: true, step: undefined }],
        ['stepped', { smooth: undefined, step: true }],
      ])('maps the %s interpolation onto the series flags', (lineMode, expected) => {
        const series = borderOf({ lineMode } as Partial<AreaChartStyle>);

        expect(series.smooth).toBe(expected.smooth);
        expect(series.step).toBe(expected.step);
      });

      it('applies the configured line width', () => {
        expect(borderOf({ lineWidth: 7 }).lineStyle.width).toBe(7);
      });

      it('falls back to a solid, smooth, 2px border when nothing is configured', () => {
        // A chart saved before the border was configurable rendered smooth, so an
        // unset lineMode has to keep doing that rather than dropping to straight.
        const { lineDashStyle, lineMode, lineWidth, ...styles } = mockStyles;

        const series = createSimpleAreaChart(
          mockTransformedData,
          styles as AreaChartStyle,
          axisColumnMappings
        ).spec.series[0];

        expect(series.lineStyle).toEqual({ type: 'solid', width: 2 });
        expect(series.smooth).toBe(true);
      });
    });

    describe('point size', () => {
      const seriesOf = (styles: Partial<AreaChartStyle>) =>
        createSimpleAreaChart(mockTransformedData, { ...mockStyles, ...styles }, axisColumnMappings)
          .spec.series[0];

      it('hides the symbols when the point size is 0', () => {
        const series = seriesOf({ pointSize: 0 });

        expect(series.showSymbol).toBe(false);
        // ECharts still reserves hit area for a zero-sized symbol, so no size is set
        expect(series.symbolSize).toBeUndefined();
      });

      it('shows the symbols at the configured size', () => {
        const series = seriesOf({ pointSize: 8 });

        expect(series.showSymbol).toBe(true);
        expect(series.symbolSize).toBe(8);
      });

      it('falls back to the shared default when the point size is unset', () => {
        const series = seriesOf({ pointSize: undefined });

        expect(series.showSymbol).toBe(true);
        expect(series.symbolSize).toBe(DEFAULT_POINT_SIZE);
      });

      it('keeps zero-sized symbols alive so value labels can attach to them', () => {
        // ECharts hangs point labels off the symbol elements and skips creating them
        // when showSymbol is false, which would drop the labels along with the points
        const series = seriesOf({ pointSize: 0, showValues: true });

        expect(series.showSymbol).toBe(true);
        expect(series.symbolSize).toBe(0);
      });
    });

    describe('value labels', () => {
      const labelOf = (styles: Partial<AreaChartStyle>) =>
        createSimpleAreaChart(mockTransformedData, { ...mockStyles, ...styles }, axisColumnMappings)
          .spec.series[0].label;

      it('is off by default and positioned above the point', () => {
        const label = labelOf({ showValues: false });

        expect(label.show).toBe(false);
        expect(label.position).toBe('top');
      });

      it('turns the labels on when showValues is set', () => {
        expect(labelOf({ showValues: true }).show).toBe(true);
      });

      it('is off when showValues is unset', () => {
        expect(labelOf({ showValues: undefined }).show).toBe(false);
      });

      it('lets echarts drop colliding labels', () => {
        const series = createSimpleAreaChart(
          mockTransformedData,
          { ...mockStyles, showValues: true },
          axisColumnMappings
        ).spec.series[0];

        expect(series.labelLayout).toEqual({ hideOverlap: true });
      });

      it('rounds the formatted value to two decimals', () => {
        const { formatter } = labelOf({ showValues: true });
        // The dataset source is a 2D array, so echarts hands the formatter the row
        // array plus the dimension names to look the field up by
        const dimensionNames = ['date', 'value'];

        expect(formatter({ value: ['2023-01-01', 12.3456], dimensionNames })).toBe('12.35');
        expect(formatter({ value: ['2023-01-01', 10], dimensionNames })).toBe('10');
      });

      it('formats a missing or non-numeric value as empty', () => {
        const { formatter } = labelOf({ showValues: true });
        const dimensionNames = ['date', 'value'];

        expect(formatter({ value: ['2023-01-01', null], dimensionNames })).toBe('');
        expect(formatter({ value: ['2023-01-01', 10], dimensionNames: ['date', 'other'] })).toBe(
          ''
        );
        expect(formatter({})).toBe('');
      });

      it('labels every row of the spec dataset it is paired with', () => {
        // Drives the formatter off the real dataset rather than a hand-built row, so a
        // mismatch between the encoded field and the dataset headers cannot pass
        const { spec } = createSimpleAreaChart(
          mockTransformedData,
          { ...mockStyles, showValues: true },
          axisColumnMappings
        );
        const [dimensionNames, ...rows] = spec.dataset.source;
        const { formatter } = spec.series[0].label;

        // Every row must produce its own value, not the empty string the formatter
        // falls back to when it cannot resolve the field
        expect(rows.map((value: any[]) => formatter({ value, dimensionNames }))).toEqual(
          seriesValues(spec, 'value').map(String)
        );
        expect(rows.length).toBeGreaterThan(0);
      });
    });
  });

  describe('createMultiAreaChart', () => {
    const axisColumnMappings = {
      [AxisRole.Y]: mockNumericalColumn,
      [AxisRole.X]: mockDateColumn,
      [AxisRole.COLOR]: mockCategoricalColumns[0],
    };

    it('returns an ECharts spec with multiple series for each category', () => {
      const result = createMultiAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);
    });

    it('uses provided full data when assigning color series colors', () => {
      const palette = getColors().categories;
      const result = createMultiAreaChart(
        [
          { date: '2023-01-01', value: 10, category: 'A' },
          { date: '2023-01-03', value: 15, category: 'C' },
        ],
        mockStyles,
        axisColumnMappings,
        undefined,
        [
          { date: '2023-01-01', value: 10, category: 'A' },
          { date: '2023-01-02', value: 20, category: 'B' },
          { date: '2023-01-03', value: 15, category: 'C' },
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

    it('leaves series unstacked and keeps null gaps when stackMode is none', () => {
      const result = createMultiAreaChart(
        [
          { date: '2023-01-01', value: 10, category: 'A' },
          { date: '2023-01-02', value: 20, category: 'B' },
        ],
        { ...mockStyles, stackMode: 'none' },
        axisColumnMappings
      );

      expect(result.spec.series.every((s: any) => s.stack === undefined)).toBe(true);
      // 'A' has no value at 2023-01-02, so the gap stays null instead of being zero-filled
      expect(seriesValues(result.spec, 'A')).toEqual([10, null]);
    });

    it('stacks series and zero-fills gaps when stackMode is total', () => {
      const result = createMultiAreaChart(
        [
          { date: '2023-01-01', value: 10, category: 'A' },
          { date: '2023-01-02', value: 20, category: 'B' },
        ],
        { ...mockStyles, stackMode: 'total' },
        axisColumnMappings
      );

      expect(result.spec.series.every((s: any) => s.stack === 'total')).toBe(true);
      expect(seriesValues(result.spec, 'A')).toEqual([10, 0]);
    });

    it('normalizes each time point to sum to 100 when stackMode is percentage', () => {
      const result = createMultiAreaChart(
        [
          { date: '2023-01-01', value: 30, category: 'A' },
          { date: '2023-01-01', value: 10, category: 'B' },
          { date: '2023-01-02', value: 25, category: 'A' },
          { date: '2023-01-02', value: 25, category: 'B' },
        ],
        { ...mockStyles, stackMode: 'percentage' },
        axisColumnMappings
      );

      expect(result.spec.series.every((s: any) => s.stack === 'total')).toBe(true);
      expect(seriesValues(result.spec, 'A')).toEqual([75, 50]);
      expect(seriesValues(result.spec, 'B')).toEqual([25, 50]);
      expect(result.spec.yAxis.min).toBe(0);
      expect(result.spec.yAxis.max).toBe(100);
    });

    it('keeps mixed-sign rows bounded by dividing by the sum of magnitudes', () => {
      const result = createMultiAreaChart(
        [
          { date: '2023-01-01', value: 1000, category: 'A' },
          { date: '2023-01-01', value: -999, category: 'B' },
        ],
        { ...mockStyles, stackMode: 'percentage' },
        axisColumnMappings
      );

      // A signed total would collapse to 1 here and blow A up to 100000%.
      // Dividing by 1000 + 999 keeps both within +/-100%.
      expect(seriesValues(result.spec, 'A')[0]).toBeCloseTo(50.03, 2);
      expect(seriesValues(result.spec, 'B')[0]).toBeCloseTo(-49.97, 2);
    });

    it('preserves relative magnitude across signs', () => {
      const result = createMultiAreaChart(
        [
          { date: '2023-01-01', value: 100, category: 'A' },
          { date: '2023-01-01', value: -30, category: 'B' },
        ],
        { ...mockStyles, stackMode: 'percentage' },
        axisColumnMappings
      );

      // The 100:30 ratio survives, so a -30 stays visually distinct from a -999
      expect(seriesValues(result.spec, 'A')[0]).toBeCloseTo(76.92, 2);
      expect(seriesValues(result.spec, 'B')[0]).toBeCloseTo(-23.08, 2);
    });

    it('does not flip signs on net-negative rows', () => {
      const result = createMultiAreaChart(
        [
          { date: '2023-01-01', value: 30, category: 'A' },
          { date: '2023-01-01', value: -70, category: 'B' },
        ],
        { ...mockStyles, stackMode: 'percentage' },
        axisColumnMappings
      );

      // A signed total of -40 would render the positive 30 as -75%
      expect(seriesValues(result.spec, 'A')).toEqual([30]);
      expect(seriesValues(result.spec, 'B')).toEqual([-70]);
    });

    it('opens the axis to -100 only when negative values are present', () => {
      const allPositive = createMultiAreaChart(
        [
          { date: '2023-01-01', value: 30, category: 'A' },
          { date: '2023-01-01', value: 10, category: 'B' },
        ],
        { ...mockStyles, stackMode: 'percentage' },
        axisColumnMappings
      );
      expect(allPositive.spec.yAxis.min).toBe(0);

      const mixed = createMultiAreaChart(
        [
          { date: '2023-01-01', value: 30, category: 'A' },
          { date: '2023-01-01', value: -70, category: 'B' },
        ],
        { ...mockStyles, stackMode: 'percentage' },
        axisColumnMappings
      );
      expect(mixed.spec.yAxis.min).toBe(-100);
      expect(mixed.spec.yAxis.max).toBe(100);
    });

    it('does not divide by zero when a row is all zeros', () => {
      const result = createMultiAreaChart(
        [
          { date: '2023-01-01', value: 0, category: 'A' },
          { date: '2023-01-01', value: 0, category: 'B' },
        ],
        { ...mockStyles, stackMode: 'percentage' },
        axisColumnMappings
      );

      expect(seriesValues(result.spec, 'A')).toEqual([0]);
      expect(seriesValues(result.spec, 'B')).toEqual([0]);
    });

    describe('connect null values', () => {
      // 'A' reports at :00 and :30 but is missing at :10; 'B' covers every point,
      // so the pivot leaves a single-row null gap in 'A'.
      const gapData = [
        { date: '2023-01-01T00:00:00Z', value: 10, category: 'A' },
        { date: '2023-01-01T00:00:00Z', value: 1, category: 'B' },
        { date: '2023-01-01T00:10:00Z', value: 2, category: 'B' },
        { date: '2023-01-01T00:30:00Z', value: 30, category: 'A' },
        { date: '2023-01-01T00:30:00Z', value: 3, category: 'B' },
      ];

      it('leaves gaps as breaks by default', () => {
        const result = createMultiAreaChart(gapData, mockStyles, axisColumnMappings);

        expect(result.spec.series.every((s: any) => s.connectNulls === false)).toBe(true);
        expect(seriesValues(result.spec, 'A')).toEqual([10, null, 30]);
      });

      it('turns on connectNulls when the mode is always', () => {
        const result = createMultiAreaChart(
          gapData,
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Always, threshold: '1h' },
          },
          axisColumnMappings
        );

        expect(result.spec.series.every((s: any) => s.connectNulls === true)).toBe(true);
        // ECharts bridges it at render time, so the null stays in the dataset
        expect(seriesValues(result.spec, 'A')).toEqual([10, null, 30]);
      });

      it('interpolates gaps shorter than the threshold', () => {
        const result = createMultiAreaChart(
          gapData,
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Threshold, threshold: '1h' },
          },
          axisColumnMappings
        );

        // The 30m gap fits under 1h, so :10 lands 1/3 of the way from 10 to 30
        expect(result.spec.series.every((s: any) => s.connectNulls === false)).toBe(true);
        const values = seriesValues(result.spec, 'A');
        expect(values[0]).toBe(10);
        expect(values[1]).toBeCloseTo(16.6667, 4);
        expect(values[2]).toBe(30);
      });

      it('leaves gaps longer than the threshold as breaks', () => {
        const result = createMultiAreaChart(
          gapData,
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Threshold, threshold: '5m' },
          },
          axisColumnMappings
        );

        expect(seriesValues(result.spec, 'A')).toEqual([10, null, 30]);
      });

      it('ignores an unparseable threshold instead of reshaping the data', () => {
        const result = createMultiAreaChart(
          gapData,
          {
            ...mockStyles,
            connectNullValues: { connectMode: DisableMode.Threshold, threshold: '5' },
          },
          axisColumnMappings
        );

        expect(seriesValues(result.spec, 'A')).toEqual([10, null, 30]);
      });
    });

    describe('disconnect values', () => {
      // Two valid points 1h apart, with no nulls between them.
      const sparseData = [
        { date: '2023-01-01T00:00:00Z', value: 10, category: 'A' },
        { date: '2023-01-01T01:00:00Z', value: 30, category: 'A' },
      ];

      it('keeps everything connected by default', () => {
        const result = createMultiAreaChart(sparseData, mockStyles, axisColumnMappings);

        expect(seriesValues(result.spec, 'A')).toEqual([10, 30]);
      });

      it('inserts a break when the gap exceeds the threshold', () => {
        const result = createMultiAreaChart(
          sparseData,
          {
            ...mockStyles,
            disconnectValues: { disableMode: DisableMode.Threshold, threshold: '10m' },
          },
          axisColumnMappings
        );

        // A null row lands 10m past the first point, splitting the area in two
        expect(seriesValues(result.spec, 'A')).toEqual([10, null, 30]);
        expect(result.spec.series.every((s: any) => s.connectNulls === false)).toBe(true);
      });

      it('leaves gaps within the threshold untouched', () => {
        const result = createMultiAreaChart(
          sparseData,
          {
            ...mockStyles,
            disconnectValues: { disableMode: DisableMode.Threshold, threshold: '2h' },
          },
          axisColumnMappings
        );

        expect(seriesValues(result.spec, 'A')).toEqual([10, 30]);
      });

      it('keeps the break visible in a stacked area', () => {
        const result = createMultiAreaChart(
          sparseData,
          {
            ...mockStyles,
            stackMode: 'total',
            disconnectValues: { disableMode: DisableMode.Threshold, threshold: '10m' },
          },
          axisColumnMappings
        );

        // The break is inserted after replaceNullWithZero, so it survives as a null
        expect(seriesValues(result.spec, 'A')).toEqual([10, null, 30]);
      });
    });
  });

  describe('createCategoryAreaChart', () => {
    const axisColumnMappings = {
      [AxisRole.Y]: [mockNumericalColumn],
      [AxisRole.X]: mockCategoricalColumns[0],
    };

    it('returns an ECharts spec for category-based area chart', () => {
      const result = createCategoryAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);
    });

    it('emits series-target legend items for category-based metric areas', () => {
      const palette = getColors().categories;
      const result = createCategoryAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result.legendItems).toEqual([
        {
          label: 'Value',
          color: palette[0],
          target: { type: 'series', name: 'Value' },
        },
      ]);
    });

    it('ignores addTimeMarker because the x-axis is categorical', () => {
      const result = createCategoryAreaChart(
        mockTransformedData,
        { ...mockStyles, addTimeMarker: true },
        axisColumnMappings
      );

      const markLineData = result.spec.series[0].markLine?.data ?? [];
      expect(markLineData.some((d: any) => d.xAxis !== undefined)).toBe(false);
      expect(result.spec.xAxis.max).toBeUndefined();
    });

    it('applies the stack mode to category-based areas', () => {
      const stacked = createCategoryAreaChart(
        mockTransformedData,
        { ...mockStyles, stackMode: 'total' },
        axisColumnMappings
      );
      expect(stacked.spec.series.every((s: any) => s.stack === 'total')).toBe(true);
    });

    it('stacks but does not normalize when stackMode is percentage', () => {
      // Like the single-metric chart, percentage normalization is intentionally not
      // applied here: the series are unrelated metrics sharing one axis, so a
      // percentage across them is not meaningful.
      const percentage = createCategoryAreaChart(
        mockTransformedData,
        { ...mockStyles, stackMode: 'percentage' },
        axisColumnMappings
      );

      expect(percentage.spec.series.every((s: any) => s.stack === 'total')).toBe(true);
      expect(percentage.spec.yAxis.max).toBeUndefined();
    });
  });

  describe('createStackedAreaChart', () => {
    const axisColumnMappings = {
      [AxisRole.Y]: mockNumericalColumn,
      [AxisRole.X]: mockCategoricalColumns[0],
      [AxisRole.COLOR]: mockCategoricalColumns[1],
    };

    it('returns an ECharts spec with stacked series', () => {
      const result = createStackedAreaChart(
        mockTransformedData,
        { ...mockStyles, stackMode: 'total' },
        axisColumnMappings
      );

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec.series.length).toBeGreaterThanOrEqual(1);

      // Verify stacked series
      const mainSeries = result.spec.series[0];
      expect(mainSeries.type).toBe('line');
      expect(mainSeries).toHaveProperty('areaStyle');
      expect(mainSeries.stack).toBe('total');
    });

    it('does not stack by default', () => {
      const result = createStackedAreaChart(mockTransformedData, mockStyles, axisColumnMappings);

      expect(result.spec.series.every((s: any) => s.stack === undefined)).toBe(true);
    });

    it('normalizes each category to sum to 100 when stackMode is percentage', () => {
      const result = createStackedAreaChart(
        [
          { category: 'A', value: 30, category2: 'X' },
          { category: 'A', value: 10, category2: 'Y' },
          { category: 'B', value: 20, category2: 'X' },
          { category: 'B', value: 20, category2: 'Y' },
        ],
        { ...mockStyles, stackMode: 'percentage' },
        axisColumnMappings
      );

      expect(result.spec.series.every((s: any) => s.stack === 'total')).toBe(true);
      expect(seriesValues(result.spec, 'X')).toEqual([75, 50]);
      expect(seriesValues(result.spec, 'Y')).toEqual([25, 50]);
      expect(result.spec.yAxis.min).toBe(0);
      expect(result.spec.yAxis.max).toBe(100);
      expect(result.spec.yAxis.axisLabel.formatter).toBe('{value}%');
    });

    it('uses provided full data when assigning stacked color series colors', () => {
      const palette = getColors().categories;
      const result = createStackedAreaChart(
        [
          { category: 'A', value: 10, category2: 'X' },
          { category: 'C', value: 15, category2: 'Z' },
        ],
        mockStyles,
        axisColumnMappings,
        [
          { category: 'A', value: 10, category2: 'X' },
          { category: 'B', value: 20, category2: 'Y' },
          { category: 'C', value: 15, category2: 'Z' },
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

      const result = createStackedAreaChart(
        mockTransformedData,
        stylesWithThreshold,
        axisColumnMappings
      );

      // ECharts uses markLine within series for thresholds
      const seriesWithMarkLine = result.spec.series.find((s: any) => s.markLine);
      expect(seriesWithMarkLine).toBeDefined();
      expect(seriesWithMarkLine.markLine.data[0].yAxis).toBe(15);
    });
  });
});
