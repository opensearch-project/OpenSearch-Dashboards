/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getBarOrientation,
  thresholdsToGradient,
  symbolOpposite,
  getGradientConfig,
} from './bar_gauge_utils';
import { AxisColumnMappings, Threshold, VisFieldType } from '../types';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';

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

    it('returns undefined for non-gradient display mode', () => {
      const result = getGradientConfig('horizontal', 'basic', false);
      expect(result).toBeUndefined();
    });
  });
});
