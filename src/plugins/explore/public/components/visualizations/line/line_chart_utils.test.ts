/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getVegaInterpolation,
  buildMarkConfig,
  createTimeMarkerLayer,
  applyAxisStyling,
  ValueAxisPosition,
} from './line_chart_utils';
import { VisColumn, VisFieldType, Positions } from '../types';
import { LineChartStyleControls } from './line_vis_config';

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
        tooltipOptions: { mode: 'all' as const },
      };
      const result = buildMarkConfig(styles, 'bar');
      expect(result).toEqual({
        type: 'bar',
        opacity: 0.87,
        tooltip: true,
      });
    });

    it('should build a point-only mark config when lineStyle is dots', () => {
      const styles: Partial<LineChartStyleControls> = {
        lineStyle: 'dots',
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
      const styles: Partial<LineChartStyleControls> = {
        lineStyle: 'line',
        lineWidth: 3,
        lineMode: 'straight',
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
      const styles: Partial<LineChartStyleControls> = {
        lineStyle: 'both',
        lineWidth: 2,
        lineMode: 'smooth',
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
      const styles: Partial<LineChartStyleControls> = {
        addTimeMarker: false,
      };
      expect(createTimeMarkerLayer(styles)).toBeNull();
    });

    it('should create a time marker layer with tooltip when enabled', () => {
      const styles: Partial<LineChartStyleControls> = {
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
      const styles: Partial<LineChartStyleControls> = {
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

  describe('applyAxisStyling', () => {
    const baseAxis = {
      title: 'Original Title',
      orient: Positions.BOTTOM,
    };

    const numericalColumns: VisColumn[] = [
      {
        id: 1,
        name: 'metric1',
        schema: VisFieldType.Numerical,
        column: 'field-1',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      },
      {
        id: 2,
        name: 'metric2',
        schema: VisFieldType.Numerical,
        column: 'field-2',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      },
    ];

    const dateColumns: VisColumn[] = [
      {
        id: 3,
        name: 'date',
        schema: VisFieldType.Date,
        column: 'field-3',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      },
    ];

    it('should return the base axis when styles is undefined', () => {
      expect(applyAxisStyling(baseAxis, undefined as any, 'category')).toBe(baseAxis);
    });

    it('should apply category axis styling', () => {
      const styles: Partial<LineChartStyleControls> = {
        categoryAxes: [
          {
            id: 'CategoryAxis-1',
            type: 'category' as const,
            title: { text: 'Custom Category Title' },
            position: Positions.TOP,
            show: true,
            grid: {
              showLines: true,
            },
            labels: {
              show: true,
              filter: true,
              rotate: 45,
              truncate: 50,
            },
          },
        ],
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
      const styles: Partial<LineChartStyleControls> = {
        categoryAxes: [
          {
            id: 'CategoryAxis-1',
            type: 'category' as const,
            position: Positions.BOTTOM,
            show: false,
            labels: {
              show: true,
              filter: true,
              rotate: 0,
              truncate: 100,
            },
            grid: {
              showLines: true,
            },
            title: {
              text: '',
            },
          },
        ],
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
      const styles: Partial<LineChartStyleControls> = {
        valueAxes: [
          {
            id: 'ValueAxis-1',
            name: 'LeftAxis-1',
            type: 'value' as const,
            title: { text: 'Custom Value Title' },
            position: Positions.RIGHT,
            show: true,
            labels: {
              show: true,
              filter: false,
              rotate: 30,
              truncate: 80,
            },
            grid: {
              showLines: true,
            },
          },
        ],
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
      const styles: Partial<LineChartStyleControls> = {
        valueAxes: [
          {
            id: 'ValueAxis-1',
            name: 'LeftAxis-1',
            type: 'value' as const,
            position: Positions.LEFT,
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
            grid: {
              showLines: true,
            },
          },
        ],
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
      const styles: Partial<LineChartStyleControls> = {
        valueAxes: [
          {
            id: 'ValueAxis-1',
            name: 'LeftAxis-1',
            type: 'value' as const,
            position: Positions.LEFT,
            show: true,
            labels: {
              show: true,
              filter: false,
              rotate: 0,
              truncate: 100,
            },
            grid: {
              showLines: true,
            },
            title: {
              text: 'Left Axis',
            },
          },
          {
            id: 'ValueAxis-2',
            name: 'RightAxis-1',
            type: 'value' as const,
            position: Positions.RIGHT,
            show: true,
            labels: {
              show: true,
              filter: false,
              rotate: 0,
              truncate: 100,
            },
            grid: {
              showLines: true,
            },
            title: {
              text: 'Right Axis',
            },
          },
        ],
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
      expect(leftResult.title).toBe('Left Axis');

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
      expect(rightResult.title).toBe('Right Axis');
    });
  });
});
