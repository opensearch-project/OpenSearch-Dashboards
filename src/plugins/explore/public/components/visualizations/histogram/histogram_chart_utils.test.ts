/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHistogramSeries } from './histogram_chart_utils';
import { defaultHistogramChartStyles } from './histogram_vis_config';
import { ThresholdMode } from '../types';

// Mock the dependencies
jest.mock('../theme/default_colors', () => ({
  getColors: () => ({
    categories: ['#00BFB3'],
    backgroundShade: '#F5F7FA',
    statusGreen: '#00BFB3',
  }),
}));

jest.mock('../utils/series', () => ({
  getSeriesDisplayName: (seriesField: string) => seriesField,
}));

jest.mock('../utils/utils', () => ({
  generateThresholdLines: jest.fn(() => ({})),
  getValueColorByThreshold: jest.fn(() => '#00BFB3'),
}));

describe('createHistogramSeries', () => {
  const mockStyles = {
    ...defaultHistogramChartStyles,
    showBarBorder: true,
    barBorderWidth: 2,
    barBorderColor: '#000000',
    useThresholdColor: false,
    thresholdOptions: {
      baseColor: '#00BFB3',
      thresholds: [],
      thresholdStyle: ThresholdMode.Off,
    },
    tooltipOptions: {
      mode: 'all' as const,
    },
  };

  describe('basic functionality', () => {
    it('should create histogram series with valid data', () => {
      const options = {
        styles: mockStyles,
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [
          ['start', 'end', 'count'],
          [0, 10, 5],
          [10, 20, 8],
          [20, 30, 3],
        ],
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);

      expect(result.series).toBeDefined();
      expect(result.series).toHaveLength(1);
      expect(result.series![0].type).toBe('custom');
      expect(result.series![0].name).toBe('count');
    });

    it('should handle multiple series fields', () => {
      const options = {
        styles: mockStyles,
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count', 'sum'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [
          ['start', 'end', 'count', 'sum'],
          [0, 10, 5, 100],
          [10, 20, 8, 200],
        ],
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);

      expect(result.series).toHaveLength(2);
      expect(result.series![0].name).toBe('count');
      expect(result.series![1].name).toBe('sum');
    });

    it('should handle seriesFields as a function', () => {
      const options = {
        styles: mockStyles,
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: (headers?: string[]) => {
          return headers ? headers.filter((h) => h !== 'start' && h !== 'end') : [];
        },
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [
          ['start', 'end', 'count'],
          [0, 10, 5],
        ],
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);

      expect(result.series).toHaveLength(1);
      expect(result.series![0].name).toBe('count');
    });
  });

  describe('handle empty data gracefully', () => {
    it('should return original state when no headers', () => {
      const options = {
        styles: mockStyles,
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [],
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);

      expect(result).toBe(state);
      expect(result.series).toBeUndefined();
    });

    it('should return original state when no data rows', () => {
      const options = {
        styles: mockStyles,
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [['start', 'end', 'count']],
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);

      expect(result).toBe(state);
      expect(result.series).toBeUndefined();
    });

    it('should handle empty transformedData array', () => {
      const options = {
        styles: mockStyles,
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: undefined,
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);

      expect(result).toBe(state);
    });
  });

  describe('tooltip configuration', () => {
    it('should configure tooltip with mode "all"', () => {
      const options = {
        styles: {
          ...mockStyles,
          tooltipOptions: { mode: 'all' as const },
        },
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [
          ['start', 'end', 'count'],
          [0, 10, 5],
        ],
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);

      expect(result.baseConfig).toBeDefined();
      expect(result.baseConfig!.tooltip).toBeDefined();
      const tooltip = Array.isArray(result.baseConfig!.tooltip)
        ? result.baseConfig!.tooltip[0]
        : result.baseConfig!.tooltip;
      expect(tooltip!.show).toBe(true);
      expect(tooltip!.trigger).toBe('item');
    });

    it('should hide tooltip when mode is "hidden"', () => {
      const options = {
        styles: {
          ...mockStyles,
          tooltipOptions: { mode: 'hidden' as const },
        },
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [
          ['start', 'end', 'count'],
          [0, 10, 5],
        ],
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);

      const tooltip = Array.isArray(result.baseConfig!.tooltip)
        ? result.baseConfig!.tooltip[0]
        : result.baseConfig!.tooltip;
      expect(tooltip!.show).toBe(false);
    });
  });

  describe('series encoding', () => {
    it('should set correct encode properties', () => {
      const options = {
        styles: mockStyles,
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [
          ['start', 'end', 'count'],
          [0, 10, 5],
        ],
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);
      const series = result.series![0] as any;

      expect(series.encode.x).toBe('start');
      expect(series.encode.y).toBe('count');
    });
  });

  describe('x-axis configuration', () => {
    it('should update xAxisConfig with min, max, and interval values', () => {
      const options = {
        styles: mockStyles,
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [
          ['start', 'end', 'count'],
          [0, 10, 5],
          [10, 20, 8],
        ],
        axisColumnMappings: {},
        xAxisConfig: {
          type: 'value' as const,
          name: 'X Axis',
        },
      } as any;

      const result = createHistogramSeries(options)(state);

      expect(result.xAxisConfig).toBeDefined();
      expect(result.xAxisConfig.min).toBe(0);
      expect(result.xAxisConfig.max).toBe(20);
      expect(result.xAxisConfig.interval).toBe(10);
      expect(result.xAxisConfig.type).toBe('value');
      expect(result.xAxisConfig.name).toBe('X Axis');
    });

    it('should not create xAxisConfig when it does not already exist', () => {
      const options = {
        styles: mockStyles,
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [
          ['start', 'end', 'count'],
          [0, 10, 5],
        ],
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);

      expect(result.xAxisConfig).toBeUndefined();
    });
  });

  describe('renderItem function', () => {
    it('should have renderItem function in series', () => {
      const options = {
        styles: mockStyles,
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [
          ['start', 'end', 'count'],
          [0, 10, 5],
        ],
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);
      const series = result.series![0] as any;

      expect(series.renderItem).toBeDefined();
      expect(typeof series.renderItem).toBe('function');
    });

    it('should renderItem return correct structure', () => {
      const options = {
        styles: mockStyles,
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [
          ['start', 'end', 'count'],
          [0, 10, 5],
        ],
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);
      const series = result.series![0] as any;

      const mockApi = {
        value: jest.fn((index: number) => [0, 10, 5][index]),
        coord: jest.fn((point: number[]) => {
          if (point[1] === 0) return [100, 200]; // start point
          return [150, 150]; // end point
        }),
      };

      const renderResult = series.renderItem({}, mockApi);

      expect(renderResult).toBeDefined();
      expect(renderResult.type).toBe('group');
      expect(renderResult.children).toHaveLength(1);
      expect(renderResult.children[0].type).toBe('rect');
      expect(renderResult.children[0].shape).toBeDefined();
      expect(renderResult.children[0].style).toBeDefined();
    });

    it('should apply fill, stroke, and lineWidth styles correctly', () => {
      const options = {
        styles: {
          ...mockStyles,
          showBarBorder: true,
          barBorderWidth: 3,
          barBorderColor: '#FF0000',
        },
        binStartField: 'start',
        binEndField: 'end',
        seriesFields: ['count'],
      };

      const state = {
        data: [],
        styles: mockStyles,
        transformedData: [
          ['start', 'end', 'count'],
          [0, 10, 5],
        ],
        axisColumnMappings: {},
      } as any;

      const result = createHistogramSeries(options)(state);
      const series = result.series![0] as any;

      const mockApi = {
        value: jest.fn((index: number) => [0, 10, 5][index]),
        coord: jest.fn((point: number[]) => {
          if (point[1] === 0) return [100, 200];
          return [150, 150];
        }),
      };

      const renderResult = series.renderItem({}, mockApi);
      const rectStyle = renderResult.children[0].style;

      expect(rectStyle.fill).toBeDefined();
      expect(rectStyle.stroke).toBe('#FF0000');
      expect(rectStyle.lineWidth).toBe(3);
    });
  });
});
