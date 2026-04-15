/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createMetricChartSeries,
  assembleForMetric,
  constrainFontSizeByWidth,
} from './metric_utils';
import { MetricChartStyle, defaultMetricChartStyles } from './metric_vis_config';
import { EChartsSpecState } from '../utils/echarts_spec';
import { VisColumn, VisFieldType, Threshold } from '../types';

describe('metric_utils', () => {
  // Test fixtures
  const mockVisColumn: VisColumn = {
    id: 1,
    name: 'Test Metric',
    schema: VisFieldType.Numerical,
    column: 'value_field',
    validValuesCount: 10,
    uniqueValuesCount: 8,
  };

  const createMockState = (overrides = {}): EChartsSpecState<MetricChartStyle> => ({
    transformedData: [['value_field'], [100], [150], [200], [250]],
    axisColumnMappings: {
      value: mockVisColumn,
    },
    data: [],
    spec: {
      grid: {},
      xAxis: {},
      yAxis: {},
      tooltip: {},
      legend: {},
    },
    styles: defaultMetricChartStyles,
    ...overrides,
  });

  describe('createMetricChartSeries', () => {
    describe('snapshot tests', () => {
      it('should create basic metric series structure', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          showTitle: true,
          title: 'Test Title',
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
          dateField: 'date_field',
        });

        const state = result(createMockState());
        expect(state.series?.length).toBeTruthy();
        expect(state.series).toMatchSnapshot();
      });

      it('should create metric with sparkline when date field is provided', () => {
        const transformedData = [
          ['value_field', 'date_field'],
          [100, '2024-01-01'],
          [150, '2024-01-02'],
          [200, '2024-01-03'],
        ];

        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          showTitle: true,
          title: 'Test Metric',
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          dateField: 'date_field',
          styles,
        });

        const state = result(createMockState({ transformedData }));
        expect(state.series).toMatchSnapshot();
      });

      it('should create metric with threshold colors enabled', () => {
        const thresholds: Threshold[] = [
          { value: 100, color: '#ffcc00' },
          { value: 200, color: '#ff0000' },
        ];

        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          useThresholdColor: true,
          thresholdOptions: {
            baseColor: '#00ff00',
            thresholds,
          },
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          dateField: 'date_field',
          styles,
        });

        const state = result(createMockState());
        expect(state.series!).toMatchSnapshot();
      });

      it('should create multiple metric series', () => {
        const transformedData = [
          ['value_field', 'value_field_2'],
          [100, 300],
          [150, 350],
          [200, 400],
        ];

        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field', 'value_field_2'],
          dateField: 'date_field',
          styles,
        });

        const state = result(createMockState({ transformedData }));
        expect(state.series!).toMatchSnapshot();
      });

      it('should apply white sparkline color for background color modes', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          colorMode: 'background_solid',
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          dateField: 'date_field',
          styles,
        });

        const state = result(createMockState());
        const lineSeries = state.series![0] as any;
        expect(lineSeries.lineStyle.color).toBe('rgba(255, 255, 255, 0.7)');
        expect(lineSeries.areaStyle.color).toBe('rgba(255, 255, 255, 0.7)');
      });

      it('should apply threshold color when useThresholdColor is true', () => {
        const thresholds: Threshold[] = [
          { value: 100, color: '#ffcc00' },
          { value: 200, color: '#ff0000' },
        ];

        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          colorMode: 'value',
          useThresholdColor: true,
          thresholdOptions: {
            baseColor: '#00ff00',
            thresholds,
          },
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          dateField: 'date_field',
          styles,
        });

        const state = result(createMockState());
        const lineSeries = state.series![0] as any;
        // With max value 250, should use the second threshold color
        expect(lineSeries.lineStyle.color).toBe('#ff0000');
        expect(lineSeries.areaStyle.color).toBe('#ff0000');
      });
    });

    describe('edge cases', () => {
      it('should handle empty data gracefully', () => {
        const transformedData = [['value_field']];

        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          dateField: 'date_field',
          styles,
        });

        const state = result(createMockState({ transformedData }));
        expect(state.series).toBeDefined();
        expect(state.series!.length).toBeGreaterThan(0);
      });

      it('should handle NaN values', () => {
        const transformedData = [['value_field'], [NaN], [100], [NaN]];

        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          dateField: 'date_field',
          styles,
        });

        const state = result(createMockState({ transformedData }));
        expect(state.series).toBeDefined();
      });

      it('should handle null values', () => {
        const transformedData = [['value_field'], [null], [100], [null]];

        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          dateField: 'date_field',
          styles,
        });

        const state = result(createMockState({ transformedData }));
        expect(state.series).toBeDefined();
      });

      it('should handle missing transformedData', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          dateField: 'date_field',
          styles,
        });

        const state = result(createMockState({ transformedData: [] }));
        expect(state.series).toBeDefined();
        expect(state.series!.length).toBe(0);
      });
    });
  });

  describe('assembleForMetric', () => {
    it('should configure spec correctly for metric visualization', () => {
      const initialState = createMockState();
      const result = assembleForMetric(initialState);

      expect(result.spec).toMatchSnapshot();
    });

    it('should hide axes and set grid to zero margins', () => {
      const initialState = createMockState();
      const result = assembleForMetric(initialState);

      expect(result.spec!.grid).toEqual({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      });
      expect(result.spec!.xAxis).toEqual({ show: false, silent: true });
      expect(result.spec!.yAxis).toEqual({ show: false, silent: true });
    });

    it('should hide tooltip and legend', () => {
      const initialState = createMockState();
      const result = assembleForMetric(initialState);

      expect(result.spec!.tooltip).toEqual({ show: false });
      expect(result.spec!.legend).toEqual({ show: false });
    });

    it('should preserve existing spec properties while hiding axes', () => {
      const initialState = createMockState();
      initialState.spec!.xAxis = {
        type: 'category',
        data: ['A', 'B', 'C'],
      };
      initialState.spec!.yAxis = {
        type: 'value',
        min: 0,
        max: 100,
      };

      const result = assembleForMetric(initialState);

      expect(result.spec).toMatchSnapshot();
    });

    it('should not modify the original state', () => {
      const initialState = createMockState();
      const originalSpec = JSON.parse(JSON.stringify(initialState.spec));

      assembleForMetric(initialState);

      expect(initialState.spec).toEqual(originalSpec);
    });

    it('should preserve other state properties', () => {
      const initialState = createMockState();
      initialState.transformedData = [['field'], [1], [2], [3]];
      initialState.data = [{ field: 1 }, { field: 2 }];
      initialState.series = [{ type: 'line', data: [1, 2, 3] }];

      const result = assembleForMetric(initialState);

      expect(result.transformedData).toEqual(initialState.transformedData);
      expect(result.data).toEqual(initialState.data);
      expect(result.series).toEqual(initialState.series);
    });
  });

  describe('constrainFontSizeByWidth', () => {
    describe('basic functionality', () => {
      it('should return desired font size when text fits within container', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 300,
          text: 'Hello',
          fontSize: 40,
        });

        // With default charWidthRatio (0.6) and paddingRatio (0.15):
        // availableWidth = 300 * 0.85 = 255
        // maxSizeByWidth = 255 / (5 * 0.6) = 255 / 3 = 85
        // Result should be min(40, 85) = 40
        expect(result).toBe(40);
      });

      it('should constrain font size when text is too long', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 100,
          text: 'Very Long Text That Will Not Fit',
          fontSize: 48,
        });

        // availableWidth = 100 * 0.85 = 85
        // text length = 33
        // maxSizeByWidth = 85 / (33 * 0.6) = 85 / 19.8 ≈ 4.29
        // Result should be constrained by minSize (default 10)
        expect(result).toBe(10);
      });

      it('should respect minSize parameter', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 50,
          text: 'Very Long Text',
          fontSize: 40,
          minSize: 14,
        });

        // With such small container and long text, it would calculate very small
        // but should be constrained by minSize
        expect(result).toBe(14);
      });

      it('should respect maxSize parameter', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 1000,
          text: 'Hi',
          fontSize: 200,
          maxSize: 60,
        });

        // Large container with short text would allow large font
        // but should be constrained by maxSize
        expect(result).toBe(60);
      });
    });

    describe('edge cases', () => {
      it('should handle empty text gracefully', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 300,
          text: '',
          fontSize: 40,
        });

        // Empty text should return fontSize within bounds
        expect(result).toBe(40);
      });

      it('should handle zero container width', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 0,
          text: 'Test',
          fontSize: 40,
          minSize: 12,
          maxSize: 60,
        });

        // Should return fontSize constrained by min/max
        expect(result).toBe(40);
      });

      it('should handle negative container width', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: -100,
          text: 'Test',
          fontSize: 40,
          minSize: 12,
          maxSize: 60,
        });

        // Should return fontSize constrained by min/max
        expect(result).toBe(40);
      });

      it('should handle single character text', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 100,
          text: 'A',
          fontSize: 50,
        });

        // availableWidth = 100 * 0.85 = 85
        // maxSizeByWidth = 85 / (1 * 0.6) = 141.67
        // Result should be min(50, 141.67) = 50
        expect(result).toBe(50);
      });

      it('should handle very long text', () => {
        const longText = 'A'.repeat(1000);
        const result = constrainFontSizeByWidth({
          containerWidth: 300,
          text: longText,
          fontSize: 40,
          minSize: 8,
        });

        // Should be constrained to minSize
        expect(result).toBe(8);
      });
    });

    describe('custom padding and character width ratios', () => {
      it('should respect custom paddingRatio', () => {
        const result1 = constrainFontSizeByWidth({
          containerWidth: 200,
          text: 'Test Text',
          fontSize: 40,
          paddingRatio: 0.1, // 10% padding
        });

        const result2 = constrainFontSizeByWidth({
          containerWidth: 200,
          text: 'Test Text',
          fontSize: 40,
          paddingRatio: 0.3, // 30% padding
        });

        // More padding means less available width, so smaller font size
        expect(result1).toBeGreaterThan(result2);
      });

      it('should respect custom charWidthRatio', () => {
        const result1 = constrainFontSizeByWidth({
          containerWidth: 200,
          text: 'Test Text',
          fontSize: 40,
          charWidthRatio: 0.5, // Narrow characters
        });

        const result2 = constrainFontSizeByWidth({
          containerWidth: 200,
          text: 'Test Text',
          fontSize: 40,
          charWidthRatio: 0.8, // Wide characters
        });

        // Narrower characters allow larger font size
        expect(result1).toBeGreaterThan(result2);
      });

      it('should handle zero paddingRatio', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 200,
          text: 'Test',
          fontSize: 40,
          paddingRatio: 0,
        });

        // availableWidth = 200 * 1 = 200
        // maxSizeByWidth = 200 / (4 * 0.6) = 200 / 2.4 ≈ 83.33
        // Result should be min(40, 83.33) = 40
        expect(result).toBe(40);
      });
    });

    describe('boundary conditions', () => {
      it('should handle minSize equal to maxSize', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 200,
          text: 'Test',
          fontSize: 40,
          minSize: 30,
          maxSize: 30,
        });

        expect(result).toBe(30);
      });

      it('should handle minSize greater than fontSize', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 200,
          text: 'Test',
          fontSize: 20,
          minSize: 30,
          maxSize: 60,
        });

        // Should be constrained to minSize
        expect(result).toBe(30);
      });

      it('should handle maxSize less than fontSize', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 500,
          text: 'A',
          fontSize: 100,
          minSize: 10,
          maxSize: 50,
        });

        // Should be constrained to maxSize
        expect(result).toBe(50);
      });

      it('should handle very small minSize', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 50,
          text: 'Very Long Text String',
          fontSize: 40,
          minSize: 1,
        });

        // Should calculate small size based on constraints
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThan(40);
      });

      it('should handle very large maxSize', () => {
        const result = constrainFontSizeByWidth({
          containerWidth: 1000,
          text: 'A',
          fontSize: 50,
          maxSize: 500,
        });

        // Should return fontSize since it fits
        expect(result).toBe(50);
      });
    });
  });
});
