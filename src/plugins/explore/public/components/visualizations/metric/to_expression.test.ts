/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSingleMetric } from './to_expression';
import { VisColumn, VisFieldType, AxisRole, AxisColumnMappings } from '../types';
import { MetricChartStyle, defaultMetricChartStyles } from './metric_vis_config';

// Mock the utils module
jest.mock('../utils/utils', () => ({
  generateColorBySchema: jest.fn().mockReturnValue(['#123456', '#789abc', '#def012']),
  calculateValue: jest.fn().mockReturnValue(45),
  getTooltipFormat: jest.fn().mockReturnValue('%b %d, %Y %H:%M:%S'),
  getMaxAndMinBase: jest.fn(() => ({ minBase: 10, maxBase: 200 })),
  getChartRender: jest.fn().mockReturnValue('vega'),
}));

describe('to_expression', () => {
  // Sample data for testing
  const transformedData = [{ 'field-1': 100 }, { 'field-1': 200 }];

  const numericColumn: VisColumn = {
    id: 1,
    name: 'value1',
    schema: VisFieldType.Numerical,
    column: 'field-1',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const dateColumn: VisColumn = {
    id: 2,
    name: 'date1',
    schema: VisFieldType.Date,
    column: 'date-field',
    validValuesCount: 2,
    uniqueValuesCount: 2,
  };

  const defaultStyleOptions: MetricChartStyle = {
    ...defaultMetricChartStyles,
    showTitle: true,
    title: 'Test Metric',
    fontSize: 60,
    useThresholdColor: false,
    valueCalculation: 'last',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSingleMetric', () => {
    it('should create a basic metric visualization with default style options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Value]: numericColumn,
      };

      const result = createSingleMetric(
        transformedData,
        [numericColumn],
        [],
        [],
        defaultStyleOptions,
        mockAxisColumnMappings
      );

      // Verify the result structure
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('layer');
      // @ts-expect-error TS18048 TODO(ts-error): fixme
      expect(result.layer).toHaveLength(2); // Main layer + title layer

      // Verify the main layer (text mark)
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.type', 'text');
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.fontSize', 60);
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('encoding.text.field', 'value');
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('encoding.text.type', 'nominal');

      // Verify the title layer
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[1]).toHaveProperty('mark.type', 'text');
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[1]).toHaveProperty('data.values', [{ title: 'Test Metric' }]);
    });

    it('should use the column name as title when title is not provided', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Value]: numericColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        title: '',
      };

      const result = createSingleMetric(
        transformedData,
        [numericColumn],
        [],
        [],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify the title layer uses the column name
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[1].data.values).toEqual([{ title: 'value1' }]);
    });

    it('should not include title layer when showTitle is false', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Value]: numericColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        showTitle: false,
      };

      const result = createSingleMetric(
        transformedData,
        [numericColumn],
        [],
        [],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify only one layer (no title layer)
      // @ts-expect-error TS18048 TODO(ts-error): fixme
      expect(result.layer).toHaveLength(1);
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.type', 'text');
    });

    it('should add sparkLineLayer when date column is provided', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Value]: numericColumn,
        [AxisRole.Time]: dateColumn,
      };

      const timeSeriesData = [
        { 'field-1': 100, 'date-field': '2023-01-01' },
        { 'field-1': 200, 'date-field': '2023-01-02' },
      ];

      const result = createSingleMetric(
        timeSeriesData,
        [numericColumn],
        [],
        [dateColumn],
        defaultStyleOptions,
        mockAxisColumnMappings
      );

      // Verify the result structure
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('layer');
      // @ts-expect-error TS18048 TODO(ts-error): fixme
      expect(result.layer).toHaveLength(3); // sparkLineLayer + main layer + title layer

      // Verify the sparkLineLayer (first layer)
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.type', 'area');
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('encoding.x.field', 'date-field');
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('encoding.x.type', 'temporal');
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('encoding.y.field', 'field-1');
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('encoding.y.type', 'quantitative');
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0].encoding.y.scale.range).toEqual([
        { expr: 'height' },
        { expr: '2*height/3' },
      ]);
    });

    it('should not add sparkLineLayer when date column is not provided', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Value]: numericColumn,
      };

      const result = createSingleMetric(
        transformedData,
        [numericColumn],
        [],
        [],
        defaultStyleOptions,
        mockAxisColumnMappings
      );

      // Verify the result structure
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('layer');
      // @ts-expect-error TS18048 TODO(ts-error): fixme
      expect(result.layer).toHaveLength(2); // Only main layer + title layer, no sparkLineLayer
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.type', 'text'); // First layer should be text, not area
    });

    it('should correctly position layers when sparkLineLayer is present', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Value]: numericColumn,
        [AxisRole.Time]: dateColumn,
      };

      const timeSeriesData = [
        { 'field-1': 100, 'date-field': '2023-01-01' },
        { 'field-1': 200, 'date-field': '2023-01-02' },
      ];

      const result = createSingleMetric(
        timeSeriesData,
        [numericColumn],
        [],
        [dateColumn],
        defaultStyleOptions,
        mockAxisColumnMappings
      );

      // Verify layer order and types
      // @ts-expect-error TS18048 TODO(ts-error): fixme
      expect(result.layer).toHaveLength(3);
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0]).toHaveProperty('mark.type', 'area'); // First layer is sparkLineLayer
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[1]).toHaveProperty('mark.type', 'text'); // Second layer is value text
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[2]).toHaveProperty('mark.type', 'text'); // Third layer is title text

      // Verify the data is passed correctly to sparkLineLayer
      // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
      expect(result.layer[0].data.values).toEqual(timeSeriesData);
    });
  });
});
