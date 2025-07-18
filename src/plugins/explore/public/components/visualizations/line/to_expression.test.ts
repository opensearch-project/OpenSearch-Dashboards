/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSimpleLineChart,
  createLineBarChart,
  createMultiLineChart,
  createFacetedMultiLineChart,
  createCategoryLineChart,
} from './to_expression';
import {
  ThresholdLineStyle,
  VisColumn,
  VisFieldType,
  Positions,
  TooltipOptions,
  AxisRole,
  AxisColumnMappings,
} from '../types';
import * as lineChartUtils from './line_chart_utils';
import * as thresholdUtils from '../style_panel/threshold/utils';

// Mock the line chart utils
jest.mock('./line_chart_utils', () => ({
  buildMarkConfig: jest.fn().mockReturnValue({ type: 'line', tooltip: true }),
  createTimeMarkerLayer: jest.fn().mockReturnValue(null),
  applyAxisStyling: jest.fn().mockReturnValue({ title: 'Mocked Axis' }),
  ValueAxisPosition: {
    Left: 'left',
    Right: 'right',
  },
}));

// Mock the threshold utils
jest.mock('../style_panel/threshold/utils', () => ({
  getStrokeDash: jest.fn().mockReturnValue([5, 5]),
  createThresholdLayer: jest.fn().mockReturnValue(null),
}));

