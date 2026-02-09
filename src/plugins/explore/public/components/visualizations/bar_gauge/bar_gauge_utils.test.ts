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
} from './bar_gauge_utils';
import { AxisColumnMappings, Threshold, VisFieldType } from '../types';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { getColors } from '../theme/default_colors';

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
