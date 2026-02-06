/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getBarOrientation,
  thresholdsToGradient,
  symbolOpposite,
  getGradientConfig,
  generateThresholds,
  generateValueThresholds,
  createBarGaugeSeries,
  createBarGaugeAxesConfig,
  assembleBarGaugeSpec,
} from './bar_gauge_utils';
import { AxisColumnMappings, Threshold, VisFieldType } from '../types';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';
import { BaseChartStyle, PipelineFn, EChartsSpecState, getAxisType } from '../utils/echarts_spec';
import { getColors } from '../theme/default_colors';
import { mock } from 'node:test';

describe('bar_gauge_utils', () => {
  describe('getBarOrientation', () => {
    const mockAxisColumnMappings: AxisColumnMappings = {
      x: {
        id: 1,
        name: 'xAxis',
        schema: VisFieldType.Categorical,
        column: 'x',
        validValuesCount: 10,
        uniqueValuesCount: 5,
      },
      y: {
        id: 2,
        name: 'yAxis',
        schema: VisFieldType.Numerical,
        column: 'y',
        validValuesCount: 10,
        uniqueValuesCount: 8,
      },
    };

    it('should return swapped axes for horizontal orientation', () => {
      const styles = { exclusive: { orientation: 'horizontal' as const } } as BarGaugeChartStyle;

      const result = getBarOrientation(styles, mockAxisColumnMappings);

      expect(result.xAxis).toBe(mockAxisColumnMappings.y);
      expect(result.yAxis).toBe(mockAxisColumnMappings.x);
      expect(result.yAxisStyle).toEqual({
        axis: { tickOpacity: 0, grid: false, title: null, labelAngle: 0, labelOverlap: 'greedy' },
      });
      expect(result.xAxisStyle).toEqual({
        axis: null,
      });
    });

    it('should return normal axes for vertical orientation', () => {
      const styles = { exclusive: { orientation: 'vertical' as const } } as BarGaugeChartStyle;

      const result = getBarOrientation(styles, mockAxisColumnMappings);

      expect(result.xAxis).toBe(mockAxisColumnMappings.x);
      expect(result.yAxis).toBe(mockAxisColumnMappings.y);
      expect(result.xAxisStyle).toEqual({
        axis: { tickOpacity: 0, grid: false, title: null, labelAngle: 0, labelOverlap: 'greedy' },
      });
      expect(result.yAxisStyle).toEqual({ axis: null });
    });
  });

  describe('thresholdsToGradient', () => {
    it('should convert thresholds to gradient format', () => {
      const thresholds: Threshold[] = [
        { value: 10, color: '#red' },
        { value: 20, color: '#green' },
        { value: 30, color: '#blue' },
      ];

      const result = thresholdsToGradient(thresholds);

      expect(result).toEqual([
        { calculate: '10', as: 'threshold0' },
        { calculate: '20', as: 'threshold1' },
        { calculate: '30', as: 'threshold2' },
      ]);
    });

    it('should handle empty thresholds array', () => {
      const result = thresholdsToGradient([]);
      expect(result).toEqual([]);
    });
  });

  describe('symbolOpposite', () => {
    it('should return opposite symbol for horizontal orientation', () => {
      expect(symbolOpposite('horizontal', 'x')).toBe('y');
      expect(symbolOpposite('horizontal', 'y')).toBe('x');
    });

    it('should return same symbol for vertical orientation', () => {
      expect(symbolOpposite('vertical', 'x')).toBe('x');
      expect(symbolOpposite('vertical', 'y')).toBe('y');
    });
  });

  describe('getGradientConfig', () => {
    it('returns horizontal gradient for non-numerical x-axis with horizontal orientation', () => {
      const result = getGradientConfig('horizontal', 'gradient', false);
      expect(result).toEqual({ x1: 0, y1: 0, x2: 1, y2: 0 });
    });

    it('returns horizontal gradient for numerical x-axis with non-horizontal orientation', () => {
      const result = getGradientConfig('vertical', 'gradient', true);
      expect(result).toEqual({ x1: 0, y1: 0, x2: 1, y2: 0 });
    });

    it('returns vertical gradient for numerical x-axis with horizontal orientation', () => {
      const result = getGradientConfig('horizontal', 'gradient', true);
      expect(result).toEqual({ x1: 1, y1: 1, x2: 1, y2: 0 });
    });

    it('returns vertical gradient for non-numerical x-axis with non-horizontal orientation', () => {
      const result = getGradientConfig('vertical', 'gradient', false);
      expect(result).toEqual({ x1: 1, y1: 1, x2: 1, y2: 0 });
    });

    it('returns undefined for non-gradient display style', () => {
      const result = getGradientConfig('horizontal', 'basic', false);
      expect(result).toBeUndefined();
    });
  });

  describe('generateThresholds', () => {
    const mockThresholds: Threshold[] = [
      { value: 10, color: '#FF0000' },
      { value: 50, color: '#FFFF00' },
      { value: 80, color: '#0037ffff' },
    ];

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('Basic functionality', () => {
      it('should handle empty thresholds array', () => {
        const result = generateThresholds(0, 100, [], '#BLUE');

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ value: 0, color: '#BLUE' });
      });

      it('should use default color when baseColor is undefined', () => {
        const result = generateThresholds(0, 100, [], undefined);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ value: 0, color: '#00BD6B' });
      });

      it('should process normal thresholds correctly', () => {
        const result = generateThresholds(0, 100, mockThresholds, '#BLUE');

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({ value: 0, color: '#BLUE' });
        expect(result[1]).toEqual({ value: 10, color: '#FF0000' });
        expect(result[2]).toEqual({ value: 50, color: '#FFFF00' });
        expect(result[3]).toEqual({ value: 80, color: '#0037ffff' });
      });
    });

    describe('Threshold filtering and range handling', () => {
      it('should filter thresholds above maxBase', () => {
        const result = generateThresholds(0, 60, mockThresholds, '#BLUE');

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({ value: 0, color: '#BLUE' });
        expect(result[1]).toEqual({ value: 10, color: '#FF0000' });
        expect(result[2]).toEqual({ value: 50, color: '#FFFF00' });
        // Should not include the threshold with value 80
      });

      it('should handle minBase higher than first threshold', () => {
        const result = generateThresholds(25, 100, mockThresholds, '#BLUE');

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({ value: 25, color: '#FF0000' });
        expect(result[1]).toEqual({ value: 50, color: '#FFFF00' });
        expect(result[2]).toEqual({ value: 80, color: '#0037ffff' });
      });

      it('should handle minBase higher than all thresholds', () => {
        const result = generateThresholds(90, 100, mockThresholds, '#BLUE');

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ value: 90, color: '#0037ffff' });
      });
    });

    describe('Duplicate threshold handling', () => {
      it('should handle duplicate threshold values by keeping the latest', () => {
        const duplicateThresholds: Threshold[] = [
          { value: 10, color: '#FF0000' },
          { value: 50, color: '#FFFF00' },
          { value: 50, color: '#00FFFF' }, // Duplicate value, different color
          { value: 80, color: '#00FF00' },
        ];

        const result = generateThresholds(0, 100, duplicateThresholds, '#BLUE');

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({ value: 0, color: '#BLUE' });
        expect(result[1]).toEqual({ value: 10, color: '#FF0000' });
        expect(result[2]).toEqual({ value: 50, color: '#00FFFF' }); // Latest color
        expect(result[3]).toEqual({ value: 80, color: '#00FF00' });
      });
    });
  });

  describe('generateValueThresholds', () => {
    const mockThresholds: Threshold[] = [
      { value: 10, color: '#FF0000' },
      { value: 50, color: '#FFFF00' },
      { value: 80, color: '#0037ffff' },
    ];

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('Value stops processing', () => {
      it('should process value stops correctly', () => {
        const valueStops = [15, 45, 75];
        const result = generateValueThresholds(0, 100, valueStops, mockThresholds);

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({ value: 15, color: '#FF0000' }); // Uses threshold at 10
        expect(result[1]).toEqual({ value: 45, color: '#FF0000' }); // Uses threshold at 10
        expect(result[2]).toEqual({ value: 75, color: '#FFFF00' }); // Uses threshold at 50
      });

      it('should filter value stops outside range', () => {
        const valueStops = [5, 15, 45, 95, 105]; // 105 is above maxBase, 5 is below minBase (when minBase > 0)
        const result = generateValueThresholds(10, 90, valueStops, mockThresholds);

        // Should only include stops between minBase (10) and maxBase (90)
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ value: 15, color: '#FF0000' });
        expect(result[1]).toEqual({ value: 45, color: '#FF0000' });
      });

      it('should handle duplicate value stops', () => {
        const valueStops = [15, 15, 45, 45, 75]; // Duplicates
        const result = generateValueThresholds(0, 100, valueStops, mockThresholds);
        expect(result).toHaveLength(3); // Should deduplicate
        expect(result[0]).toEqual({ value: 15, color: '#FF0000' });
        expect(result[1]).toEqual({ value: 45, color: '#FF0000' });
        expect(result[2]).toEqual({ value: 75, color: '#FFFF00' });
      });

      it('should handle unsorted value stops', () => {
        const valueStops = [75, 15, 45]; // Unsorted
        const result = generateValueThresholds(0, 100, valueStops, mockThresholds);

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({ value: 15, color: '#FF0000' });
        expect(result[1]).toEqual({ value: 45, color: '#FF0000' });
        expect(result[2]).toEqual({ value: 75, color: '#FFFF00' });
      });

      it('should handle empty value stops array', () => {
        const result = generateValueThresholds(0, 100, [], mockThresholds);

        expect(result).toEqual([]);
      });

      it('should handle value stops equal to threshold values', () => {
        const valueStops = [10, 50, 80]; // Exact threshold values
        const result = generateValueThresholds(0, 100, valueStops, mockThresholds);

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({ value: 10, color: '#FF0000' });
        expect(result[1]).toEqual({ value: 50, color: '#FFFF00' });
        expect(result[2]).toEqual({ value: 80, color: '#0037ffff' });
      });
    });
  });
});

