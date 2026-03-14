/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  inferTimeIntervals,
  transformIntervalsToTickCount,
  inferBucketSize,
  adjustBucketBins,
  buildEncoding,
  buildTooltipEncoding,
  createBarSeries,
  createFacetBarSeries,
} from './bar_chart_utils';
import { TimeUnit, VisFieldType, AggregationType, VisColumn, StandardAxes } from '../types';
import { BarChartStyle } from './bar_vis_config';

jest.mock('../utils/utils', () => ({
  applyAxisStyling: jest.fn(() => ({ grid: true })),
  getSchemaByAxis: jest.fn((axis) => {
    if (axis?.schema === 'date') return 'temporal';
    return 'nominal';
  }),

  adjustOppositeSymbol: jest.fn((switchAxes, axis) => {
    if (switchAxes) {
      return axis === 'x' ? 'y' : 'x';
    }
    return axis;
  }),
  generateThresholdLines: jest.fn((thresholdOptions) => {
    if (thresholdOptions?.thresholds?.length) {
      return { markLine: { data: thresholdOptions.thresholds } };
    }
    return {};
  }),
}));

jest.mock('../utils/series', () => ({
  getSeriesDisplayName: jest.fn((field) => `Display ${field}`),
}));

describe('bar_chart_utils', () => {
  describe('inferTimeIntervals', () => {
    it('returns DATE for empty data', () => {
      expect(inferTimeIntervals([], 'date')).toBe(TimeUnit.DATE);
    });

    it('returns YEAR for large intervals', () => {
      const data = [{ date: '2020-01-01' }, { date: '2023-01-01' }];
      expect(inferTimeIntervals(data, 'date')).toBe(TimeUnit.YEAR);
    });

    it('returns SECOND for small intervals', () => {
      const now = Date.now();
      const data = [{ date: new Date(now) }, { date: new Date(now + 1000) }];
      expect(inferTimeIntervals(data, 'date')).toBe(TimeUnit.SECOND);
    });
  });

  describe('transformIntervelsToTickCount', () => {
    it('transforms time units correctly', () => {
      expect(transformIntervalsToTickCount(TimeUnit.YEAR)).toBe('year');
      expect(transformIntervalsToTickCount(TimeUnit.MONTH)).toBe('month');
      expect(transformIntervalsToTickCount(TimeUnit.DATE)).toBe('day');
      expect(transformIntervalsToTickCount(undefined)).toBe('day');
    });
  });

  describe('inferBucketSize', () => {
    it('returns null for empty data', () => {
      expect(inferBucketSize([], 'value')).toBeNull();
    });

    it('calculates bucket size correctly', () => {
      const data = [{ value: 1000 }, { value: 5999 }];
      expect(inferBucketSize(data, 'value')).toBe(100);
    });
  });

  describe('adjustBucketBins', () => {
    const data = [{ value: 100 }];

    it('returns step when bucketSize is provided', () => {
      const styles = { bucketSize: 50 };
      expect(adjustBucketBins(styles, data, 'value')).toEqual({ step: 50 });
    });

    it('returns maxbins when bucketCount is provided', () => {
      const styles = { bucketCount: 20 };
      expect(adjustBucketBins(styles, data, 'value')).toEqual({ maxbins: 20 });
    });

    it('returns inferred step when no options provided', () => {
      expect(adjustBucketBins(undefined, data, 'value')).toEqual({ step: 10 });
    });
  });

  describe('buildEncoding', () => {
    const axis = { column: 'test', schema: VisFieldType.Date, name: 'Test' } as VisColumn;
    const axisStyle = { title: { text: 'Custom Title' } } as StandardAxes;

    it('builds basic encoding', () => {
      const result = buildEncoding(axis, axisStyle, undefined, undefined);
      expect(result.field).toBe('test');
      expect(result.type).toBe('temporal');
    });

    it('adds timeUnit for date fields', () => {
      const result = buildEncoding(axis, axisStyle, TimeUnit.YEAR, undefined);
      expect(result.timeUnit).toBe(TimeUnit.YEAR);
      expect(result.axis.tickCount).toBe('year');
    });

    it('adds aggregate for numerical fields', () => {
      const numAxis = { ...axis, schema: VisFieldType.Numerical } as VisColumn;
      const result = buildEncoding(numAxis, axisStyle, undefined, AggregationType.SUM);
      expect(result.aggregate).toBe(AggregationType.SUM);
    });
  });

  describe('buildTooltipEncoding', () => {
    const axis = { column: 'test', schema: VisFieldType.Numerical, name: 'Test' } as VisColumn;
    const axisStyle = { title: { text: 'Custom Title' } } as StandardAxes;

    it('builds tooltip encoding with custom title for aggregated numerical fields', () => {
      const result = buildTooltipEncoding(axis, axisStyle, undefined, AggregationType.SUM);
      expect(result.title).toBe('Custom Title');
      expect(result.aggregate).toBe(AggregationType.SUM);
    });

    it('uses default title format for aggregated fields without custom title', () => {
      const result = buildTooltipEncoding(axis, undefined, undefined, AggregationType.MEAN);
      expect(result.title).toBe('Test(mean)');
    });
  });
});

