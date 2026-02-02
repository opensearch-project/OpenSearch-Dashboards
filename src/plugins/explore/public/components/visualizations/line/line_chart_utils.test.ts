/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getVegaInterpolation, buildMarkConfig, createTimeMarkerLayer } from './line_chart_utils';
import { defaultLineChartStyles } from './line_vis_config';

describe('Line Chart Utils', () => {
  describe('getVegaInterpolation', () => {
    it('should return "linear" for straight line mode', () => {
      expect(getVegaInterpolation('straight')).toBe('linear');
    });

    it('should return "monotone" for smooth line mode', () => {
      expect(getVegaInterpolation('smooth')).toBe('monotone');
    });

    it('should return "step-after" for stepped line mode', () => {
      expect(getVegaInterpolation('stepped')).toBe('step-after');
    });

    it('should return "monotone" for unknown line modes', () => {
      expect(getVegaInterpolation('unknown')).toBe('monotone');
    });
  });

  describe('buildMarkConfig', () => {
    it('should build a bar mark config', () => {
      const styles = {
        ...defaultLineChartStyles,
        tooltipOptions: { mode: 'all' as const },
      };
      const result = buildMarkConfig(styles, 'bar');
      expect(result).toEqual({
        type: 'bar',
        opacity: 0.5,
        tooltip: true,
      });
    });

    it('should build a point-only mark config when lineStyle is dots', () => {
      const styles = {
        ...defaultLineChartStyles,
        lineStyle: 'dots' as const,
        tooltipOptions: { mode: 'all' as const },
      };
      const result = buildMarkConfig(styles);
      expect(result).toEqual({
        type: 'point',
        tooltip: true,
        size: 100,
      });
    });

    it('should build a line-only mark config when lineStyle is line', () => {
      const styles = {
        ...defaultLineChartStyles,
        lineStyle: 'line' as const,
        lineWidth: 3,
        lineMode: 'straight' as const,
        tooltipOptions: { mode: 'all' as const },
      };
      const result = buildMarkConfig(styles);
      expect(result).toEqual({
        type: 'line',
        tooltip: true,
        strokeWidth: 3,
        interpolate: 'linear',
      });
    });

    it('should build a line with points mark config when lineStyle is both', () => {
      const styles = {
        ...defaultLineChartStyles,
        lineStyle: 'both' as const,
        lineWidth: 2,
        lineMode: 'smooth' as const,
        tooltipOptions: { mode: 'all' as const },
      };
      const result = buildMarkConfig(styles);
      expect(result).toEqual({
        type: 'line',
        point: true,
        tooltip: true,
        strokeWidth: 2,
        interpolate: 'monotone',
      });
    });

    it('should use default values when styles is undefined', () => {
      const result = buildMarkConfig(undefined);
      expect(result).toEqual({
        type: 'line',
        point: true,
        tooltip: true,
        strokeWidth: 2,
        interpolate: 'monotone',
      });
    });
  });

  describe('createTimeMarkerLayer', () => {
    it('should return null when time marker is not enabled', () => {
      const styles = {
        ...defaultLineChartStyles,
        addTimeMarker: false,
      };
      expect(createTimeMarkerLayer(styles)).toBeNull();
    });

    it('should create a time marker layer with tooltip when enabled', () => {
      const styles = {
        ...defaultLineChartStyles,
        addTimeMarker: true,
        tooltipOptions: { mode: 'all' as const },
      };
      const result = createTimeMarkerLayer(styles);
      expect(result).toMatchObject({
        mark: {
          type: 'rule',
          color: '#FF6B6B',
          strokeWidth: 2,
          strokeDash: [3, 3],
          tooltip: true,
        },
        encoding: {
          x: {
            datum: { expr: 'now()' },
            type: 'temporal',
          },
          tooltip: {
            value: 'Current Time',
          },
        },
      });
    });

    it('should create a time marker layer without tooltip when tooltips are disabled', () => {
      const styles = {
        ...defaultLineChartStyles,
        addTimeMarker: true,
        tooltipOptions: { mode: 'hidden' as const },
      };
      const result = createTimeMarkerLayer(styles);
      expect(result).toMatchObject({
        mark: {
          type: 'rule',
          color: '#FF6B6B',
          strokeWidth: 2,
          strokeDash: [3, 3],
          tooltip: false,
        },
        encoding: {
          x: {
            datum: { expr: 'now()' },
            type: 'temporal',
          },
        },
      });
      expect(result.encoding.tooltip).toBeUndefined();
    });
  });
  // TODO: add unit tests for applyAxisStyling
});
