/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSingleMetric } from './to_expression';
import { VisColumn, VisFieldType, ColorSchemas, AxisRole, AxisColumnMappings } from '../types';
import * as utils from '../utils/utils';

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

  const defaultStyleOptions = {
    showTitle: true,
    title: 'Test Metric',
    fontSize: 60,
    useColor: false,
    colorSchema: ColorSchemas.BLUES,
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
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('layer');
      expect(result.layer).toHaveLength(2); // Main layer + title layer

      // Verify the main layer (text mark)
      expect(result.layer[0]).toHaveProperty('mark.type', 'text');
      expect(result.layer[0]).toHaveProperty('mark.fontSize', 60);
      expect(result.layer[0]).toHaveProperty('encoding.text.field', 'field-1');
      expect(result.layer[0]).toHaveProperty('encoding.text.type', 'quantitative');

      // Verify the title layer
      expect(result.layer[1]).toHaveProperty('mark.type', 'text');
      expect(result.layer[1]).toHaveProperty('encoding.text.value', 'Test Metric');
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
      expect(result.layer[1]).toHaveProperty('encoding.text.value', 'value1');
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
        'datum["field-1"] >= 0 && datum["field-1"] < 100'
      );
      expect(result.layer[0].encoding.color.condition[1]).toHaveProperty(
        'test',
        'datum["field-1"] >= 100 && datum["field-1"] < 200'
      );
      expect(result.layer[0].encoding.color.condition[2]).toHaveProperty(
        'test',
        'datum["field-1"] >= 200'
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
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('layer');
    });
  });
});