describe('createBarSeries', () => {
  const mockState = {
    axisColumnMappings: { x: 'category', y: 'value' },
    transformedData: [
      ['category', 'value1'],
      ['A', 10],
      ['B', 15],
      ['C', 12],
    ],
  };

  const defaultBarStyles: Partial<BarChartStyle> = {
    barSizeMode: 'auto',
    barWidth: 0.7,
    barPadding: 0.1,
    switchAxes: false,
    showBarBorder: false,
    barBorderWidth: 1,
    barBorderColor: '#000',
    thresholdOptions: {
      thresholds: [],
    },
  };

  describe('bar chart configuration', () => {
    it('should create basic bar series', () => {
      const options = {
        kind: 'bar' as const,
        styles: defaultBarStyles as BarChartStyle,
        categoryField: 'category',
        seriesFields: ['value1'],
      };

      const result = createBarSeries(options)(mockState);

      expect(result.series).toHaveLength(1);
      expect(result.series[0]).toMatchObject({
        type: 'bar',
        stack: 'total',
        name: 'Display value1',
        encode: {
          x: 'category',
          y: 'value1',
        },
      });
    });

    it('should create bar series with function seriesFields', () => {
      const seriesFieldsFunc = () => ['value1'];

      const options = {
        kind: 'bar' as const,
        styles: defaultBarStyles as BarChartStyle,
        categoryField: 'category',
        seriesFields: seriesFieldsFunc,
      };

      const result = createBarSeries(options)(mockState);

      expect(result.series).toHaveLength(1);
      expect(result.series[0].name).toBe('Display value1');
      expect(result.series[0].type).toBe('bar');
    });

    it('should handle switched axes for bar charts', () => {
      const options = {
        kind: 'bar' as const,
        styles: { ...defaultBarStyles, switchAxes: true } as BarChartStyle,
        categoryField: 'category',
        seriesFields: ['value1'],
      };

      const result = createBarSeries(options)(mockState);

      expect(result.series[0].encode).toMatchObject({
        y: 'category',
        x: 'value1',
      });
    });

    it('should apply manual bar sizing when configured', () => {
      const options = {
        kind: 'bar' as const,
        styles: {
          ...defaultBarStyles,
          barSizeMode: 'manual',
          barWidth: 0.8,
          barPadding: 0.2,
        } as BarChartStyle,
        categoryField: 'category',
        seriesFields: ['value1'],
      };

      const result = createBarSeries(options)(mockState);

      expect(result.series[0]).toMatchObject({
        barWidth: '80%',
        barCategoryGap: '20%',
      });
    });

    it('should apply bar border styling when enabled', () => {
      const options = {
        kind: 'bar' as const,
        styles: {
          ...defaultBarStyles,
          showBarBorder: true,
          barBorderWidth: 2,
          barBorderColor: '#ff0000',
        } as BarChartStyle,
        categoryField: 'category',
        seriesFields: ['value1'],
      };

      const result = createBarSeries(options)(mockState);

      expect(result.series[0]).toMatchObject({
        itemStyle: {
          borderWidth: 2,
          borderColor: '#ff0000',
        },
      });
    });

    it('should apply threshold lines to first series only', () => {
      const thresholdOptions = {
        thresholds: [{ value: 15, color: '#red' }],
      };

      const options = {
        kind: 'bar' as const,
        styles: {
          ...defaultBarStyles,
          thresholdOptions,
        } as BarChartStyle,
        categoryField: 'category',
        seriesFields: ['value1', 'value2'],
      };

      const result = createBarSeries(options)(mockState);

      expect(result.series[0]).toHaveProperty('markLine');
      expect(result.series[1]).not.toHaveProperty('markLine');
    });

    it('should create stack bar series', () => {
      const facetMockState = {
        axisColumnMappings: { x: 'category', y: 'value' },
        transformedData: [
          ['category', 'X', 'Y'],
          ['A', 10, null],
          ['B', 15, 10],
          ['C', 12, 11],
        ],
      };
      const seriesFieldsFunc = () => ['X', 'Y'];
      const options = {
        kind: 'bar' as const,
        styles: {
          ...defaultBarStyles,
        } as BarChartStyle,
        categoryField: 'category',
        seriesFields: seriesFieldsFunc,
      };

      const result = createBarSeries(options)(facetMockState);
      expect(result.series?.length).toBe(2);
      expect(result?.series[0]?.encode.x).toBe('category');
      expect(result?.series[0]?.encode.y).toBe('X');
      expect(result?.series[1]?.encode.x).toBe('category');
      expect(result?.series[1]?.encode.y).toBe('Y');
    });
  });
});