describe('bar_gauge_utils for echarts', () => {
  describe('createBarGaugeAxesConfig', () => {
    const mockAxisColumnMappings = {
      x: {
        id: 1,
        name: 'category',
        schema: VisFieldType.Categorical,
        column: 'category',
        validValuesCount: 10,
        uniqueValuesCount: 5,
      },
      y: {
        id: 2,
        name: 'value',
        schema: VisFieldType.Numerical,
        column: 'value',
        validValuesCount: 10,
        uniqueValuesCount: 8,
      },
    };

    it('should create axes config for vertical orientation', () => {
      const styles = { exclusive: { orientation: 'vertical' as const } } as BarGaugeChartStyle;
      const categories = ['A', 'B', 'C'];
      const minBase = 0;
      const maxBase = 100;

      const result = createBarGaugeAxesConfig({
        styles,
        categories,
        axisColumnMappings: mockAxisColumnMappings,
        minBase,
        maxBase,
      });

      expect(result.xAxisConfig).toEqual({
        type: 'category',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        data: categories,
      });

      expect(result.yAxisConfig).toEqual({
        type: 'value',
        show: false,
        max: maxBase,
        min: minBase,
        startValue: minBase,
      });
    });

    it('should create axes config for horizontal orientation', () => {
      const styles = { exclusive: { orientation: 'horizontal' as const } } as BarGaugeChartStyle;
      const categories = ['A', 'B', 'C'];
      const minBase = 0;
      const maxBase = 100;

      const result = createBarGaugeAxesConfig({
        styles,
        categories,
        axisColumnMappings: mockAxisColumnMappings,
        minBase,
        maxBase,
      });

      expect(result.xAxisConfig).toEqual({
        type: 'value',
        show: false,
        max: maxBase,
        min: minBase,
        startValue: minBase,
      });

      expect(result.yAxisConfig).toEqual({
        type: 'category',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        data: categories,
      });
    });
  });

  describe('assembleBarGaugeSpec', () => {
    it('should assemble bar gauge spec correctly', () => {
      const mockState = {
        baseConfig: { title: { text: 'Test Chart' } },
        transformedData: [
          { category: 'A', value: 10 },
          { category: 'B', value: 20 },
        ],
        xAxisConfig: { type: 'category', data: ['A', 'B'] },
        yAxisConfig: { type: 'value' },
        series: [{ type: 'bar', data: [10, 20] }],
      };

      const result = assembleBarGaugeSpec(mockState);

      expect(result.spec).toEqual({
        title: { text: 'Test Chart' },
        dataset: { source: mockState.transformedData },
        xAxis: mockState.xAxisConfig,
        yAxis: mockState.yAxisConfig,
        series: mockState.series,
        grid: { top: 50, right: 30, bottom: 40, left: 30 },
      });
    });
  });

  describe('createBarGaugeSeries', () => {
    const mockTransformedData = [
      { category: 'A', value: 25 },
      { category: 'B', value: 50 },
      { category: 'C', value: 75 },
    ];

    const mockAxisColumnMappings = {
      x: {
        id: 1,
        name: 'category',
        schema: VisFieldType.Categorical,
        column: 'category',
        validValuesCount: 3,
        uniqueValuesCount: 3,
      },
      y: {
        id: 2,
        name: 'value',
        schema: VisFieldType.Numerical,
        column: 'value',
        validValuesCount: 3,
        uniqueValuesCount: 3,
      },
    };

    const mockState = {
      transformedData: mockTransformedData,
      axisColumnMappings: mockAxisColumnMappings,
    } as EChartsSpecState;

    const mockStyles = {
      exclusive: {
        orientation: 'vertical',
        displayMode: 'basic',
        valueDisplay: 'hidden',
        showUnfilledArea: true,
      },
      thresholdOptions: {
        thresholds: [
          { value: 30, color: '#FF0000' },
          { value: 70, color: '#00FF00' },
        ],
        baseColor: '#00BD6B',
      },
      max: 100,
      min: 0,
    };

    it('should create bar gauge series with basic display mode', () => {
      const result = createBarGaugeSeries({
        styles: mockStyles,
        categoryField: 'category',
        valueField: 'value',
      })(mockState);

      expect(result.series).toBeDefined();
      expect(result.series).toHaveLength(2);
      expect(result.series[0].name).toBe('unfilledArea');
      expect(result.series[1].type).toBe('bar');
      expect(result.series[1].data).toMatchObject([
        { itemStyle: { color: '#00BD6B' }, value: 25 },
        { itemStyle: { color: '#FF0000' }, value: 50 },
        { itemStyle: { color: '#00FF00' }, value: 75 },
      ]);
    });

    it('should create bar gauge series with gradient display mode', () => {
      const thresholdsStyles = {
        ...mockStyles,
        exclusive: {
          ...mockStyles.exclusive,
          displayMode: 'gradient',
        },
      };
      const result = createBarGaugeSeries({
        styles: thresholdsStyles,
        categoryField: 'category',
        valueField: 'value',
      })(mockState);

      expect(result.series).toBeDefined();
      expect(result.series).toHaveLength(2);
      expect(result.series[1].type).toBe('bar');
      expect(result.series[1].data[0].itemStyle.color.colorStops).toMatchObject([
        { color: '#00BD6B', offset: 0 },
        { color: '#00BD6B', offset: 1 },
      ]);
      expect(result.series[1].data[1].itemStyle.color.colorStops).toMatchObject([
        { color: '#00BD6B', offset: 0 },
        { color: '#FF0000', offset: 1 },
      ]);
    });

    it('should create bar gauge series with stack display mode', () => {
      const stackStyles = {
        ...mockStyles,
        exclusive: {
          ...mockStyles.exclusive,
          displayMode: 'stack',
        },
      };

      const result = createBarGaugeSeries({
        styles: stackStyles,
        categoryField: 'category',
        valueField: 'value',
      })(mockState);

      expect(result.series.length).toBe(4); // unfilled area + multiple stack series
    });

    it('should handle custom min/max values', () => {
      const styles = {
        ...mockStyles,
        max: 80,
        min: 20,
      };

      const result = createBarGaugeSeries({
        styles,
        categoryField: 'category',
        valueField: 'value',
      })(mockState);

      expect(result.yAxisConfig.max).toBe(80);
      expect(result.yAxisConfig.min).toBe(20);
    });

    it('should handle hidden value display', () => {
      const result = createBarGaugeSeries({
        styles: mockStyles,
        categoryField: 'category',
        valueField: 'value',
      })(mockState);

      expect(result.series).toBeDefined();
      expect(result.series[0].data[0].label.color).toBe('transparent');
    });

    it('should handle text color value display', () => {
      const styles = {
        ...mockStyles,
        exclusive: {
          ...mockStyles.exclusive,
          valueDisplay: 'textColor',
        },
      };

      const result = createBarGaugeSeries({
        styles,
        categoryField: 'category',
        valueField: 'value',
      })(mockState);

      expect(result.series).toBeDefined();

      expect(result.series[0].data[0].label.color).toBe(getColors().text);
    });

    it('should handle value color value display', () => {
      const styles = {
        ...mockStyles,
        exclusive: {
          ...mockStyles.exclusive,
          valueDisplay: 'valueColor',
        },
      };
      const result = createBarGaugeSeries({
        styles,
        categoryField: 'category',
        valueField: 'value',
      })(mockState);

      expect(result.series).toBeDefined();
      // Value color should be applied to labels based on thresholds
      const labelColors = result.series[0].data.map((item) => item.label.color);
      expect(labelColors).toHaveLength(3);
      expect(labelColors[0]).toBe('#00BD6B'); // 25 < 30, uses base color
      expect(labelColors[1]).toBe('#FF0000'); // 50 > 30 uses first threshold
      expect(labelColors[2]).toBe('#00FF00'); // 75 > 70, uses second threshold
    });

    it('should handle invalid min/max case', () => {
      const styles = {
        ...mockStyles,
        min: 90,
        max: 20,
      };

      const result = createBarGaugeSeries({
        styles,
        categoryField: 'category',
        valueField: 'value',
      })(mockState);

      expect(result.series).toBeDefined();
      expect(result.series).toHaveLength(1); // Only unfilled area in invalid case
      expect(result.yAxisConfig.max).toBe(100); // fake domain
      expect(result.yAxisConfig.min).toBe(0);
    });
  });
});
