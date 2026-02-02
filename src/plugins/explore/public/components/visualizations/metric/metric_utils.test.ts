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

  // Helper to remove renderItem function for snapshot comparison
  const seriesForSnapshot = (series?: any[]) => {
    if (!series) {
      throw Error('No series was created');
    }
    return series.map((s) => {
      const { renderItem, ...rest } = s;
      return {
        ...rest,
        renderItem: renderItem ? 'function' : undefined,
      };
    });
  };

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
        });

        const state = result(createMockState());
        expect(state.series?.length).toBeTruthy();
        expect(seriesForSnapshot(state.series)).toMatchSnapshot();
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
        expect(seriesForSnapshot(state.series)).toMatchSnapshot();
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
          styles,
        });

        const state = result(createMockState());
        expect(seriesForSnapshot(state.series!)).toMatchSnapshot();
      });

      it('should create metric with percentage display', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          showPercentage: true,
          percentageColor: 'standard',
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        expect(seriesForSnapshot(state.series!)).toMatchSnapshot();
      });

      it('should create metric with custom font sizes', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          fontSize: 80,
          titleSize: 24,
          percentageSize: 16,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        expect(seriesForSnapshot(state.series!)).toMatchSnapshot();
      });

      it('should create metric with unit formatting', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          unitId: 'percentage',
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        expect(seriesForSnapshot(state.series!)).toMatchSnapshot();
      });

      it('should create metric without title', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          showTitle: false,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        expect(seriesForSnapshot(state.series!)).toMatchSnapshot();
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
          styles,
        });

        const state = result(createMockState({ transformedData }));
        expect(seriesForSnapshot(state.series!)).toMatchSnapshot();
      });

      it('should create metric with inverted percentage colors', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          showPercentage: true,
          percentageColor: 'inverted',
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        expect(seriesForSnapshot(state.series!)).toMatchSnapshot();
      });
    });

    describe('renderItem function tests', () => {
      it('should snapshot renderItem output for basic metric', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          showTitle: true,
          title: 'Test Title',
          showPercentage: true,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        const customSeries = state.series!.find((s) => s.type === 'custom') as any;

        const mockParams = { context: {} };
        const mockApi = {
          getWidth: () => 300,
          getHeight: () => 200,
        };

        const renderResult = customSeries.renderItem(mockParams as any, mockApi as any);
        expect(renderResult).toMatchSnapshot();
      });

      it('should snapshot renderItem output with custom font sizes', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          showTitle: true,
          title: 'Custom Fonts',
          fontSize: 80,
          titleSize: 24,
          percentageSize: 16,
          showPercentage: true,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        const customSeries = state.series!.find((s) => s.type === 'custom') as any;

        const mockParams = { context: {} };
        const mockApi = {
          getWidth: () => 300,
          getHeight: () => 200,
        };

        const renderResult = customSeries.renderItem(mockParams as any, mockApi as any);
        expect(renderResult).toMatchSnapshot();
      });

      it('should snapshot renderItem output without title or percentage', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          showTitle: false,
          showPercentage: false,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        const customSeries = state.series!.find((s) => s.type === 'custom') as any;

        const mockParams = { context: {} };
        const mockApi = {
          getWidth: () => 300,
          getHeight: () => 200,
        };

        const renderResult = customSeries.renderItem(mockParams as any, mockApi as any);
        expect(renderResult).toMatchSnapshot();
      });

      it('should create renderItem function that returns group with children', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          showTitle: true,
          showPercentage: true,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        const customSeries = state.series!.find((s) => s.type === 'custom') as any;

        expect(customSeries).toBeDefined();
        expect(customSeries.renderItem).toBeDefined();
        expect(typeof customSeries.renderItem).toBe('function');

        const mockParams = { context: {} };
        const mockApi = {
          getWidth: () => 300,
          getHeight: () => 200,
        };

        const renderResult = customSeries.renderItem(mockParams as any, mockApi as any);

        expect(renderResult).toHaveProperty('type', 'group');
        expect(renderResult).toHaveProperty('children');
        expect(Array.isArray(renderResult.children)).toBe(true);
      });

      it('should render three text elements (title, value, percentage) when all enabled', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          showTitle: true,
          title: 'Test Title',
          showPercentage: true,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        const customSeries = state.series!.find((s) => s.type === 'custom') as any;

        const mockParams = { context: {} };
        const mockApi = {
          getWidth: () => 300,
          getHeight: () => 200,
        };

        const renderResult = customSeries.renderItem(mockParams as any, mockApi as any);

        expect(renderResult.children).toHaveLength(3);
        expect(renderResult.children[0]).toHaveProperty('type', 'text');
        expect(renderResult.children[0]).toHaveProperty('style.text', 'Test Title');
        expect(renderResult.children[1]).toHaveProperty('type', 'text');
        expect(renderResult.children[2]).toHaveProperty('type', 'text');
      });

      it('should render empty title when showTitle is false', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          showTitle: false,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        const customSeries = state.series!.find((s) => s.type === 'custom') as any;

        const mockParams = { context: {} };
        const mockApi = {
          getWidth: () => 300,
          getHeight: () => 200,
        };

        const renderResult = customSeries.renderItem(mockParams as any, mockApi as any);

        expect(renderResult.children[0]).toHaveProperty('style.text', '');
      });

      it('should calculate font sizes based on chart dimensions', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        const customSeries = state.series!.find((s) => s.type === 'custom') as any;

        const mockParams = { context: {} };
        const mockApi = {
          getWidth: () => 400,
          getHeight: () => 300,
        };

        const renderResult = customSeries.renderItem(mockParams as any, mockApi as any);

        // Font sizes should be calculated based on dimensions
        expect(renderResult.children[0].style.fontSize).toBeGreaterThan(0);
        expect(renderResult.children[1].style.fontSize).toBeGreaterThan(0);
        expect(renderResult.children[2].style.fontSize).toBeGreaterThan(0);
      });

      it('should use custom font sizes when provided', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          fontSize: 80,
          titleSize: 24,
          percentageSize: 16,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        const customSeries = state.series!.find((s) => s.type === 'custom') as any;

        const mockParams = { context: {} };
        const mockApi = {
          getWidth: () => 300,
          getHeight: () => 200,
        };

        const renderResult = customSeries.renderItem(mockParams as any, mockApi as any);

        expect(renderResult.children[0].style.fontSize).toBe(24); // titleSize
        expect(renderResult.children[1].style.fontSize).toBe(80); // fontSize
        expect(renderResult.children[2].style.fontSize).toBe(16); // percentageSize
      });

      it('should position elements correctly', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
          showTitle: true,
          showPercentage: true,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        const customSeries = state.series!.find((s) => s.type === 'custom') as any;

        const mockParams = { context: {} };
        const mockApi = {
          getWidth: () => 300,
          getHeight: () => 200,
        };

        const renderResult = customSeries.renderItem(mockParams as any, mockApi as any);

        // Group should be positioned
        expect(renderResult).toHaveProperty('x');
        expect(renderResult).toHaveProperty('y');

        // Text elements should have y positions
        expect(renderResult.children[0].style.y).toBe(0);
        expect(renderResult.children[1].style.y).toBeGreaterThan(0);
        expect(renderResult.children[2].style.y).toBeGreaterThan(renderResult.children[1].style.y);
      });

      it('should center align all text elements', () => {
        const styles: MetricChartStyle = {
          ...defaultMetricChartStyles,
        };

        const result = createMetricChartSeries({
          seriesFields: ['value_field'],
          styles,
        });

        const state = result(createMockState());
        const customSeries = state.series!.find((s) => s.type === 'custom') as any;

        const mockParams = { context: {} };
        const mockApi = {
          getWidth: () => 300,
          getHeight: () => 200,
        };

        const renderResult = customSeries.renderItem(mockParams as any, mockApi as any);

        renderResult.children.forEach((child: any) => {
          expect(child.style.textAlign).toBe('center');
        });
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
          styles,
        });

        const state = result(createMockState({ transformedData }));
        expect(state.series).toBeDefined();
      });
    });
  });

  describe('assembleForMetric', () => {
    it('should configure spec correctly for metric visualization', () => {
      const initialState = createMockState();
      const result = assembleForMetric(initialState);

      expect(result.spec).toMatchSnapshot();
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
