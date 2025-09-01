/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSingleMetric } from './to_expression';
import { VisColumn, VisFieldType, ColorSchemas, AxisRole, AxisColumnMappings } from '../types';
import * as utils from '../utils/utils';
import { MetricChartStyleControls } from './metric_vis_config';

// Mock the utils module
jest.mock('../utils/utils', () => ({
  generateColorBySchema: jest.fn().mockReturnValue(['#123456', '#789abc', '#def012']),
  calculateValue: jest.fn().mockReturnValue(45),
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

  const defaultStyleOptions: Partial<MetricChartStyleControls> = {
    showTitle: true,
    title: 'Test Metric',
    fontSize: 60,
    useColor: false,
    colorSchema: ColorSchemas.BLUES,
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
      expect(result.layer).toHaveLength(2); // Main layer + title layer

      // Verify the main layer (text mark)
      expect(result.layer[0]).toHaveProperty('mark.type', 'text');
      expect(result.layer[0]).toHaveProperty('mark.fontSize', 60);
      expect(result.layer[0]).toHaveProperty('encoding.text.field', 'formattedValue');
      expect(result.layer[0]).toHaveProperty('encoding.text.type', 'quantitative');

      // Verify the title layer
      expect(result.layer[1]).toHaveProperty('mark.type', 'text');
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
      expect(result.layer).toHaveLength(1);
      expect(result.layer[0]).toHaveProperty('mark.type', 'text');
    });

    it('should apply color conditions when useColor is true and customRanges are provided', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Value]: numericColumn,
      };

      const styleOptions = {
        ...defaultStyleOptions,
        useColor: true,
        colorSchema: ColorSchemas.BLUES,
        customRanges: [{ min: 0, max: 100 }, { min: 100, max: 200 }, { min: 200 }],
      };

      const result = createSingleMetric(
        transformedData,
        [numericColumn],
        [],
        [],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify color conditions are applied
      expect(result.layer[0].encoding).toHaveProperty('color');
      expect(result.layer[0].encoding.color).toHaveProperty('condition');
      expect(result.layer[0].encoding.color.condition).toHaveLength(3);

      // Verify the color conditions
      expect(result.layer[0].encoding.color.condition[0]).toHaveProperty(
        'test',
        'datum["formattedValue"] >= 0 && datum["formattedValue"] < 100'
      );
      expect(result.layer[0].encoding.color.condition[1]).toHaveProperty(
        'test',
        'datum["formattedValue"] >= 100 && datum["formattedValue"] < 200'
      );
      expect(result.layer[0].encoding.color.condition[2]).toHaveProperty(
        'test',
        'datum["formattedValue"] >= 200'
      );

      // Verify generateColorBySchema was called
      expect(utils.generateColorBySchema).toHaveBeenCalledWith(4, ColorSchemas.BLUES);
    });

    it('should handle empty style options gracefully', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Value]: numericColumn,
      };

      const result = createSingleMetric(
        transformedData,
        [numericColumn],
        [],
        [],
        {},
        mockAxisColumnMappings
      );

      // Verify the result structure still works
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('layer');
      expect(result.layer).toHaveLength(1);
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
      expect(result.layer).toHaveLength(3); // sparkLineLayer + main layer + title layer

      // Verify the sparkLineLayer (first layer)
      expect(result.layer[0]).toHaveProperty('mark.type', 'area');
      expect(result.layer[0]).toHaveProperty('mark.opacity', 0.3);
      expect(result.layer[0]).toHaveProperty('mark.line.size', 1);
      expect(result.layer[0]).toHaveProperty('encoding.x.field', 'date-field');
      expect(result.layer[0]).toHaveProperty('encoding.x.type', 'temporal');
      expect(result.layer[0]).toHaveProperty('encoding.y.field', 'field-1');
      expect(result.layer[0]).toHaveProperty('encoding.y.type', 'quantitative');
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
      expect(result.layer).toHaveLength(2); // Only main layer + title layer, no sparkLineLayer
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
      expect(result.layer).toHaveLength(3);
      expect(result.layer[0]).toHaveProperty('mark.type', 'area'); // First layer is sparkLineLayer
      expect(result.layer[1]).toHaveProperty('mark.type', 'text'); // Second layer is value text
      expect(result.layer[2]).toHaveProperty('mark.type', 'text'); // Third layer is title text

      // Verify the data is passed correctly to sparkLineLayer
      expect(result.layer[0].data.values).toEqual(timeSeriesData);
    });
  });
});
