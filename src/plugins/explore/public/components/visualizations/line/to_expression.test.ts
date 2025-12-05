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
  createCategoryMultiLineChart,
} from './to_expression';
import {
  ThresholdMode,
  VisColumn,
  VisFieldType,
  Positions,
  TooltipOptions,
  AxisRole,
  AxisColumnMappings,
} from '../types';
import * as lineChartUtils from './line_chart_utils';
import * as thresholdUtils from '../style_panel/threshold/threshold_utils';
import * as utils from '../utils/utils'; // Import the utils module
import { defaultLineChartStyles } from './line_vis_config';

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
jest.mock('../style_panel/threshold/threshold_utils', () => ({
  getStrokeDash: jest.fn().mockReturnValue([5, 5]),
  createThresholdLayer: jest.fn().mockReturnValue(null),
}));

// Mock the utils module
jest.mock('../utils/utils', () => ({
  applyTimeRangeToEncoding: jest.fn().mockReturnValue(undefined),
  getTooltipFormat: jest.fn().mockReturnValue('%b %d, %Y %H:%M:%S'),
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
  const timeRange = { from: '2023-01-01', to: '2023-01-02' };
  const styleOptions = {
    ...defaultLineChartStyles,
    addLegend: true,
    legendPosition: Positions.RIGHT,
    thresholdLines: [],
    thresholdOptions: {
      baseColor: '#00BD6B',
      thresholds: [{ value: 100, color: 'red' }],
      thresholdStyle: ThresholdMode.Solid,
    },
    tooltipOptions: {
      mode: 'all' as TooltipOptions['mode'],
    },
    addTimeMarker: false,
    titleOptions: {
      show: true,
      titleName: '',
    },
    showFullTimeRange: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSimpleLineChart', () => {
    it('should create a simple line chart with one metric and one date', () => {
      const mockThresholdLayer = { mark: { type: 'rule' } };
      const mockTimeMarkerLayer = { mark: { type: 'rule' } };
      (thresholdUtils.createThresholdLayer as jest.Mock).mockReturnValueOnce(mockThresholdLayer);
      (lineChartUtils.createTimeMarkerLayer as jest.Mock).mockReturnValueOnce(mockTimeMarkerLayer);
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
      };
      const modifiedStyles = { ...styleOptions, addTimeMarker: true };
      const result = createSimpleLineChart(
        transformedData,
        [numericColumn1],
        [dateColumn],
        modifiedStyles,
        mockAxisColumnMappings
      );
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('title', 'value1 Over Time');
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('layer');
      expect(result.layer).toHaveLength(6); // Main layer + 3 hover state layers + threshold + time marker

      // Verify the main layer
      const mainLayer = result.layer[0];
      expect(mainLayer).toHaveProperty('mark');
      expect(mainLayer).toHaveProperty('encoding.x.field', 'field-0');
      expect(mainLayer).toHaveProperty('encoding.y.field', 'field-1');

      // Verify utility functions were called
      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(modifiedStyles, 'line');
      expect(lineChartUtils.applyAxisStyling).toHaveBeenCalledTimes(2);
      expect(thresholdUtils.createThresholdLayer).toHaveBeenCalledWith(
        styleOptions.thresholdOptions
      );
      expect(lineChartUtils.createTimeMarkerLayer).toHaveBeenCalledWith(modifiedStyles);

      // select time range params
      expect(result.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'applyTimeFilter' })])
      );
      expect(mainLayer.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'timeRangeBrush' })])
      );
    });

    it('should include domain layer when showFullTimeRange is true', () => {
      const mockThresholdLayer = { mark: { type: 'rule' } };
      const mockTimeMarkerLayer = { mark: { type: 'rule' } };
      const mockDomainLayer = { mark: { type: 'rule' } };
      (thresholdUtils.createThresholdLayer as jest.Mock).mockReturnValueOnce(mockThresholdLayer);
      (lineChartUtils.createTimeMarkerLayer as jest.Mock).mockReturnValueOnce(mockTimeMarkerLayer);
      (utils.applyTimeRangeToEncoding as jest.Mock).mockReturnValueOnce(mockDomainLayer);
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
      };
      const modifiedStyles = { ...styleOptions, addTimeMarker: true, showFullTimeRange: true };
      const result = createSimpleLineChart(
        transformedData,
        [numericColumn1],
        [dateColumn],
        modifiedStyles,
        mockAxisColumnMappings,
        timeRange
      );
      expect(result.layer).toHaveLength(6); // Main + 3 hover state layers + threshold + time marker
      expect(utils.applyTimeRangeToEncoding).toHaveBeenCalledWith(
        expect.any(Object),
        mockAxisColumnMappings,
        timeRange
      );
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
      };
      const noTitleStyles = {
        ...styleOptions,
        titleOptions: { show: false, titleName: '' },
      };
      const noTitleResult = createSimpleLineChart(
        transformedData,
        [numericColumn1],
        [dateColumn],
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      const defaultTitleStyles = {
        ...styleOptions,
        titleOptions: { show: true, titleName: '' },
      };
      const defaultTitleResult = createSimpleLineChart(
        transformedData,
        [numericColumn1],
        [dateColumn],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('value1 Over Time');

      const customTitleStyles = {
        ...styleOptions,
        titleOptions: { show: true, titleName: 'Custom Simple Line Chart' },
      };
      const customTitleResult = createSimpleLineChart(
        transformedData,
        [numericColumn1],
        [dateColumn],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Simple Line Chart');
    });

    it('should fallback to default tooltip format when dateField is missing', () => {
      const incompleteAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: { ...dateColumn, column: undefined as any },
      };
      const result = createSimpleLineChart(
        transformedData,
        [numericColumn1],
        [dateColumn],
        styleOptions,
        incompleteAxisColumnMappings
      );
      const tooltip = result.layer[0].encoding.tooltip;
      expect(tooltip[0].format).toBe('%b %d, %Y %H:%M:%S');
    });
  });

  describe('createLineBarChart', () => {
    it('should create a combined line and bar chart with two metrics and one date', () => {
      const mockThresholdLayer = { mark: { type: 'rule' } };
      const mockTimeMarkerLayer = { mark: { type: 'rule' } };
      (thresholdUtils.createThresholdLayer as jest.Mock).mockReturnValueOnce(mockThresholdLayer);
      (lineChartUtils.createTimeMarkerLayer as jest.Mock).mockReturnValueOnce(mockTimeMarkerLayer);
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
        [AxisRole.Y_SECOND]: numericColumn2,
      };
      const modifiedStyles = { ...styleOptions, addTimeMarker: true };
      const result = createLineBarChart(
        transformedData,
        [numericColumn1, numericColumn2],
        [dateColumn],
        modifiedStyles,
        mockAxisColumnMappings
      );
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('title', 'value1 (Bar) and value2 (Line) Over Time');
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('layer');
      expect(result.layer).toHaveLength(4); // Bar layer (with threshold) + line layer + 1 hover state layers + time marker

      // Verify the bar layer
      const barLayer = result.layer[0].layer[0];
      expect(barLayer).toHaveProperty('encoding.x.field', 'field-0');
      expect(barLayer).toHaveProperty('encoding.y.field', 'field-1');
      expect(barLayer).toHaveProperty('encoding.color.datum', 'value1');

      // Verify the line layer
      expect(result.layer[1]).toHaveProperty('encoding.x.field', 'field-0');
      expect(result.layer[1]).toHaveProperty('encoding.y.field', 'field-2');
      expect(result.layer[1]).toHaveProperty('encoding.color.datum', 'value2');
      expect(result).toHaveProperty('resolve.scale.y', 'independent');
      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(modifiedStyles, 'bar');
      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(modifiedStyles, 'line');
      expect(lineChartUtils.applyAxisStyling).toHaveBeenCalledTimes(3);

      // select time range params
      expect(result.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'applyTimeFilter' })])
      );
      expect(barLayer.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'timeRangeBrush' })])
      );
    });

    it('should include domain layer when showFullTimeRange is true', () => {
      const mockThresholdLayer = { mark: { type: 'rule' } };
      const mockTimeMarkerLayer = { mark: { type: 'rule' } };
      const mockDomainLayer = { mark: { type: 'rule' } };
      (thresholdUtils.createThresholdLayer as jest.Mock).mockReturnValueOnce(mockThresholdLayer);
      (lineChartUtils.createTimeMarkerLayer as jest.Mock).mockReturnValueOnce(mockTimeMarkerLayer);
      (utils.applyTimeRangeToEncoding as jest.Mock).mockReturnValueOnce(mockDomainLayer);
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
        [AxisRole.Y_SECOND]: numericColumn2,
      };
      const modifiedStyles = { ...styleOptions, addTimeMarker: true, showFullTimeRange: true };
      const result = createLineBarChart(
        transformedData,
        [numericColumn1, numericColumn2],
        [dateColumn],
        modifiedStyles,
        mockAxisColumnMappings,
        timeRange
      );
      expect(result.layer).toHaveLength(4); // Bar layer (with threshold) + line layer + 1 hover state layers + time marker
      expect(utils.applyTimeRangeToEncoding).toHaveBeenCalledWith(
        expect.any(Object),
        mockAxisColumnMappings,
        timeRange
      );
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
        [AxisRole.Y_SECOND]: numericColumn2,
      };
      const noTitleStyles = {
        ...styleOptions,
        titleOptions: { show: false, titleName: '' },
      };
      const noTitleResult = createLineBarChart(
        transformedData,
        [numericColumn1, numericColumn2],
        [dateColumn],
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      const defaultTitleStyles = {
        ...styleOptions,
        titleOptions: { show: true, titleName: '' },
      };
      const defaultTitleResult = createLineBarChart(
        transformedData,
        [numericColumn1, numericColumn2],
        [dateColumn],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('value1 (Bar) and value2 (Line) Over Time');

      const customTitleStyles = {
        ...styleOptions,
        titleOptions: { show: true, titleName: 'Custom Line-Bar Chart' },
      };
      const customTitleResult = createLineBarChart(
        transformedData,
        [numericColumn1, numericColumn2],
        [dateColumn],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Line-Bar Chart');
    });

    it('should fallback to default tooltip format when dateField is missing', () => {
      const incompleteAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.Y_SECOND]: numericColumn2,
        [AxisRole.X]: { ...dateColumn, column: undefined as any },
      };
      const result = createLineBarChart(
        transformedData,
        [numericColumn1, numericColumn2],
        [dateColumn],
        styleOptions,
        incompleteAxisColumnMappings
      );
      const barTooltip = result.layer[0].layer[0].encoding.tooltip;
      const lineTooltip = result.layer[1].encoding.tooltip;
      expect(barTooltip[0].format).toBe('%b %d, %Y %H:%M:%S');
      expect(lineTooltip[0].format).toBe('%b %d, %Y %H:%M:%S');
    });
  });

  describe('createMultiLineChart', () => {
    it('should create a multi-line chart with one metric, one date, and one categorical column', () => {
      const mockThresholdLayer = { mark: { type: 'rule' } };
      const mockTimeMarkerLayer = { mark: { type: 'rule' } };
      (thresholdUtils.createThresholdLayer as jest.Mock).mockReturnValueOnce(mockThresholdLayer);
      (lineChartUtils.createTimeMarkerLayer as jest.Mock).mockReturnValueOnce(mockTimeMarkerLayer);
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
        [AxisRole.COLOR]: categoricalColumn1,
      };
      const modifiedStyles = { ...styleOptions, addTimeMarker: true };
      const result = createMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1],
        [dateColumn],
        modifiedStyles,
        mockAxisColumnMappings
      );
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('title', 'value1 Over Time by category1');
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('layer');
      expect(result.layer).toHaveLength(6); // Main layer + 3 hover state layers + threshold + time marker

      // Verify the main layer
      const mainLayer = result.layer[0];
      expect(mainLayer).toHaveProperty('encoding.x.field', 'field-0');
      expect(mainLayer).toHaveProperty('encoding.y.field', 'field-1');
      expect(mainLayer).toHaveProperty('encoding.color.field', 'field-2');

      // Verify utility functions were called
      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(modifiedStyles, 'line');
      expect(lineChartUtils.applyAxisStyling).toHaveBeenCalledTimes(2);

      // select time range params
      expect(result.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'applyTimeFilter' })])
      );
      expect(mainLayer.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'timeRangeBrush' })])
      );
    });

    it('should include domain layer when showFullTimeRange is true', () => {
      const mockThresholdLayer = { mark: { type: 'rule' } };
      const mockTimeMarkerLayer = { mark: { type: 'rule' } };
      const mockDomainLayer = { mark: { type: 'rule' } };
      (thresholdUtils.createThresholdLayer as jest.Mock).mockReturnValueOnce(mockThresholdLayer);
      (lineChartUtils.createTimeMarkerLayer as jest.Mock).mockReturnValueOnce(mockTimeMarkerLayer);
      (utils.applyTimeRangeToEncoding as jest.Mock).mockReturnValueOnce(mockDomainLayer);
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
        [AxisRole.COLOR]: categoricalColumn1,
      };
      const modifiedStyles = { ...styleOptions, addTimeMarker: true, showFullTimeRange: true };
      const result = createMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1],
        [dateColumn],
        modifiedStyles,
        mockAxisColumnMappings,
        timeRange
      );
      expect(result.layer).toHaveLength(6); // Main + 3 hover state layers + threshold + time marker
      expect(utils.applyTimeRangeToEncoding).toHaveBeenCalledWith(
        expect.any(Object),
        mockAxisColumnMappings,
        timeRange
      );
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
        [AxisRole.COLOR]: categoricalColumn1,
      };
      const noTitleStyles = {
        ...styleOptions,
        titleOptions: { show: false, titleName: '' },
      };
      const noTitleResult = createMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1],
        [dateColumn],
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      const defaultTitleStyles = {
        ...styleOptions,
        titleOptions: { show: true, titleName: '' },
      };
      const defaultTitleResult = createMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1],
        [dateColumn],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('value1 Over Time by category1');

      const customTitleStyles = {
        ...styleOptions,
        titleOptions: { show: true, titleName: 'Custom Multi-Line Chart' },
      };
      const customTitleResult = createMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1],
        [dateColumn],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Multi-Line Chart');
    });

    it('should fallback to default tooltip format when dateField is missing', () => {
      const incompleteAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.COLOR]: categoricalColumn1,
        [AxisRole.X]: { ...dateColumn, column: undefined as any },
      };
      const result = createMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1],
        [dateColumn],
        styleOptions,
        incompleteAxisColumnMappings
      );
      const tooltip = result.layer[0].encoding.tooltip;
      expect(tooltip[0].format).toBe('%b %d, %Y %H:%M:%S');
    });
  });

  describe('createFacetedMultiLineChart', () => {
    it('should create a faceted multi-line chart with one metric, one date, and two categorical columns', () => {
      const mockThresholdLayer = {
        layer: [{ mark: { type: 'rule' }, encoding: { y: { datum: 100 } } }],
      };
      const mockTimeMarkerLayer = { mark: { type: 'rule' } };
      (thresholdUtils.createThresholdLayer as jest.Mock).mockReturnValueOnce(mockThresholdLayer);
      (lineChartUtils.createTimeMarkerLayer as jest.Mock).mockReturnValueOnce(mockTimeMarkerLayer);
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
        [AxisRole.COLOR]: categoricalColumn1,
        [AxisRole.FACET]: categoricalColumn2,
      };
      const modifiedStyles = {
        ...styleOptions,
        addTimeMarker: true,
        thresholdOptions: {
          ...styleOptions.thresholdOptions,
          thresholdStyle: ThresholdMode.Solid,
        },
      };
      const result = createFacetedMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1, categoricalColumn2],
        [dateColumn],
        modifiedStyles,
        mockAxisColumnMappings
      );
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty(
        'title',
        'value1 Over Time by category1 (Faceted by category2)'
      );
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('facet.field', 'field-3');
      expect(result).toHaveProperty('spec.layer');
      expect(result.spec.layer).toHaveLength(6); // Main layer + 3 hover state layers + threshold + time marker

      // Verify the main layer
      const mainLayer = result.spec.layer[0];
      expect(mainLayer).toHaveProperty('encoding.x.field', 'field-0');
      expect(mainLayer).toHaveProperty('encoding.y.field', 'field-1');
      expect(mainLayer).toHaveProperty('encoding.color.field', 'field-2');

      // Verify the threshold layer
      expect(result.spec.layer[4]).toHaveProperty('mark.type', 'rule');
      expect(result.spec.layer[4]).toHaveProperty('encoding.y.datum', 100);

      // Verify the time marker layer
      expect(result.spec.layer[5]).toHaveProperty('mark.type', 'rule');
      expect(result.spec.layer[5]).toHaveProperty('encoding.x.datum');

      // Verify utility functions were called
      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(modifiedStyles, 'line');
      expect(lineChartUtils.applyAxisStyling).toHaveBeenCalledTimes(2);

      // select time range params
      expect(result.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'applyTimeFilter' })])
      );
      expect(mainLayer.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'timeRangeBrush' })])
      );
    });

    it('should include domain layer when showFullTimeRange is true', () => {
      const mockThresholdLayer = {
        layer: [{ mark: { type: 'rule' }, encoding: { y: { datum: 100 } } }],
      };
      const mockTimeMarkerLayer = { mark: { type: 'rule' } };
      const mockDomainLayer = { mark: { type: 'rule' } };
      (thresholdUtils.createThresholdLayer as jest.Mock).mockReturnValueOnce(mockThresholdLayer);
      (lineChartUtils.createTimeMarkerLayer as jest.Mock).mockReturnValueOnce(mockTimeMarkerLayer);
      (utils.applyTimeRangeToEncoding as jest.Mock).mockReturnValueOnce(mockDomainLayer);
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
        [AxisRole.COLOR]: categoricalColumn1,
        [AxisRole.FACET]: categoricalColumn2,
      };
      const modifiedStyles = {
        ...styleOptions,
        addTimeMarker: true,
        showFullTimeRange: true,
        thresholdOptions: {
          ...styleOptions.thresholdOptions,
          thresholdStyle: ThresholdMode.Solid,
        },
      };
      const result = createFacetedMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1, categoricalColumn2],
        [dateColumn],
        modifiedStyles,
        mockAxisColumnMappings,
        timeRange
      );
      expect(result.spec.layer).toHaveLength(6); // Main + 3 hover state layers + threshold + time marker
      expect(utils.applyTimeRangeToEncoding).toHaveBeenCalledWith(
        expect.any(Object),
        mockAxisColumnMappings,
        timeRange
      );
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: dateColumn,
        [AxisRole.COLOR]: categoricalColumn1,
        [AxisRole.FACET]: categoricalColumn2,
      };
      const noTitleStyles = {
        ...styleOptions,
        titleOptions: { show: false, titleName: '' },
      };
      const noTitleResult = createFacetedMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1, categoricalColumn2],
        [dateColumn],
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      const defaultTitleStyles = {
        ...styleOptions,
        titleOptions: { show: true, titleName: '' },
      };
      const defaultTitleResult = createFacetedMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1, categoricalColumn2],
        [dateColumn],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('value1 Over Time by category1 (Faceted by category2)');

      const customTitleStyles = {
        ...styleOptions,
        titleOptions: { show: true, titleName: 'Custom Faceted Line Chart' },
      };
      const customTitleResult = createFacetedMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1, categoricalColumn2],
        [dateColumn],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Faceted Line Chart');
    });

    it('should fallback to default tooltip format when dateField is missing', () => {
      const incompleteAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.COLOR]: categoricalColumn1,
        [AxisRole.FACET]: categoricalColumn2,
        [AxisRole.X]: { ...dateColumn, column: undefined as any },
      };
      const result = createFacetedMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1, categoricalColumn2],
        [dateColumn],
        styleOptions,
        incompleteAxisColumnMappings
      );
      const tooltip = result.spec.layer[0].encoding.tooltip;
      expect(tooltip[0].format).toBe('%b %d, %Y %H:%M:%S');
    });
  });

  describe('createCategoryLineChart', () => {
    it('should create a category-based line chart with one metric and one categorical column', () => {
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
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('title', 'value1 by category1');
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('layer');
      expect(result.layer).toHaveLength(4); // Main layer + threshold + hover layers

      // Verify the main layer
      const mainLayer = result.layer[0];
      expect(mainLayer).toHaveProperty('mark');
      expect(mainLayer).toHaveProperty('encoding.x.field', 'field-2');
      expect(mainLayer).toHaveProperty('encoding.x.type', 'nominal');
      expect(mainLayer).toHaveProperty('encoding.y.field', 'field-1');
      expect(mainLayer).toHaveProperty('encoding.y.type', 'quantitative');

      // Verify utility functions were called
      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(styleOptions, 'line');
      expect(lineChartUtils.applyAxisStyling).toHaveBeenCalledTimes(2);
      expect(thresholdUtils.createThresholdLayer).toHaveBeenCalledWith(
        styleOptions.thresholdOptions
      );

      // select time range params
      expect(result.params).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'applyTimeFilter' })])
      );
      expect(mainLayer.params).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'timeRangeBrush' })])
      );
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: categoricalColumn1,
      };
      const noTitleStyles = {
        ...styleOptions,
        titleOptions: { show: false, titleName: '' },
      };
      const noTitleResult = createCategoryLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1],
        [],
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      const defaultTitleStyles = {
        ...styleOptions,
        titleOptions: { show: true, titleName: '' },
      };
      const defaultTitleResult = createCategoryLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1],
        [],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('value1 by category1');

      const customTitleStyles = {
        ...styleOptions,
        titleOptions: { show: true, titleName: 'Custom Category Line Chart' },
      };
      const customTitleResult = createCategoryLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1],
        [],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Category Line Chart');
    });

    it('should throw an error when required columns are missing', () => {
      expect(() => {
        createCategoryLineChart(transformedData, [], [categoricalColumn1], [], styleOptions);
      }).toThrow(
        'Category line chart requires at least one numerical column and one categorical column'
      );
      expect(() => {
        createCategoryLineChart(transformedData, [numericColumn1], [], [], styleOptions);
      }).toThrow(
        'Category line chart requires at least one numerical column and one categorical column'
      );
    });
  });

  describe('createCategoryMultiLineChart', () => {
    it('should create a category-based multi-line chart with one metric and two categorical columns', () => {
      const mockThresholdLayer = { mark: { type: 'rule' } };
      (thresholdUtils.createThresholdLayer as jest.Mock).mockReturnValueOnce(mockThresholdLayer);
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: categoricalColumn1,
        [AxisRole.COLOR]: categoricalColumn2,
      };
      const result = createCategoryMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1, categoricalColumn2],
        [],
        styleOptions,
        mockAxisColumnMappings
      );
      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('title', 'value1 by category1 and category2');
      expect(result).toHaveProperty('data.values', transformedData);
      expect(result).toHaveProperty('layer');
      expect(result.layer).toHaveLength(5);

      // Verify the main layer
      const mainLayer = result.layer[0];
      expect(mainLayer).toHaveProperty('encoding.x.field', 'field-2');
      expect(mainLayer).toHaveProperty('encoding.x.type', 'nominal');
      expect(mainLayer).toHaveProperty('encoding.y.field', 'field-1');
      expect(mainLayer).toHaveProperty('encoding.y.type', 'quantitative');
      expect(mainLayer).toHaveProperty('encoding.color.field', 'field-3');
      expect(mainLayer).toHaveProperty('encoding.color.type', 'nominal');

      expect(lineChartUtils.buildMarkConfig).toHaveBeenCalledWith(styleOptions, 'line');
      expect(lineChartUtils.applyAxisStyling).toHaveBeenCalledTimes(2);
      expect(thresholdUtils.createThresholdLayer).toHaveBeenCalledWith(
        styleOptions.thresholdOptions
      );
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: numericColumn1,
        [AxisRole.X]: categoricalColumn1,
        [AxisRole.COLOR]: categoricalColumn2,
      };
      const noTitleStyles = {
        ...styleOptions,
        titleOptions: { show: false, titleName: '' },
      };
      const noTitleResult = createCategoryMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1, categoricalColumn2],
        [],
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      const customTitleStyles = {
        ...styleOptions,
        titleOptions: { show: true, titleName: 'Custom Category Multi-Line Chart' },
      };
      const customTitleResult = createCategoryMultiLineChart(
        transformedData,
        [numericColumn1],
        [categoricalColumn1, categoricalColumn2],
        [],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Category Multi-Line Chart');
    });
  });
});
