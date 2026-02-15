/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment-timezone';
import {
  getSmartDateFormat,
  getTimezone,
  findMinInterval,
  createNowMarkLine,
  createPartialDataMarkArea,
  truncateText,
  createTooltipFormatter,
  normalizeSeriesData,
  createBarSeries,
  createLineSeries,
  createHistogramSpec,
  COLOR_INDICATOR_WIDTH,
  COLOR_INDICATOR_HEIGHT,
} from './echarts_histogram_utils';

// Mock getColors
jest.mock('../../visualizations/theme/default_colors', () => ({
  getColors: () => ({
    categories: ['#54B399', '#6092C0', '#D36086', '#9170B8', '#CA8EAE'],
    text: '#333',
    grid: '#eaecf4',
  }),
}));

describe('echarts_histogram_utils', () => {
  describe('getSmartDateFormat', () => {
    it('returns milliseconds format for sub-minute ranges', () => {
      const thirtySeconds = 30 * 1000;
      expect(getSmartDateFormat(thirtySeconds)).toBe('HH:mm:ss.SSS');
    });

    it('returns seconds format for sub-hour ranges', () => {
      const thirtyMinutes = 30 * 60 * 1000;
      expect(getSmartDateFormat(thirtyMinutes)).toBe('HH:mm:ss');
    });

    it('returns time format for sub-day ranges', () => {
      const twelveHours = 12 * 60 * 60 * 1000;
      expect(getSmartDateFormat(twelveHours)).toBe('HH:mm');
    });

    it('returns day and time format for 1-7 day ranges', () => {
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      expect(getSmartDateFormat(threeDays)).toBe('MMM D, HH:mm');
    });

    it('returns month and day format for week to 2 month ranges', () => {
      const threeWeeks = 21 * 24 * 60 * 60 * 1000;
      expect(getSmartDateFormat(threeWeeks)).toBe('MMM D');
    });

    it('returns month format for 2 months to 1 year ranges', () => {
      const sixMonths = 180 * 24 * 60 * 60 * 1000;
      expect(getSmartDateFormat(sixMonths)).toBe('MMM');
    });

    it('returns month and year format for over 1 year ranges', () => {
      const twoYears = 730 * 24 * 60 * 60 * 1000;
      expect(getSmartDateFormat(twoYears)).toBe('MMM YYYY');
    });
  });

  describe('getTimezone', () => {
    it('returns detected timezone when dateFormat:tz is default', () => {
      const mockUiSettings = {
        isDefault: jest.fn(() => true),
        get: jest.fn(),
      };

      const result = getTimezone(mockUiSettings as any);
      expect(mockUiSettings.isDefault).toHaveBeenCalledWith('dateFormat:tz');
      // Result should be a valid timezone string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns configured timezone when dateFormat:tz is set', () => {
      const mockUiSettings = {
        isDefault: jest.fn(() => false),
        get: jest.fn(() => 'America/New_York'),
      };

      const result = getTimezone(mockUiSettings as any);
      expect(result).toBe('America/New_York');
      expect(mockUiSettings.get).toHaveBeenCalledWith('dateFormat:tz', 'Browser');
    });
  });

  describe('findMinInterval', () => {
    it('calculates minimum interval for hourly data', () => {
      const xValues = [1609459200000, 1609462800000, 1609466400000]; // 1-hour intervals
      const result = findMinInterval(xValues, 1, 'h', 'UTC');
      expect(result).toBe(3600000); // 1 hour in ms
    });

    it('calculates minimum interval for minute data', () => {
      const xValues = [1609459200000, 1609459500000, 1609459800000]; // 5-minute intervals
      const result = findMinInterval(xValues, 5, 'm', 'UTC');
      expect(result).toBe(300000); // 5 minutes in ms
    });

    it('calculates minimum interval for second data', () => {
      const xValues = [1609459200000, 1609459210000, 1609459220000]; // 10-second intervals
      const result = findMinInterval(xValues, 10, 's', 'UTC');
      expect(result).toBe(10000); // 10 seconds in ms
    });

    it('returns MAX_SAFE_INTEGER for empty array', () => {
      const result = findMinInterval([], 1, 'h', 'UTC');
      expect(result).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('createNowMarkLine', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns undefined when now is far from domain end', () => {
      // Set current time to be way before domainEnd
      jest.setSystemTime(new Date('2020-01-01T00:00:00Z'));
      const domainEnd = new Date('2021-01-01T00:00:00Z').getTime();

      const result = createNowMarkLine(domainEnd);
      expect(result).toBeUndefined();
    });

    it('returns mark line when now is near domain end', () => {
      const now = new Date('2021-01-01T12:00:00Z');
      jest.setSystemTime(now);
      const domainEnd = now.getTime() - 30000; // 30 seconds before now

      const result = createNowMarkLine(domainEnd);
      expect(result).toBeDefined();
      expect(result?.symbol).toBe('none');
      expect(result?.silent).toBe(true);
      expect(result?.lineStyle?.width).toBe(2);
      expect(result?.lineStyle?.opacity).toBe(0.7);
    });
  });

  describe('createPartialDataMarkArea', () => {
    it('returns undefined when domain equals data range', () => {
      const result = createPartialDataMarkArea(1000, 2000, 1000, 2000, false);
      expect(result).toBeUndefined();
    });

    it('creates left partial area when data starts after domain', () => {
      const result = createPartialDataMarkArea(1000, 2000, 1200, 2000, false);
      expect(result).toBeDefined();
      expect(result?.data).toHaveLength(1);
      expect(result?.data?.[0]).toEqual([{ xAxis: 1000 }, { xAxis: 1200 }]);
    });

    it('creates right partial area when data ends before domain', () => {
      const result = createPartialDataMarkArea(1000, 2000, 1000, 1800, false);
      expect(result).toBeDefined();
      expect(result?.data).toHaveLength(1);
      expect(result?.data?.[0]).toEqual([{ xAxis: 1800 }, { xAxis: 2000 }]);
    });

    it('creates both partial areas when data is subset of domain', () => {
      const result = createPartialDataMarkArea(1000, 2000, 1200, 1800, false);
      expect(result).toBeDefined();
      expect(result?.data).toHaveLength(2);
    });

    it('uses different opacity for dark mode', () => {
      const lightResult = createPartialDataMarkArea(1000, 2000, 1200, 2000, false);
      const darkResult = createPartialDataMarkArea(1000, 2000, 1200, 2000, true);

      expect(lightResult?.itemStyle?.opacity).toBe(0.2);
      expect(darkResult?.itemStyle?.opacity).toBe(0.6);
    });
  });

  describe('truncateText', () => {
    it('returns original text if shorter than max length', () => {
      expect(truncateText('short', 10)).toBe('short');
    });

    it('returns original text if equal to max length', () => {
      expect(truncateText('exactly10!', 10)).toBe('exactly10!');
    });

    it('truncates text and adds ellipsis if longer than max length', () => {
      expect(truncateText('this is a very long text', 10)).toBe('this is...');
    });

    it('handles empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });
  });

  describe('createTooltipFormatter', () => {
    it('creates a formatter function', () => {
      const formatter = createTooltipFormatter(3600000, 1000, 5000, 'YYYY-MM-DD', '#333');
      expect(typeof formatter).toBe('function');
    });

    it('returns empty string for empty params array', () => {
      const formatter = createTooltipFormatter(3600000, 1000, 5000, 'YYYY-MM-DD', '#333');
      const result = (formatter as Function)([]);
      expect(result).toBe('');
    });

    it('formats single series tooltip', () => {
      const formatter = createTooltipFormatter(
        3600000,
        1609459200000,
        1609466400000,
        'HH:mm',
        '#333'
      );
      const params = [
        {
          value: [1609462800000, 100],
          seriesName: 'Count',
          color: '#54B399',
        },
      ];
      const result = (formatter as Function)(params);
      expect(result).toContain('Count');
      expect(result).toContain('100');
    });

    it('includes partial data warning when timestamp is outside domain', () => {
      const formatter = createTooltipFormatter(
        3600000,
        1609459200000,
        1609466400000,
        'HH:mm',
        '#333'
      );
      const params = [
        {
          value: [1609455600000, 100], // Before domain start
          seriesName: 'Count',
          color: '#54B399',
        },
      ];
      const result = (formatter as Function)(params);
      expect(result).toContain('Partial bucket');
    });

    it('applies text color to tooltip content', () => {
      const textColor = '#FF0000';
      const formatter = createTooltipFormatter(
        3600000,
        1609459200000,
        1609466400000,
        'HH:mm',
        textColor
      );
      const params = [
        {
          value: [1609462800000, 100],
          seriesName: 'Count',
          color: '#54B399',
        },
      ];
      const result = (formatter as Function)(params);
      expect(result).toContain(`color: ${textColor}`);
    });

    it('renders color indicator with dimensions matching legend icon', () => {
      const formatter = createTooltipFormatter(
        3600000,
        1609459200000,
        1609466400000,
        'HH:mm',
        '#333'
      );
      const params = [
        {
          value: [1609462800000, 100],
          seriesName: 'Count',
          color: '#54B399',
        },
      ];
      const result = (formatter as Function)(params);
      // Verify color indicator dimensions match legend icon constants
      expect(result).toContain(`width: ${COLOR_INDICATOR_WIDTH}px`);
      expect(result).toContain(`height: ${COLOR_INDICATOR_HEIGHT}px`);
      // Verify subtle border for accessibility
      expect(result).toContain('border: 1px solid rgba(0,0,0,0.1)');
    });
  });

  describe('normalizeSeriesData', () => {
    it('returns empty array for empty input', () => {
      const result = normalizeSeriesData([]);
      expect(result).toEqual([]);
    });

    it('returns unchanged series when single series', () => {
      const series = [
        {
          id: 's1',
          name: 'Series 1',
          data: [
            { x: 1000, y: 10 },
            { x: 2000, y: 20 },
          ],
        },
      ];
      const result = normalizeSeriesData(series);
      expect(result).toHaveLength(1);
      expect(result[0].data).toHaveLength(2);
    });

    it('fills missing x values with 0 for multiple series', () => {
      const series = [
        {
          id: 's1',
          name: 'Series 1',
          data: [
            { x: 1000, y: 10 },
            { x: 3000, y: 30 },
          ],
        },
        {
          id: 's2',
          name: 'Series 2',
          data: [
            { x: 2000, y: 20 },
            { x: 3000, y: 35 },
          ],
        },
      ];
      const result = normalizeSeriesData(series);

      // Both series should have all 3 x values
      expect(result[0].data).toHaveLength(3);
      expect(result[1].data).toHaveLength(3);

      // Series 1 should have 0 at x=2000
      expect(result[0].data).toEqual([
        { x: 1000, y: 10 },
        { x: 2000, y: 0 },
        { x: 3000, y: 30 },
      ]);

      // Series 2 should have 0 at x=1000
      expect(result[1].data).toEqual([
        { x: 1000, y: 0 },
        { x: 2000, y: 20 },
        { x: 3000, y: 35 },
      ]);
    });

    it('preserves series id and name', () => {
      const series = [{ id: 'test-id', name: 'Test Name', data: [{ x: 1000, y: 10 }] }];
      const result = normalizeSeriesData(series);
      expect(result[0].id).toBe('test-id');
      expect(result[0].name).toBe('Test Name');
    });
  });

  describe('createBarSeries', () => {
    const testData = [
      { x: 1609459200000, y: 10 },
      { x: 1609462800000, y: 20 },
    ];

    it('creates bar series with required properties', () => {
      const series = createBarSeries('test-id', 'Test Series', testData, '#54B399');

      expect(series.type).toBe('bar');
      expect(series.id).toBe('test-id');
      expect(series.name).toBe('Test Series');
      expect(series.data).toEqual([
        [1609459200000, 10],
        [1609462800000, 20],
      ]);
      expect(series.itemStyle?.color).toBe('#54B399');
    });

    it('includes markLine when provided', () => {
      const markLine = { data: [{ xAxis: 1609459200000 }] };
      const series = createBarSeries('test-id', 'Test', testData, '#54B399', markLine as any);

      expect(series.markLine).toBeDefined();
    });

    it('includes markArea when provided', () => {
      const markArea = { data: [[{ xAxis: 1000 }, { xAxis: 2000 }]] };
      const series = createBarSeries(
        'test-id',
        'Test',
        testData,
        '#54B399',
        undefined,
        markArea as any
      );

      expect(series.markArea).toBeDefined();
    });

    it('includes stack when provided', () => {
      const series = createBarSeries(
        'test-id',
        'Test',
        testData,
        '#54B399',
        undefined,
        undefined,
        'total'
      );

      expect(series.stack).toBe('total');
    });

    it('does not include stack when not provided', () => {
      const series = createBarSeries('test-id', 'Test', testData, '#54B399');

      expect(series.stack).toBeUndefined();
    });

    it('caps bar max width at 50 pixels', () => {
      const series = createBarSeries('test-id', 'Test', testData, '#54B399');

      expect(series.barMaxWidth).toBe(50);
    });

    it('includes emphasis.focus set to series for legend hover highlighting', () => {
      const series = createBarSeries('test-id', 'Test', testData, '#54B399');

      expect(series.emphasis?.focus).toBe('series');
    });
  });

  describe('createLineSeries', () => {
    const testData = [
      { x: 1609459200000, y: 10 },
      { x: 1609462800000, y: 20 },
    ];

    it('creates line series with required properties', () => {
      const series = createLineSeries('test-id', 'Test Series', testData, '#54B399');

      expect(series.type).toBe('line');
      expect(series.id).toBe('test-id');
      expect(series.name).toBe('Test Series');
      expect(series.data).toEqual([
        [1609459200000, 10],
        [1609462800000, 20],
      ]);
      expect(series.lineStyle?.color).toBe('#54B399');
      expect(series.smooth).toBe(false);
      expect(series.symbol).toBe('circle');
    });

    it('includes markLine when provided', () => {
      const markLine = { data: [{ xAxis: 1609459200000 }] };
      const series = createLineSeries('test-id', 'Test', testData, '#54B399', markLine as any);

      expect(series.markLine).toBeDefined();
    });
  });

  describe('createHistogramSpec', () => {
    const mockChartData = {
      values: [
        { x: 1609459200000, y: 10 },
        { x: 1609462800000, y: 15 },
      ],
      xAxisOrderedValues: [1609459200000, 1609462800000],
      xAxisFormat: { id: 'date', params: { pattern: 'YYYY-MM-DD' } },
      xAxisLabel: 'timestamp',
      yAxisLabel: 'Count',
      ordered: {
        date: true,
        interval: { asMilliseconds: () => 3600000 },
        intervalOpenSearchUnit: 'h',
        intervalOpenSearchValue: 1,
        min: { valueOf: () => 1609459200000 },
        max: { valueOf: () => 1609466400000 },
      },
    };

    const defaultOptions = {
      chartType: 'HistogramBar' as const,
      timeZone: 'UTC',
      isDarkMode: false,
      showYAxisLabel: false,
    };

    it('creates spec for histogram bar chart', () => {
      const spec = createHistogramSpec(mockChartData as any, defaultOptions);

      expect(spec.xAxis).toBeDefined();
      expect(spec.yAxis).toBeDefined();
      expect(spec.series).toBeDefined();
      expect((spec.series as any[])[0].type).toBe('bar');
    });

    it('creates spec for line chart', () => {
      const spec = createHistogramSpec(mockChartData as any, {
        ...defaultOptions,
        chartType: 'Line',
      });

      expect((spec.series as any[])[0].type).toBe('line');
    });

    it('applies custom color when provided', () => {
      const spec = createHistogramSpec(mockChartData as any, {
        ...defaultOptions,
        customColor: '#FF0000',
      });

      expect((spec.series as any[])[0].itemStyle.color).toBe('#FF0000');
    });

    it('shows legend for multiple series', () => {
      const chartDataWithSeries = {
        ...mockChartData,
        series: [
          { id: 's1', name: 'Series 1', data: [{ x: 1609459200000, y: 5 }] },
          { id: 's2', name: 'Series 2', data: [{ x: 1609459200000, y: 10 }] },
        ],
      };

      const spec = createHistogramSpec(chartDataWithSeries as any, defaultOptions);

      expect((spec.legend as any).show).toBe(true);
      expect(spec.series as any[]).toHaveLength(2);
    });

    it('hides legend for single series', () => {
      const spec = createHistogramSpec(mockChartData as any, defaultOptions);

      expect((spec.legend as any).show).toBe(false);
    });

    it('uses smart date format when enabled', () => {
      const spec = createHistogramSpec(mockChartData as any, {
        ...defaultOptions,
        useSmartDateFormat: true,
      });

      expect(spec.xAxis).toBeDefined();
      // The formatter should be applied to xAxis.axisLabel
    });

    it('shows y-axis label when enabled', () => {
      const spec = createHistogramSpec(mockChartData as any, {
        ...defaultOptions,
        showYAxisLabel: true,
        yAxisLabel: 'Document Count',
      });

      expect((spec.yAxis as any).name).toBe('Document Count');
    });

    it('applies color palette to multiple series', () => {
      const chartDataWithSeries = {
        ...mockChartData,
        series: [
          { id: 's1', name: 'Series 1', data: [{ x: 1609459200000, y: 5 }] },
          { id: 's2', name: 'Series 2', data: [{ x: 1609459200000, y: 10 }] },
        ],
      };

      const spec = createHistogramSpec(chartDataWithSeries as any, {
        ...defaultOptions,
        colorPalette: ['#FF0000', '#00FF00'],
      });

      expect((spec.series as any[])[0].itemStyle.color).toBe('#FF0000');
      expect((spec.series as any[])[1].itemStyle.color).toBe('#00FF00');
    });

    it('applies legend textStyle color for theme support', () => {
      const chartDataWithSeries = {
        ...mockChartData,
        series: [
          { id: 's1', name: 'Series 1', data: [{ x: 1609459200000, y: 5 }] },
          { id: 's2', name: 'Series 2', data: [{ x: 1609459200000, y: 10 }] },
        ],
      };

      const spec = createHistogramSpec(chartDataWithSeries as any, defaultOptions);

      expect((spec.legend as any).textStyle?.color).toBe('#333');
    });

    it('applies legend formatter to truncate long names', () => {
      const chartDataWithSeries = {
        ...mockChartData,
        series: [
          { id: 's1', name: 'Series 1', data: [{ x: 1609459200000, y: 5 }] },
          { id: 's2', name: 'Series 2', data: [{ x: 1609459200000, y: 10 }] },
        ],
      };

      const spec = createHistogramSpec(chartDataWithSeries as any, defaultOptions);

      expect(typeof (spec.legend as any).formatter).toBe('function');
      // Test that formatter truncates long names
      const formatter = (spec.legend as any).formatter;
      expect(formatter('short')).toBe('short');
      expect(formatter('this-is-a-very-long-series-name')).toBe('this-is-a-very-lo...');
    });

    it('enables legend tooltip for full name on hover', () => {
      const chartDataWithSeries = {
        ...mockChartData,
        series: [
          { id: 's1', name: 'Series 1', data: [{ x: 1609459200000, y: 5 }] },
          { id: 's2', name: 'Series 2', data: [{ x: 1609459200000, y: 10 }] },
        ],
      };

      const spec = createHistogramSpec(chartDataWithSeries as any, defaultOptions);

      expect((spec.legend as any).tooltip?.show).toBe(true);
    });

    it('applies legend rectangular icon style', () => {
      const chartDataWithSeries = {
        ...mockChartData,
        series: [
          { id: 's1', name: 'Series 1', data: [{ x: 1609459200000, y: 5 }] },
          { id: 's2', name: 'Series 2', data: [{ x: 1609459200000, y: 10 }] },
        ],
      };

      const spec = createHistogramSpec(chartDataWithSeries as any, defaultOptions);

      expect((spec.legend as any).icon).toBe('roundRect');
      expect((spec.legend as any).itemWidth).toBe(COLOR_INDICATOR_WIDTH);
      expect((spec.legend as any).itemHeight).toBe(COLOR_INDICATOR_HEIGHT);
    });

    it('applies yAxis splitNumber to reduce grid lines', () => {
      const spec = createHistogramSpec(mockChartData as any, defaultOptions);

      expect((spec.yAxis as any).splitNumber).toBe(3);
    });

    it('applies stack to bar series for breakdowns', () => {
      const chartDataWithSeries = {
        ...mockChartData,
        series: [
          { id: 's1', name: 'Series 1', data: [{ x: 1609459200000, y: 5 }] },
          { id: 's2', name: 'Series 2', data: [{ x: 1609459200000, y: 10 }] },
        ],
      };

      const spec = createHistogramSpec(chartDataWithSeries as any, defaultOptions);

      expect((spec.series as any[])[0].stack).toBe('total');
      expect((spec.series as any[])[1].stack).toBe('total');
    });

    it('does not apply stack to line series for breakdowns', () => {
      const chartDataWithSeries = {
        ...mockChartData,
        series: [
          { id: 's1', name: 'Series 1', data: [{ x: 1609459200000, y: 5 }] },
          { id: 's2', name: 'Series 2', data: [{ x: 1609459200000, y: 10 }] },
        ],
      };

      const spec = createHistogramSpec(chartDataWithSeries as any, {
        ...defaultOptions,
        chartType: 'Line',
      });

      expect((spec.series as any[])[0].stack).toBeUndefined();
      expect((spec.series as any[])[1].stack).toBeUndefined();
    });

    it('applies tooltip confine and appendToBody to prevent cutoff', () => {
      const spec = createHistogramSpec(mockChartData as any, defaultOptions);

      expect((spec.tooltip as any).confine).toBe(true);
      expect((spec.tooltip as any).appendToBody).toBe(true);
    });

    it('applies tooltip position function for fixed y-axis position', () => {
      const spec = createHistogramSpec(mockChartData as any, defaultOptions);

      expect(typeof (spec.tooltip as any).position).toBe('function');
      const positionFn = (spec.tooltip as any).position;

      // Test that y position is fixed at 10
      const result = positionFn([100, 50], {}, null, null, {
        contentSize: [200, 100],
        viewSize: [800, 400],
      });
      expect(result[1]).toBe(10);

      // Test tooltip appears to the right of the bar (with 15px offset)
      expect(result[0]).toBe(115); // 100 + 15 offset

      // Test tooltip flips to left when near right edge
      const resultNearEdge = positionFn([700, 50], {}, null, null, {
        contentSize: [200, 100],
        viewSize: [800, 400],
      });
      expect(resultNearEdge[0]).toBe(485); // 700 - 200 - 15
    });

    it('applies tooltip backgroundColor for theming', () => {
      const spec = createHistogramSpec(mockChartData as any, defaultOptions);

      expect((spec.tooltip as any).backgroundColor).toBeDefined();
    });

    it('applies tooltip borderColor for theming', () => {
      const spec = createHistogramSpec(mockChartData as any, defaultOptions);

      expect((spec.tooltip as any).borderColor).toBeDefined();
    });

    it('applies tooltip textStyle color for theming', () => {
      const spec = createHistogramSpec(mockChartData as any, defaultOptions);

      expect((spec.tooltip as any).textStyle?.color).toBe('#333');
    });

    it('normalizes series data to prevent gaps in stacked bar charts', () => {
      const chartDataWithGaps = {
        ...mockChartData,
        series: [
          { id: 's1', name: 'Series 1', data: [{ x: 1609459200000, y: 5 }] },
          { id: 's2', name: 'Series 2', data: [{ x: 1609462800000, y: 10 }] },
        ],
      };

      const spec = createHistogramSpec(chartDataWithGaps as any, defaultOptions);

      // Both series should have 2 data points after normalization
      expect((spec.series as any[])[0].data).toHaveLength(2);
      expect((spec.series as any[])[1].data).toHaveLength(2);
    });

    it('hides grid lines by default', () => {
      const spec = createHistogramSpec(mockChartData as any, defaultOptions);

      expect((spec.yAxis as any).splitLine.show).toBe(false);
    });
  });
});
