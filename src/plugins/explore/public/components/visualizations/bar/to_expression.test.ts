/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createBarSpec,
  createStackedBarSpec,
  createTimeBarChart,
  createGroupedTimeBarChart,
  createFacetedTimeBarChart,
  createDoubleNumericalBarChart,
} from './to_expression';
import { defaultBarChartStyles, BarChartStyle } from './bar_vis_config';
import {
  VisColumn,
  VisFieldType,
  VEGASCHEMA,
  AxisRole,
  ThresholdMode,
  AggregationType,
} from '../types';
import * as Utils from '../utils/utils';

jest.mock('../utils/utils', () => {
  const actual = jest.requireActual('../utils/utils');
  return {
    ...actual,
    getChartRender: jest.fn().mockReturnValue('vega'),
    applyTimeRangeToEncoding: jest.fn(() => undefined),
  };
});

describe('bar to_expression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  // Create mock VisColumn objects
  const mockNumericalColumn: VisColumn = {
    id: 1,
    name: 'Count',
    column: 'count',
    schema: VisFieldType.Numerical,
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  const mockCategoricalColumn: VisColumn = {
    id: 2,
    name: 'Category',
    column: 'category',
    schema: VisFieldType.Categorical,
    validValuesCount: 100,
    uniqueValuesCount: 10,
  };

  const mockCategoricalColumn2: VisColumn = {
    id: 3,
    name: 'Category2',
    column: 'category2',
    schema: VisFieldType.Categorical,
    validValuesCount: 100,
    uniqueValuesCount: 10,
  };

  const mockDateColumn: VisColumn = {
    id: 4,
    name: 'Date',
    column: 'date',
    schema: VisFieldType.Date,
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  // Sample data for testing
  const mockData = [
    { count: 10, category: 'A', category2: 'X', date: '2023-01-01' },
    { count: 20, category: 'B', category2: 'Y', date: '2023-01-02' },
    { count: 30, category: 'C', category2: 'Z', date: '2023-01-03' },
  ];

  describe('createBarSpec', () => {
    test('creates a basic bar chart spec', () => {
      const spec = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        defaultBarChartStyles,
        {
          [AxisRole.X]: mockCategoricalColumn,
          [AxisRole.Y]: mockNumericalColumn,
        }
      );

      // Check basic structure
      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.data.values).toBe(mockData);
      expect(spec.layer).toHaveLength(1);

      // Check encoding
      const mainLayer = spec.layer[0];
      expect(mainLayer.mark.type).toBe('bar');
      expect(mainLayer.mark.tooltip).toBe(true);
      expect(mainLayer.encoding.x.field).toBe('category');
      expect(mainLayer.encoding.y.field).toBe('count');
    });

    test('handles different title display options', () => {
      const mockAxisColumnMappings = {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('Count by Category');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Bar Chart Title',
        },
      };

      const customTitleResult = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Bar Chart Title');
    });

    test('applies bar styling options', () => {
      const customStyles: BarChartStyle = {
        ...defaultBarChartStyles,
        barSizeMode: 'manual',
        barWidth: 0.5,
        barPadding: 0.2,
        showBarBorder: true,
        barBorderColor: '#FF0000',
        barBorderWidth: 2,
      };

      const mockAxisColumnMappings = {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };

      const spec = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        customStyles,
        mockAxisColumnMappings
      );

      // Check bar styling
      const mainLayer = spec.layer[0];
      expect(mainLayer.mark.size).toBe(10); // 0.5 * 20
      expect(mainLayer.mark.binSpacing).toBe(2); // 0.2 * 10
      expect(mainLayer.mark.stroke).toBe('#FF0000');
      expect(mainLayer.mark.strokeWidth).toBe(2);
    });

    test('does not apply size and spacing when barSizeMode is auto', () => {
      const customStyles: BarChartStyle = {
        ...defaultBarChartStyles,
        barSizeMode: 'auto',
        barWidth: 0.5,
        barPadding: 0.2,
        showBarBorder: true,
        barBorderColor: '#FF0000',
        barBorderWidth: 2,
      };

      const mockAxisColumnMappings = {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };

      const spec = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        customStyles,
        mockAxisColumnMappings
      );

      // Check bar styling - size and binSpacing should not be set
      const mainLayer = spec.layer[0];
      expect(mainLayer.mark.size).toBeUndefined();
      expect(mainLayer.mark.binSpacing).toBeUndefined();
      expect(mainLayer.mark.stroke).toBe('#FF0000');
      expect(mainLayer.mark.strokeWidth).toBe(2);
    });

    test('adds threshold line when enabled', () => {
      const customStyles = {
        ...defaultBarChartStyles,
        thresholdOptions: {
          baseColor: '#00BD6B',
          thresholds: [{ value: 15, color: '#00FF00' }],
          thresholdStyle: ThresholdMode.Solid,
        },
      };

      const mockAxisColumnMappings = {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };

      const spec = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        customStyles,
        mockAxisColumnMappings
      );

      // Check threshold line
      expect(spec.layer).toHaveLength(2);
      const thresholdLayer = spec.layer[1];
      expect(thresholdLayer.mark.type).toBe('rule');
      expect(thresholdLayer.mark.color).toBe('#00FF00');
      expect(thresholdLayer.mark.strokeWidth).toBe(1);
      expect(thresholdLayer.encoding.y.datum).toBe(15);
    });
  });

  describe('createStackedBarSpec', () => {
    test('creates a stacked bar chart spec', () => {
      const spec = createStackedBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [],
        defaultBarChartStyles,
        {
          [AxisRole.X]: mockCategoricalColumn,
          [AxisRole.Y]: mockNumericalColumn,
          [AxisRole.COLOR]: mockCategoricalColumn2,
        }
      );

      // Check basic structure
      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.data.values).toBe(mockData);

      const mainLayer = spec.layer[0];
      const encoding = mainLayer.encoding;
      // Check encoding
      expect(encoding.x.field).toBe('category');
      expect(encoding.y.field).toBe('count');
      expect(encoding.color.field).toBe('category2');

      // select time range params
      expect(spec.params).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'applyTimeFilter' })])
      );
      expect(mainLayer.params).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'timeRangeBrush' })])
      );
    });

    test('handles different title display options', () => {
      const mockAxisColumnMappings = {
        [AxisRole.X]: mockCategoricalColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn2,
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createStackedBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [],
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createStackedBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('Count by Category and Category2');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Stacked Bar Chart',
        },
      };

      const customTitleResult = createStackedBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Stacked Bar Chart');
    });

    test('adds threshold line when enabled', () => {
      const customStyles = {
        ...defaultBarChartStyles,
        thresholdOptions: {
          baseColor: '#00BD6B',
          thresholds: [{ value: 15, color: '#00FF00' }],
          thresholdStyle: ThresholdMode.Solid,
        },
      };

      const spec = createStackedBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [],
        customStyles,
        {
          [AxisRole.X]: mockCategoricalColumn,
          [AxisRole.Y]: mockNumericalColumn,
          [AxisRole.COLOR]: mockCategoricalColumn2,
        }
      );

      // Check threshold line
      expect(spec.layer).toBeDefined();
      expect(spec.layer).toHaveLength(2);
      const thresholdLayer = spec.layer[1];
      expect(thresholdLayer.mark.type).toBe('rule');
      expect(thresholdLayer.mark.color).toBe('#00FF00');
      expect(thresholdLayer.mark.strokeWidth).toBe(1);
      expect(thresholdLayer.encoding.y.datum).toBe(15);
    });
  });

  describe('createTimeBarChart', () => {
    test('creates a basic time bar chart spec', () => {
      const mockAxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };

      const spec = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        defaultBarChartStyles,
        mockAxisColumnMappings
      );

      // Check basic structure
      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.data.values).toBe(mockData);
      expect(spec.layer).toHaveLength(1);

      // Check encoding
      const mainLayer = spec.layer[0];
      expect(mainLayer.mark.type).toBe('bar');
      expect(mainLayer.mark.tooltip).toBe(true);
      expect(mainLayer.encoding.x.field).toBe('date');
      expect(mainLayer.encoding.x.type).toBe('temporal');
      expect(mainLayer.encoding.y.field).toBe('count');
      expect(mainLayer.encoding.y.type).toBe('quantitative');

      // select time range params
      expect(spec.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'applyTimeFilter' })])
      );
      expect(mainLayer.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'timeRangeBrush' })])
      );
    });

    test('handles different title display options', () => {
      const mockAxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('Count Over Time');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Time Bar Chart',
        },
      };

      const customTitleResult = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Time Bar Chart');
    });

    test('applies bar styling options', () => {
      const customStyles: BarChartStyle = {
        ...defaultBarChartStyles,
        barSizeMode: 'manual',
        barWidth: 0.5,
        barPadding: 0.2,
        showBarBorder: true,
        barBorderColor: '#FF0000',
        barBorderWidth: 2,
      };

      const mockAxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };

      const spec = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        customStyles,
        mockAxisColumnMappings
      );

      // Check bar styling
      const mainLayer = spec.layer[0];
      expect(mainLayer.mark.size).toBe(10); // 0.5 * 20
      expect(mainLayer.mark.binSpacing).toBe(2); // 0.2 * 10
      expect(mainLayer.mark.stroke).toBe('#FF0000');
      expect(mainLayer.mark.strokeWidth).toBe(2);
    });

    test('adds threshold line when enabled', () => {
      const customStyles = {
        ...defaultBarChartStyles,
        thresholdOptions: {
          baseColor: '#00BD6B',
          thresholds: [{ value: 15, color: '#00FF00' }],
          thresholdStyle: ThresholdMode.Solid,
        },
      };

      const mockAxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };

      const spec = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        customStyles,
        mockAxisColumnMappings
      );

      // Check threshold line
      expect(spec.layer).toHaveLength(2);
      const thresholdLayer = spec.layer[1];
      expect(thresholdLayer.mark.type).toBe('rule');
      expect(thresholdLayer.mark.color).toBe('#00FF00');
      expect(thresholdLayer.mark.strokeWidth).toBe(1);
      expect(thresholdLayer.encoding.y.datum).toBe(15);
    });

    test('uses xAxis as numericalAxis when xAxis is not temporal', () => {
      const mockAxisColumnMappings = {
        [AxisRole.X]: mockNumericalColumn,
        [AxisRole.Y]: mockDateColumn,
      };

      const customStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const spec = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        customStyles,
        mockAxisColumnMappings
      );

      // Check title uses xAxis as numericalAxis
      expect(spec.title).toBe('Count Over Time');
      expect(spec.layer[0].encoding.x.field).toBe('count');
      expect(spec.layer[0].encoding.x.type).toBe('quantitative');
      expect(spec.layer[0].encoding.y.field).toBe('date');
      expect(spec.layer[0].encoding.y.type).toBe('temporal');
    });

    test('adds domain layer when showFullTimeRange is true (createTimeBarChart)', () => {
      const styles: BarChartStyle = {
        ...defaultBarChartStyles,
        showFullTimeRange: true,
      };
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      };
      const timeRange = {
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-01-31T00:00:00.000Z',
      };

      // @ts-expect-error TS6133 TODO(ts-error): fixme
      const spec = createTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockDateColumn],
        styles,
        axisMappings,
        timeRange
      );

      expect(Utils.applyTimeRangeToEncoding).toHaveBeenCalledWith(
        expect.any(Object), // mainLayerEncoding
        axisMappings,
        timeRange,
        styles.switchAxes
      );
    });
  });

  describe('createGroupedTimeBarChart', () => {
    test('creates a grouped time bar chart spec', () => {
      const mockAxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
      };

      const spec = createGroupedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [mockDateColumn],
        defaultBarChartStyles,
        mockAxisColumnMappings
      );

      // Check basic structure
      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.data.values).toBe(mockData);

      const mainLayer = spec.layer[0];
      const encoding = mainLayer.encoding;
      // Check encoding
      expect(encoding.x.field).toBe('date');
      expect(encoding.x.type).toBe('temporal');
      expect(encoding.y.field).toBe('count');
      expect(encoding.y.type).toBe('quantitative');
      expect(encoding.color.field).toBe('category');

      // select time range params
      expect(spec.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'applyTimeFilter' })])
      );
      expect(mainLayer.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'timeRangeBrush' })])
      );
    });

    test('handles different title display options', () => {
      const mockAxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createGroupedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [mockDateColumn],
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createGroupedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [mockDateColumn],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('Count Over Time by Category');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Grouped Time Bar Chart',
        },
      };

      const customTitleResult = createGroupedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [mockDateColumn],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Grouped Time Bar Chart');
    });

    test('applies bar styling options', () => {
      const customStyles: BarChartStyle = {
        ...defaultBarChartStyles,
        barSizeMode: 'manual',
        barWidth: 0.5,
        barPadding: 0.2,
        showBarBorder: true,
        barBorderColor: '#FF0000',
        barBorderWidth: 2,
      };

      const mockAxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
      };

      const spec = createGroupedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [mockDateColumn],
        customStyles,
        mockAxisColumnMappings
      );

      const mark = spec.layer[0].mark;
      // Check bar styling
      expect(mark.size).toBe(10); // 0.5 * 20
      expect(mark.binSpacing).toBe(2); // 0.2 * 10
      expect(mark.stroke).toBe('#FF0000');
      expect(mark.strokeWidth).toBe(2);
    });

    test('adds threshold line when enabled', () => {
      const customStyles = {
        ...defaultBarChartStyles,
        thresholdOptions: {
          baseColor: '#00BD6B',
          thresholds: [{ value: 15, color: '#00FF00' }],
          thresholdStyle: ThresholdMode.Solid,
        },
      };

      const mockAxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
      };

      const spec = createGroupedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [mockDateColumn],
        customStyles,
        mockAxisColumnMappings
      );

      // Check threshold layer
      expect(spec.layer).toBeDefined();
      expect(spec.layer).toHaveLength(2);
      const thresholdLayer = spec.layer[1];
      expect(thresholdLayer.mark.type).toBe('rule');
      expect(thresholdLayer.mark.color).toBe('#00FF00');
      expect(thresholdLayer.mark.strokeWidth).toBe(1);
      expect(thresholdLayer.encoding.y.datum).toBe(15);
    });

    test('adds domain layer when showFullTimeRange is true (createGroupedTimeBarChart)', () => {
      const styles: BarChartStyle = {
        ...defaultBarChartStyles,
        showFullTimeRange: true,
      };
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
      };
      const timeRange = {
        from: '2024-02-01T00:00:00.000Z',
        to: '2024-02-29T00:00:00.000Z',
      };

      // @ts-expect-error TS6133 TODO(ts-error): fixme
      const spec = createGroupedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [mockDateColumn],
        styles,
        axisMappings,
        timeRange
      );

      expect(Utils.applyTimeRangeToEncoding).toHaveBeenCalledWith(
        expect.any(Object), // mainLayerEncoding
        axisMappings,
        timeRange,
        styles.switchAxes
      );
    });
  });

  describe('createFacetedTimeBarChart', () => {
    test('creates a faceted time bar chart spec', () => {
      const mockAxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
        [AxisRole.FACET]: mockCategoricalColumn2,
      };

      const spec = createFacetedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [mockDateColumn],
        defaultBarChartStyles,
        mockAxisColumnMappings
      );

      // Check basic structure
      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.data.values).toBe(mockData);
      expect(spec.facet).toBeDefined();
      expect(spec.facet.field).toBe('category2');

      const mainLayer = spec.spec.layer[0];
      // Check encoding in the spec
      expect(mainLayer.encoding.x.field).toBe('date');
      expect(mainLayer.encoding.y.field).toBe('count');
      expect(mainLayer.encoding.color.field).toBe('category');

      // select time range params
      expect(spec.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'applyTimeFilter' })])
      );
      expect(mainLayer.params).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'timeRangeBrush' })])
      );
    });

    test('handles different title display options', () => {
      const mockAxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
        [AxisRole.FACET]: mockCategoricalColumn2,
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createFacetedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [mockDateColumn],
        noTitleStyles,
        mockAxisColumnMappings
      );
      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createFacetedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [mockDateColumn],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult.title).toBe('Count Over Time by Category (Faceted by Category2)');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...defaultBarChartStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Faceted Time Bar Chart',
        },
      };

      const customTitleResult = createFacetedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [mockDateColumn],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult.title).toBe('Custom Faceted Time Bar Chart');
    });

    test('applies bar styling options', () => {
      const customStyles: BarChartStyle = {
        ...defaultBarChartStyles,
        barSizeMode: 'manual',
        barWidth: 0.5,
        barPadding: 0.2,
        showBarBorder: true,
        barBorderColor: '#FF0000',
        barBorderWidth: 2,
      };

      const mockAxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
        [AxisRole.FACET]: mockCategoricalColumn2,
      };

      const spec = createFacetedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [mockDateColumn],
        customStyles,
        mockAxisColumnMappings
      );

      // Check bar styling
      const barMark = spec.spec.layer[0].mark;
      expect(barMark.size).toBe(10); // 0.5 * 20
      expect(barMark.binSpacing).toBe(2); // 0.2 * 10
      expect(barMark.stroke).toBe('#FF0000');
      expect(barMark.strokeWidth).toBe(2);
    });

    test('adds threshold line when enabled', () => {
      const customStyles = {
        ...defaultBarChartStyles,
        thresholdOptions: {
          baseColor: '#00BD6B',
          thresholds: [{ value: 15, color: '#00FF00' }],
          thresholdStyle: ThresholdMode.Solid,
        },
      };

      const mockAxisColumnMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
        [AxisRole.FACET]: mockCategoricalColumn2,
      };

      const spec = createFacetedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [mockDateColumn],
        customStyles,
        mockAxisColumnMappings
      );

      // Check threshold layer
      expect(spec.spec.layer.length).toBeGreaterThan(1);
      const thresholdLayer = spec.spec.layer[1];
      expect(thresholdLayer.mark.type).toBe('rule');
      expect(thresholdLayer.mark.color).toBe('#00FF00');
      expect(thresholdLayer.mark.strokeWidth).toBe(1);
      expect(thresholdLayer.encoding.y.datum).toBe(15);
    });

    test('adds domain layer when showFullTimeRange is true (createFacetedTimeBarChart)', () => {
      const styles: BarChartStyle = {
        ...defaultBarChartStyles,
        showFullTimeRange: true,
      };
      const axisMappings = {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
        [AxisRole.COLOR]: mockCategoricalColumn,
        [AxisRole.FACET]: mockCategoricalColumn2,
      };
      const timeRange = {
        from: '2024-03-01T00:00:00.000Z',
        to: '2024-03-31T00:00:00.000Z',
      };

      // @ts-expect-error TS6133 TODO(ts-error): fixme
      const spec = createFacetedTimeBarChart(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [mockDateColumn],
        styles,
        axisMappings,
        timeRange
      );
      expect(Utils.applyTimeRangeToEncoding).toHaveBeenCalledWith(
        expect.any(Object), // mainLayerEncoding
        axisMappings,
        timeRange,
        styles.switchAxes
      );
    });
  });

  describe('createDoubleNumericalBarChart', () => {
    const mockNumericalColumn2 = {
      id: 2,
      name: 'sum',
      column: 'sum',
      schema: VisFieldType.Numerical,
      validValuesCount: 100,
      uniqueValuesCount: 50,
    };

    const mockAxisColumnMappings = {
      [AxisRole.X]: mockNumericalColumn,
      [AxisRole.Y]: mockNumericalColumn2,
    };
    test('creates a numerical histogram bar chart spec', () => {
      const spec = createDoubleNumericalBarChart(
        mockData,
        [mockNumericalColumn, mockNumericalColumn2],
        defaultBarChartStyles,
        mockAxisColumnMappings
      );

      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.data.values).toBe(mockData);
      expect(spec.layer).toHaveLength(1);

      const mainLayer = spec.layer[0];
      expect(mainLayer.mark.type).toBe('bar');
      expect(mainLayer.mark.tooltip).toBe(true);
      expect(mainLayer.encoding.x.field).toBe('count');
      expect(mainLayer.encoding.x.type).toBe('nominal');
      expect(mainLayer.encoding.y.field).toBe('sum');
      expect(mainLayer.encoding.y.aggregate).toBe('sum');
      expect(mainLayer.encoding.y.type).toBe('quantitative');

      // select time range params
      expect(spec.params).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'applyTimeFilter' })])
      );
      expect(mainLayer.params).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'timeRangeBrush' })])
      );
    });

    test('applies bucket options correctly', () => {
      const stylesWithBucket = {
        ...defaultBarChartStyles,
        bucket: {
          aggregationType: AggregationType.SUM,
        },
      };

      const spec = createDoubleNumericalBarChart(
        mockData,
        [mockNumericalColumn, mockNumericalColumn2],
        stylesWithBucket,
        mockAxisColumnMappings
      );

      expect(spec.layer[0].encoding.y.aggregate).toBe('sum');
    });
  });
});
