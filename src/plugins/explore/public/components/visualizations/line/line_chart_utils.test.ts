/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getStrokeDash,
  getVegaInterpolation,
  buildMarkConfig,
  createThresholdLayer,
  createTimeMarkerLayer,
  applyAxisStyling,
  ValueAxisPosition,
} from './line_chart_utils';
import { ThresholdLineStyle, VisColumn, VisFieldType } from '../types';
import { Positions } from '../utils/collections';

describe('Line Chart Utils', () => {
  describe('getStrokeDash', () => {
    it('should return the correct dash array for dashed style', () => {
      expect(getStrokeDash(ThresholdLineStyle.Dashed)).toEqual([5, 5]);
    });

    it('should return the correct dash array for dot-dashed style', () => {
      expect(getStrokeDash(ThresholdLineStyle.DotDashed)).toEqual([5, 5, 1, 5]);
    });

    it('should return undefined for full style', () => {
      expect(getStrokeDash(ThresholdLineStyle.Full)).toBeUndefined();
    });

    it('should return undefined for unknown styles', () => {
      expect(getStrokeDash('unknown')).toBeUndefined();
    });
  });

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
        addTooltip: true,
      };
      const result = buildMarkConfig(styles, 'bar');
      expect(result).toEqual({
        type: 'bar',
        opacity: 0.7,
        tooltip: true,
      });
    });

    it('should build a point-only mark config when showLine is false and showDots is true', () => {
      const styles = {
        showLine: false,
        showDots: true,
        addTooltip: true,
      };
      const result = buildMarkConfig(styles);
      expect(result).toEqual({
        type: 'point',
        tooltip: true,
        size: 100,
      });
    });

    it('should build a line-only mark config when showLine is true and showDots is false', () => {
      const styles = {
        showLine: true,
        showDots: false,
        lineWidth: 3,
        lineMode: 'straight',
        addTooltip: true,
      };
      const result = buildMarkConfig(styles);
      expect(result).toEqual({
        type: 'line',
        tooltip: true,
        strokeWidth: 3,
        interpolate: 'linear',
      });
    });

    it('should build a line with points mark config when both showLine and showDots are true', () => {
      const styles = {
        showLine: true,
        showDots: true,
        lineWidth: 2,
        lineMode: 'smooth',
        addTooltip: true,
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

    it('should build an invisible point mark config when both showLine and showDots are false', () => {
      const styles = {
        showLine: false,
        showDots: false,
        addTooltip: true,
      };
      const result = buildMarkConfig(styles);
      expect(result).toEqual({
        type: 'point',
        tooltip: true,
        size: 0,
      });
    });

    it('should use default values when styles is undefined', () => {
      const result = buildMarkConfig(undefined);
      expect(result).toEqual({
        type: 'line',
        tooltip: true,
        strokeWidth: 2,
        interpolate: 'monotone',
        point: true,
      });
    });
  });

  describe('createThresholdLayer', () => {
    it('should return null when threshold is not enabled', () => {
      const styles = {
        thresholdLine: {
          show: false,
          value: 10,
          color: '#FF0000',
          width: 2,
          style: ThresholdLineStyle.Full,
        },
      };
      expect(createThresholdLayer(styles)).toBeNull();
    });

    it('should create a threshold layer with tooltip when enabled', () => {
      const styles = {
        addTooltip: true,
        thresholdLine: {
          show: true,
          value: 10,
          color: '#FF0000',
          width: 2,
          style: ThresholdLineStyle.Dashed,
        },
      };
      const result = createThresholdLayer(styles);
      expect(result).toMatchObject({
        mark: {
          type: 'rule',
          color: '#FF0000',
          strokeWidth: 2,
          strokeDash: [5, 5],
          tooltip: true,
        },
        encoding: {
          y: {
            datum: 10,
            type: 'quantitative',
          },
          tooltip: {
            value: expect.stringContaining('Threshold: 10'),
          },
        },
      });
    });

    it('should create a threshold layer without tooltip when tooltips are disabled', () => {
      const styles = {
        addTooltip: false,
        thresholdLine: {
          show: true,
          value: 10,
          color: '#FF0000',
          width: 2,
          style: ThresholdLineStyle.Full,
        },
      };
      const result = createThresholdLayer(styles);
      expect(result).toMatchObject({
        mark: {
          type: 'rule',
          color: '#FF0000',
          strokeWidth: 2,
          strokeDash: undefined,
          tooltip: false,
        },
        encoding: {
          y: {
            datum: 10,
            type: 'quantitative',
          },
        },
      });
      expect(result.encoding.tooltip).toBeUndefined();
    });
  });

  describe('createTimeMarkerLayer', () => {
    it('should return null when time marker is not enabled', () => {
      const styles = {
        addTimeMarker: false,
      };
      expect(createTimeMarkerLayer(styles)).toBeNull();
    });

    it('should create a time marker layer with tooltip when enabled', () => {
      const styles = {
        addTimeMarker: true,
        addTooltip: true,
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
        addTimeMarker: true,
        addTooltip: false,
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

  describe('applyAxisStyling', () => {
    const baseAxis = {
      title: 'Original Title',
      orient: Positions.BOTTOM,
    };

    const numericalColumns: VisColumn[] = [
      { id: 1, name: 'metric1', schema: VisFieldType.Numerical, column: 'field-1' },
      { id: 2, name: 'metric2', schema: VisFieldType.Numerical, column: 'field-2' },
    ];

    const dateColumns: VisColumn[] = [
      { id: 3, name: 'date', schema: VisFieldType.Date, column: 'field-3' },
    ];

    it('should return the base axis when styles is undefined', () => {
      expect(applyAxisStyling(baseAxis, undefined as any, 'category')).toBe(baseAxis);
    });

    it('should apply category axis styling', () => {
      const styles = {
        categoryAxes: [
          {
            id: 'CategoryAxis-1',
            type: 'category' as const,
            title: { text: 'Custom Category Title' },
            position: Positions.TOP as Positions.TOP,
            show: true,
            labels: {
              show: true,
              filter: true,
              rotate: 45,
              truncate: 50,
            },
          },
        ],
        grid: {
          categoryLines: true,
          valueLines: true,
        },
      };

      const result = applyAxisStyling(baseAxis, styles, 'category');
      expect(result).toMatchObject({
        title: 'Custom Category Title',
        orient: Positions.TOP,
        labelAngle: 45,
        labelLimit: 50,
        grid: true,
        labels: true,
      });
    });

    it('should hide category axis when show is false', () => {
      const styles = {
        categoryAxes: [
          {
            id: 'CategoryAxis-1',
            type: 'category' as const,
            position: Positions.BOTTOM as Positions.BOTTOM,
            show: false,
            labels: {
              show: true,
              filter: true,
              rotate: 0,
              truncate: 100,
            },
            title: {
              text: '',
            },
          },
        ],
        grid: {
          categoryLines: true,
          valueLines: true,
        },
      };

      const result = applyAxisStyling(baseAxis, styles, 'category');
      expect(result).toMatchObject({
        title: null,
        labels: false,
        ticks: false,
        domain: false,
        grid: false,
      });
    });

    it('should apply value axis styling', () => {
      const styles = {
        valueAxes: [
          {
            id: 'ValueAxis-1',
            name: 'LeftAxis-1',
            type: 'value' as const,
            title: { text: 'Custom Value Title' },
            position: Positions.RIGHT as Positions.RIGHT,
            show: true,
            labels: {
              show: true,
              filter: false,
              rotate: 30,
              truncate: 80,
            },
          },
        ],
        grid: {
          categoryLines: true,
          valueLines: true,
        },
      };

      const result = applyAxisStyling(baseAxis, styles, 'value');
      expect(result).toMatchObject({
        title: 'Custom Value Title',
        orient: Positions.RIGHT,
        labelAngle: 30,
        labelLimit: 80,
        grid: true,
        labels: true,
      });
    });

    it('should hide value axis when show is false', () => {
      const styles = {
        valueAxes: [
          {
            id: 'ValueAxis-1',
            name: 'LeftAxis-1',
            type: 'value' as const,
            position: Positions.LEFT as Positions.LEFT,
            show: false,
            labels: {
              show: true,
              filter: false,
              rotate: 0,
              truncate: 100,
            },
            title: {
              text: '',
            },
          },
        ],
        grid: {
          categoryLines: true,
          valueLines: true,
        },
      };

      const result = applyAxisStyling(baseAxis, styles, 'value');
      expect(result).toMatchObject({
        title: null,
        labels: false,
        ticks: false,
        domain: false,
        grid: false,
      });
    });

    it('should handle Rule 2 (two metrics, one date) correctly', () => {
      const styles = {
        valueAxes: [
          {
            id: 'ValueAxis-1',
            name: 'LeftAxis-1',
            type: 'value' as const,
            position: Positions.LEFT as Positions.LEFT,
            show: true,
            labels: {
              show: true,
              filter: false,
              rotate: 0,
              truncate: 100,
            },
            title: {
              text: '',
            },
          },
          {
            id: 'ValueAxis-2',
            name: 'RightAxis-1',
            type: 'value' as const,
            position: Positions.RIGHT as Positions.RIGHT,
            show: true,
            labels: {
              show: true,
              filter: false,
              rotate: 0,
              truncate: 100,
            },
            title: {
              text: '',
            },
          },
        ],
        grid: {
          categoryLines: true,
          valueLines: true,
        },
      };

      // Test left axis
      const leftResult = applyAxisStyling(
        baseAxis,
        styles,
        'value',
        numericalColumns,
        [],
        dateColumns,
        ValueAxisPosition.Left
      );
      expect(leftResult.orient).toBe(Positions.LEFT);

      // Test right axis
      const rightResult = applyAxisStyling(
        baseAxis,
        styles,
        'value',
        numericalColumns,
        [],
        dateColumns,
        ValueAxisPosition.Right
      );
      expect(rightResult.orient).toBe(Positions.RIGHT);
    });
  });
});