describe('to_expression', () => {
  // Sample data for testing
  const transformedData = [
    { 'field-0': '2023-01-01', 'field-1': 100, 'field-2': 'Category A', 'field-3': 'Group 1' },
    { 'field-0': '2023-01-02', 'field-1': 200, 'field-2': 'Category B', 'field-3': 'Group 2' },
  ];

  const dateColumn: VisColumn = {
    id: 0,
    name: 'date',
    schema: VisFieldType.Date,
    column: 'field-0',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const numericColumn1: VisColumn = {
    id: 1,
    name: 'value1',
    schema: VisFieldType.Numerical,
    column: 'field-1',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const numericColumn2: VisColumn = {
    id: 2,
    name: 'value2',
    schema: VisFieldType.Numerical,
    column: 'field-2',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const categoricalColumn1: VisColumn = {
    id: 3,
    name: 'category1',
    schema: VisFieldType.Categorical,
    column: 'field-2',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const categoricalColumn2: VisColumn = {
    id: 4,
    name: 'category2',
    schema: VisFieldType.Categorical,
    column: 'field-3',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const styleOptions = {
    addLegend: true,
    legendPosition: Positions.RIGHT,
    thresholdLines: [
      {
        id: '1',
        show: false,
        value: 100,
        color: 'red',
        width: 1,
        style: ThresholdLineStyle.Dashed,
        name: '',
      },
    ],
    tooltipOptions: {
      mode: 'all' as TooltipOptions['mode'],
    },
    addTimeMarker: false,
    titleOptions: {
      show: true,
      titleName: '',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSimpleLineChart', () => {
    it('should create a simple line chart with one metric and one date', () => {
      // Enable threshold and time marker for this test
      const mockThresholdLayer = { mark: { type: 'rule' } };
      const mockTimeMarkerLayer = { mark: { type: 'rule' } };
      (thresholdUtils.createThresholdLayer as jest.Mock).mockReturnValueOnce(mockThresholdLayer);
      (lineChartUtils.createTimeMarkerLayer as jest.Mock).mockReturnValueOnce(mockTimeMarkerLayer);

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
      };

      const result = createSimpleLineChart(
        transformedData,
        [numericColumn1],
        [dateColumn],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify the result structure
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('title', 'value1 Over Time');
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('layer');
      expect(result.layer).toHaveLength(3); // Main layer + threshold + time marker

      // Verify the main layer
      expect(result.layer[0]).toHaveProperty('mark');
      expect(result.layer[0]).toHaveProperty('encoding.x.field', 'field-0');
      expect(result.layer[0]).toHaveProperty('encoding.y.field', 'field-1');

      // Verify utility functions were called
      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(styleOptions, 'line');
      expect(lineChartUtils.applyAxisStyling).toHaveBeenCalledTimes(2);
      expect(thresholdUtils.createThresholdLayer).toHaveBeenCalledWith(
        styleOptions.thresholdLines,
        styleOptions.tooltipOptions?.mode
      );
      expect(lineChartUtils.createTimeMarkerLayer).toHaveBeenCalledWith(styleOptions);
    });
  });

  describe('createLineBarChart', () => {
    it('should create a combined line and bar chart with two metrics and one date', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
        [AxisRole.Y_SECOND]: numericColumn2,
      };

      const result = createLineBarChart(
        transformedData,
        [numericColumn1, numericColumn2],
        [dateColumn],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify the result structure
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('title', 'value1 (Bar) and value2 (Line) Over Time');
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('layer');
      expect(result.layer).toHaveLength(2); // Bar layer + line layer (no threshold or time marker in this test)

      // Verify the bar layer
      expect(result.layer[0]).toHaveProperty('encoding.x.field', 'field-0');
      expect(result.layer[0]).toHaveProperty('encoding.y.field', 'field-1');
      expect(result.layer[0]).toHaveProperty('encoding.color.datum', 'value1');

      // Verify the line layer
      expect(result.layer[1]).toHaveProperty('encoding.x.field', 'field-0');
      expect(result.layer[1]).toHaveProperty('encoding.y.field', 'field-2');
      expect(result.layer[1]).toHaveProperty('encoding.color.datum', 'value2');

      // Verify the scales are resolved independently
      expect(result).toHaveProperty('resolve.scale.y', 'independent');

      // Verify utility functions were called
      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(styleOptions, 'bar');
      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(styleOptions, 'line');
      expect(lineChartUtils.applyAxisStyling).toHaveBeenCalledTimes(3);
    });
  });

  describe('createMultiLineChart', () => {
    it('should create a multi-line chart with one metric, one date, and one categorical column', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
        [AxisRole.COLOR]: categoricalColumn1,
      };

      const result = createMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1],
        [dateColumn],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify the result structure
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('title', 'value1 Over Time by category1');
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('layer');
      expect(result.layer).toHaveLength(1); // Main layer only (no threshold or time marker in this test)

      // Verify the main layer
      expect(result.layer[0]).toHaveProperty('encoding.x.field', 'field-0');
      expect(result.layer[0]).toHaveProperty('encoding.y.field', 'field-1');
      expect(result.layer[0]).toHaveProperty('encoding.color.field', 'field-2');

      // Verify utility functions were called
      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(styleOptions, 'line');
      expect(lineChartUtils.applyAxisStyling).toHaveBeenCalledTimes(2);
    });
  });

  describe('createFacetedMultiLineChart', () => {
    it('should create a faceted multi-line chart with one metric, one date, and two categorical columns', () => {
      // Enable threshold and time marker for this test
      styleOptions.thresholdLines[0].show = true;
      styleOptions.addTimeMarker = true;

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
        [AxisRole.COLOR]: categoricalColumn1,
        [AxisRole.FACET]: categoricalColumn2,
      };

      const result = createFacetedMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1, categoricalColumn2],
        [dateColumn],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify the result structure
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty(
        'title',
        'value1 Over Time by category1 (Faceted by category2)'
      );
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('facet.field', 'field-3');
      expect(result).toHaveProperty('spec.layer');
      expect(result.spec.layer).toHaveLength(3); // Main layer + threshold + time marker

      // Verify the main layer
      expect(result.spec.layer[0]).toHaveProperty('encoding.x.field', 'field-0');
      expect(result.spec.layer[0]).toHaveProperty('encoding.y.field', 'field-1');
      expect(result.spec.layer[0]).toHaveProperty('encoding.color.field', 'field-2');

      // Verify the threshold layer
      expect(result.spec.layer[1]).toHaveProperty('mark.type', 'rule');
      expect(result.spec.layer[1]).toHaveProperty('encoding.y.datum', 100);

      // Verify the time marker layer
      expect(result.spec.layer[2]).toHaveProperty('mark.type', 'rule');
      expect(result.spec.layer[2]).toHaveProperty('encoding.x.datum');

      // Verify utility functions were called
      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(styleOptions, 'line');
      expect(lineChartUtils.applyAxisStyling).toHaveBeenCalledTimes(2);
      expect(thresholdUtils.getStrokeDash).toHaveBeenCalled();
    });
  });

  describe('createCategoryLineChart', () => {
    it('should create a category-based line chart with one metric and one categorical column', () => {
      // Enable threshold for this test
      const mockThresholdLayer = { mark: { type: 'rule' } };
      (thresholdUtils.createThresholdLayer as jest.Mock).mockReturnValueOnce(mockThresholdLayer);

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: categoricalColumn1,
      };

      const result = createCategoryLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1],
        [],
        styleOptions,
        mockAxisColumnMappings
      );

      // Verify the result structure
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('title', 'value1 by category1');
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('layer');
      expect(result.layer).toHaveLength(2); // Main layer + threshold

      // Verify the main layer
      expect(result.layer[0]).toHaveProperty('mark');
      expect(result.layer[0]).toHaveProperty('encoding.x.field', 'field-2');
      expect(result.layer[0]).toHaveProperty('encoding.x.type', 'nominal');
      expect(result.layer[0]).toHaveProperty('encoding.y.field', 'field-1');
      expect(result.layer[0]).toHaveProperty('encoding.y.type', 'quantitative');

      // Verify utility functions were called
      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(styleOptions, 'line');
      expect(lineChartUtils.applyAxisStyling).toHaveBeenCalledTimes(2);
      expect(thresholdUtils.createThresholdLayer).toHaveBeenCalledWith(
        styleOptions.thresholdLines,
        styleOptions.tooltipOptions?.mode
      );
    });

    it('should throw an error when required columns are missing', () => {
      // Test with missing numerical column
      expect(() => {
        createCategoryLineChart(transformedData, [], [categoricalColumn1], [], styleOptions);
      }).toThrow(
        'Category line chart requires at least one numerical column and one categorical column'
      );

      // Test with missing categorical column
      expect(() => {
        createCategoryLineChart(transformedData, [numericColumn1], [], [], styleOptions);
      }).toThrow(
        'Category line chart requires at least one numerical column and one categorical column'
      );
    });
  });
});
