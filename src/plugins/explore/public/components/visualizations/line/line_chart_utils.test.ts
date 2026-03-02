/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getVegaInterpolation,
  buildMarkConfig,
  createTimeMarkerLayer,
  createLineSeries,
  createLineBarSeries,
  createFacetLineSeries,
} from './line_chart_utils';
import { defaultLineChartStyles, LineMode } from './line_vis_config';
import { VisColumn, VisFieldType, ThresholdMode } from '../types';
import { EChartsSpecState } from '../utils/echarts_spec';
import { LineStyle } from './line_exclusive_vis_options';

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

  describe('createLineSeries', () => {
    const mockState = {
      xAxisConfig: { type: 'category' },
      transformedData: [
        ['x', 'y1', 'y2'],
        [1, 10, 20],
        [2, 15, 25],
      ],
      axisColumnMappings: { y: { name: 'Value' } },
    } as EChartsSpecState;

    it('creates line series with array of series fields', () => {
      const styles = { ...defaultLineChartStyles, lineStyle: 'line' as LineStyle };
      const result = createLineSeries({
        styles,
        seriesFields: ['y1', 'y2'],
        categoryField: 'x',
      })(mockState);

      expect(result.series).toHaveLength(2);
      expect(result.series?.[0]).toMatchObject({
        name: 'y1',
        type: 'line',
        encode: { x: 'x', y: 'y1' },
        emphasis: {
          focus: 'self',
        },
      });
    });

    it('creates line series with function for series fields', () => {
      const styles = { ...defaultLineChartStyles };
      const seriesFieldsFn = (headers?: string[]) => headers?.slice(1) || [];
      const result = createLineSeries({
        styles,
        seriesFields: seriesFieldsFn,
        categoryField: 'x',
      })(mockState);
      expect(result.series).toHaveLength(2);

      expect(result.series?.[0]).toMatchObject({
        name: 'y1',
        type: 'line',
        encode: { x: 'x', y: 'y1' },
        emphasis: {
          focus: 'self',
        },
      });

      expect(result.series?.[1]).toMatchObject({
        name: 'y2',
        type: 'line',
        encode: { x: 'x', y: 'y2' },
        emphasis: {
          focus: 'self',
        },
      });
    });

    it('creates different line mode for line series', () => {
      const styles = { ...defaultLineChartStyles, lineMode: 'stepped' as LineMode };
      const result = createLineSeries({
        styles,
        seriesFields: ['y1'],
        categoryField: 'x',
      })(mockState);

      expect(result.series).toHaveLength(1);
      expect(result.series?.[0]).toMatchObject({ step: true });
    });

    it('extends x-axis range when time marker is enabled', () => {
      const styles = { ...defaultLineChartStyles, addTimeMarker: true };
      const result = createLineSeries({
        styles,
        seriesFields: ['y1'],
        categoryField: 'x',
      })(mockState);

      expect(result.xAxisConfig.max).toBeInstanceOf(Date);
    });

    it('add time marker when time marker is enabled', () => {
      const styles = { ...defaultLineChartStyles, addTimeMarker: true };
      const result = createLineSeries({
        styles,
        seriesFields: ['y1'],
        categoryField: 'x',
      })(mockState);

      expect(result.series?.[0]?.markLine?.data?.[0]?.xAxis).toBeInstanceOf(Date);
    });

    it('add thresholds lines', () => {
      const styles = {
        ...defaultLineChartStyles,
        thresholdOptions: {
          thresholdStyle: ThresholdMode.Solid,
          thresholds: [{ value: 10, color: 'red' }],
        },
      };
      const result = createLineSeries({
        styles,
        seriesFields: ['y1'],
        categoryField: 'x',
      })(mockState);

      expect(result.series?.[0]?.markLine?.data).toHaveLength(1);
      expect(result.series?.[0]?.markLine?.data).toMatchObject([
        { itemStyle: { color: 'red' }, yAxis: 10 },
      ]);
    });

    it('does not extend x-axis when time marker is disabled', () => {
      const styles = { ...defaultLineChartStyles, addTimeMarker: false };
      const result = createLineSeries({
        styles,
        seriesFields: ['y1'],
        categoryField: 'x',
        addTimeMarker: false,
      })(mockState);

      expect(result.xAxisConfig.max).toBeUndefined();
    });
  });

  describe('createLineBarSeries', () => {
    const mockState = {
      xAxisConfig: { type: 'category' },
      yAxisConfig: { type: 'value' },
    } as EChartsSpecState;

    const valueField: VisColumn = {
      id: 1,
      name: 'Line Value',
      column: 'lineCol',
      schema: VisFieldType.Numerical,
      validValuesCount: 10,
      uniqueValuesCount: 8,
    };

    const value2Field: VisColumn = {
      id: 2,
      name: 'Bar Value',
      column: 'barCol',
      schema: VisFieldType.Numerical,
      validValuesCount: 10,
      uniqueValuesCount: 7,
    };

    it('creates line and bar series with dual y-axes', () => {
      const styles = { ...defaultLineChartStyles };
      const result = createLineBarSeries({
        styles,
        valueField,
        value2Field,
        categoryField: 'x',
      })(mockState);

      expect(result.series).toHaveLength(2);
      expect(result.series?.[0]).toMatchObject({
        name: 'Line Value',
        type: 'line',
        encode: { x: 'x', y: 'lineCol' },
        emphasis: {
          focus: 'self',
        },
      });

      expect(result.series?.[1]).toMatchObject({
        name: 'Bar Value',
        type: 'bar',
        encode: { x: 'x', y: 'barCol' },
        emphasis: {
          focus: 'self',
        },
      });
      expect(result.yAxisConfig).toHaveLength(2);
    });

    it('extends x-axis when time marker is enabled', () => {
      const styles = { ...defaultLineChartStyles, addTimeMarker: true };
      const result = createLineBarSeries({
        styles,
        valueField,
        value2Field,
        categoryField: 'x',
      })(mockState);

      expect(result.xAxisConfig.max).toBeInstanceOf(Date);
    });

    it('add time marker when time marker is enabled', () => {
      const styles = { ...defaultLineChartStyles, addTimeMarker: true };
      const result = createLineBarSeries({
        styles,
        valueField,
        value2Field,
        categoryField: 'x',
      })(mockState);

      expect(result.series?.[0]?.markLine?.data?.[0]?.xAxis).toBeInstanceOf(Date);
    });

    it('add thresholds lines', () => {
      const styles = {
        ...defaultLineChartStyles,
        thresholdOptions: {
          thresholdStyle: ThresholdMode.Solid,
          thresholds: [{ value: 10, color: 'red' }],
        },
      };
      const result = createLineBarSeries({
        styles,
        valueField,
        value2Field,
        categoryField: 'x',
      })(mockState);

      expect(result.series?.[0]?.markLine?.data).toHaveLength(1);
      expect(result.series?.[0]?.markLine?.data).toMatchObject([
        { itemStyle: { color: 'red' }, yAxis: 10 },
      ]);
    });
  });

  describe('createFacetLineSeries', () => {
    const mockState = {
      xAxisConfig: [{ type: 'category' }, { type: 'category' }],
      transformedData: [
        [
          ['x', 'y1'],
          [1, 10],
          [2, 15],
        ],
        [
          ['x', 'y1'],
          [1, 20],
          [2, 25],
        ],
      ],
    } as EChartsSpecState;

    it('creates faceted line series', () => {
      const styles = { ...defaultLineChartStyles };
      const seriesFieldsFn = (headers?: string[]) => headers?.slice(1) || [];
      const result = createFacetLineSeries({
        styles,
        seriesFields: seriesFieldsFn,
        categoryField: 'x',
      })(mockState);

      expect(result.series).toHaveLength(2);
      expect(result.series?.[0]).toMatchObject({
        name: 'y1',
        type: 'line',
        encode: { x: 'x', y: 'y1' },
        emphasis: {
          focus: 'self',
        },
      });

      expect(result.series?.[1]).toMatchObject({
        name: 'y1',
        type: 'line',
        encode: { x: 'x', y: 'y1' },
        emphasis: {
          focus: 'self',
        },
      });
    });

    it('extends all x-axes when time marker is enabled', () => {
      const styles = { ...defaultLineChartStyles, addTimeMarker: true };
      const seriesFieldsFn = (headers?: string[]) => headers?.slice(1) || [];
      const result = createFacetLineSeries({
        styles,
        seriesFields: seriesFieldsFn,
        categoryField: 'x',
      })(mockState);

      expect(result.xAxisConfig[0].max).toBeInstanceOf(Date);
      expect(result.xAxisConfig[1].max).toBeInstanceOf(Date);
    });

    it('add time marker lines for each facet', () => {
      const styles = { ...defaultLineChartStyles, addTimeMarker: true };
      const seriesFieldsFn = (headers?: string[]) => headers?.slice(1) || [];
      const result = createFacetLineSeries({
        styles,
        seriesFields: seriesFieldsFn,
        categoryField: 'x',
      })(mockState);

      expect(result.series?.[0]?.markLine?.data?.[0]?.xAxis).toBeInstanceOf(Date);
      expect(result.series?.[1]?.markLine?.data?.[0]?.xAxis).toBeInstanceOf(Date);
    });

    it('add thresholds lines for each facet', () => {
      const styles = {
        ...defaultLineChartStyles,
        thresholdOptions: {
          thresholdStyle: ThresholdMode.Solid,
          thresholds: [{ value: 10, color: 'red' }],
        },
      };
      const seriesFieldsFn = (headers?: string[]) => headers?.slice(1) || [];
      const result = createFacetLineSeries({
        styles,
        seriesFields: seriesFieldsFn,
        categoryField: 'x',
      })(mockState);

      expect(result.series?.[0]?.markLine?.data).toMatchObject([
        { itemStyle: { color: 'red' }, yAxis: 10 },
      ]);
      expect(result.series?.[1]?.markLine?.data).toMatchObject([
        { itemStyle: { color: 'red' }, yAxis: 10 },
      ]);
    });
  });
});