describe('createFacetBarSeries', () => {
  const mockStyles: Partial<BarChartStyle> = {
    barSizeMode: 'auto',
    barWidth: 0.7,
    barPadding: 0.1,
    switchAxes: false,
    showBarBorder: false,
    barBorderWidth: 1,
    barBorderColor: '#000',
    thresholdOptions: {
      thresholds: [],
    },
  };

  describe('faceted data', () => {
    const facetedState = {
      transformedData: [
        [
          ['category', 'value1', 'value2'],
          ['A', 12, 18],
          ['B', 18, 22],
        ],
        [
          ['category', 'value1', 'value2'],
          ['A', 12, 18],
          ['B', 18, 22],
        ],
      ],
      axisColumnMappings: { x: 'category', y: 'value' },
    };

    it('should create faceted bar series', () => {
      const seriesFieldsFunc = () => ['value1', 'value2'];

      const result = createFacetBarSeries({
        styles: mockStyles as BarChartStyle,
        categoryField: 'category',
        seriesFields: seriesFieldsFunc,
      })(facetedState);

      // Should have 4 series (2 datasets * 2 series each)
      expect(result.series).toHaveLength(4);

      // First dataset series
      expect(result.series[0]).toMatchObject({
        name: 'value1',
        type: 'bar',
        stack: 'stack_0',
        datasetIndex: 0,
        gridIndex: 0,
        xAxisIndex: 0,
        yAxisIndex: 0,
        encode: {
          x: 'category',
          y: 'value1',
        },
      });

      expect(result.series[1]).toMatchObject({
        name: 'value2',
        type: 'bar',
        stack: 'stack_0',
        datasetIndex: 0,
        gridIndex: 0,
        xAxisIndex: 0,
        yAxisIndex: 0,
        encode: {
          x: 'category',
          y: 'value2',
        },
      });

      // Second dataset series
      expect(result.series[2]).toMatchObject({
        name: 'value1',
        type: 'bar',
        stack: 'stack_1',
        datasetIndex: 1,
        gridIndex: 1,
        xAxisIndex: 1,
        yAxisIndex: 1,
        encode: {
          x: 'category',
          y: 'value1',
        },
      });

      expect(result.series[3]).toMatchObject({
        name: 'value2',
        type: 'bar',
        stack: 'stack_1',
        datasetIndex: 1,
        gridIndex: 1,
        xAxisIndex: 1,
        yAxisIndex: 1,
        encode: {
          x: 'category',
          y: 'value2',
        },
      });
    });

    it('should handle switched axes in faceted data', () => {
      const seriesFieldsFunc = jest.fn(() => ['value1']);

      const result = createFacetBarSeries({
        styles: { ...mockStyles, switchAxes: true } as BarChartStyle,
        categoryField: 'category',
        seriesFields: seriesFieldsFunc,
      })(facetedState);

      expect(result.series[0].encode).toMatchObject({
        y: 'category',
        x: 'value1',
      });
    });

    it('should apply manual bar sizing to faceted series', () => {
      const seriesFieldsFunc = jest.fn(() => ['value1']);

      const result = createFacetBarSeries({
        styles: {
          ...mockStyles,
          barSizeMode: 'manual',
          barWidth: 0.8,
          barPadding: 0.3,
        } as BarChartStyle,
        categoryField: 'category',
        seriesFields: seriesFieldsFunc,
      })(facetedState);

      expect(result.series[0]).toMatchObject({
        barWidth: '80%',
        barCategoryGap: '30%',
      });
    });

    it('should apply bar border styling to faceted series', () => {
      const seriesFieldsFunc = jest.fn(() => ['value1']);

      const result = createFacetBarSeries({
        styles: {
          ...mockStyles,
          showBarBorder: true,
          barBorderWidth: 3,
          barBorderColor: '#blue',
        } as BarChartStyle,
        categoryField: 'category',
        seriesFields: seriesFieldsFunc,
      })(facetedState);

      expect(result.series[0]).toMatchObject({
        itemStyle: {
          borderWidth: 3,
          borderColor: '#blue',
        },
      });
    });

    it('should apply threshold lines to first series of each dataset', () => {
      const thresholdOptions = {
        thresholds: [{ value: 20, color: '#green' }],
      };

      const seriesFieldsFunc = jest.fn(() => ['value1', 'value2']);

      const result = createFacetBarSeries({
        styles: {
          ...mockStyles,
          thresholdOptions,
        } as BarChartStyle,
        categoryField: 'category',
        seriesFields: seriesFieldsFunc,
      })(facetedState);

      // First series of each dataset should have threshold lines
      expect(result.series[0]).toHaveProperty('markLine');
      expect(result.series[2]).toHaveProperty('markLine');

      // Second series of each dataset should not have threshold lines
      expect(result.series[1]).not.toHaveProperty('markLine');
      expect(result.series[3]).not.toHaveProperty('markLine');
    });

    it('should handle single dataset in faceted structure and fallback to simple bar', () => {
      const singleFacetState = {
        transformedData: [
          ['category', 'value1', 'value2'],
          ['A', 12, 18],
          ['B', 18, 22],
        ],
        axisColumnMappings: { x: 'category', y: 'value' },
        series: [],
      };

      const seriesFieldsFunc = jest.fn(() => ['value1']);

      const result = createFacetBarSeries({
        styles: mockStyles as BarChartStyle,
        categoryField: 'category',
        seriesFields: seriesFieldsFunc,
      })(singleFacetState);

      expect(result.series).toHaveLength(1);
      expect(result.series[0]).toMatchObject({
        stack: 'total',
      });
      expect(result.series[0].gridIndex).toBeUndefined();
      expect(result.series[0].datasetIndex).toBeUndefined();
    });
  });
});
