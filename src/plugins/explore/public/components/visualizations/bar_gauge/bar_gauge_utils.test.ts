/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getBarOrientation,
  thresholdsToGradient,
  symbolOpposite,
  getDisplayMode,
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
        axis: { tickOpacity: 0, grid: false, title: null, labelAngle: 0 },
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
        axis: { tickOpacity: 0, grid: false, title: null, labelAngle: 0 },
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

  describe('getDisplayMode', () => {
    const mockThreshold: Threshold = { value: 50, color: '#ff0000' };

    it('should return horizontal gradient for horizontal orientation and gradient mode', () => {
      const result = getDisplayMode('horizontal', 'gradient', mockThreshold, '#00ff00');

      expect(result).toEqual({
        color: {
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 0,
          gradient: 'linear',
          stops: [
            { offset: 0, color: '#ff0000' },
            { offset: 1, color: '#00ff00' },
          ],
        },
      });
    });

    it('should return vertical gradient for vertical orientation and gradient mode', () => {
      const result = getDisplayMode('vertical', 'gradient', mockThreshold, '#00ff00');

      expect(result).toEqual({
        color: {
          x1: 1,
          y1: 1,
          x2: 1,
          y2: 0,
          gradient: 'linear',
          stops: [
            { offset: 0, color: '#ff0000' },
            { offset: 1, color: '#00ff00' },
          ],
        },
      });
    });

    it('should return solid color for stack mode', () => {
      const result = getDisplayMode(
        'horizontal',
        'stack',
        mockThreshold,

        '#00ff00'
      );
      expect(result).toEqual({ color: '#ff0000' });
    });

    it('should return undefined for unsupported display mode', () => {
      const result = getDisplayMode('horizontal', 'basic', mockThreshold, '#00ff00');
      expect(result).toBeUndefined();
    });
  });
});
