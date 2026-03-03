/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createMetricChartSeries, assembleForMetric } from './metric_utils';
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
});
