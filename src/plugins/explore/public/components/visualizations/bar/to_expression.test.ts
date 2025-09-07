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
  createNumericalHistogramBarChart,
  createSingleBarChart,
} from './to_expression';
import { defaultBarChartStyles, BarChartStyleControls } from './bar_vis_config';
import {
  VisColumn,
  VisFieldType,
  VEGASCHEMA,
  AxisRole,
  ThresholdLineStyle,
  AggregationType,
} from '../types';

describe('bar to_expression', () => {
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
      const customStyles: Partial<BarChartStyleControls> = {
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
      const customStyles: Partial<BarChartStyleControls> = {
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
        thresholdLines: [
          {
            id: '1',
            color: '#00FF00',
            show: true,
            style: ThresholdLineStyle.Full,
            value: 15,
            width: 2,
            name: '',
          },
        ],
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
      expect(thresholdLayer.mark.strokeWidth).toBe(2);
      expect(thresholdLayer.encoding.y.datum).toBe(15);
    });

    test('throws error when required columns are missing', () => {
      // No numerical columns
      expect(() => {
        createBarSpec(mockData, [], [mockCategoricalColumn], [], defaultBarChartStyles);
      }).toThrow('Bar chart requires at least one numerical column and one categorical column');

      // No categorical columns
      expect(() => {
        createBarSpec(mockData, [mockNumericalColumn], [], [], defaultBarChartStyles);
      }).toThrow('Bar chart requires at least one numerical column and one categorical column');
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

      // Check encoding
      expect(spec.encoding.x.field).toBe('category');
      expect(spec.encoding.y.field).toBe('count');
      expect(spec.encoding.color.field).toBe('category2');
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

    test('throws error when required columns are missing', () => {
      // No numerical columns
      expect(() => {
        createStackedBarSpec(
          mockData,
          [],
          [mockCategoricalColumn, mockCategoricalColumn2],
          [],
          defaultBarChartStyles
        );
      }).toThrow(
        'Stacked bar chart requires at least one numerical column and two categorical columns'
      );

      // Only one categorical column
      expect(() => {
        createStackedBarSpec(
          mockData,
          [mockNumericalColumn],
          [mockCategoricalColumn],
          [],
          defaultBarChartStyles
        );
      }).toThrow(
        'Stacked bar chart requires at least one numerical column and two categorical columns'
      );
    });

    test('adds threshold line when enabled', () => {
      const customStyles = {
        ...defaultBarChartStyles,
        thresholdLines: [
          {
            id: '1',
            color: '#00FF00',
            show: true,
            style: ThresholdLineStyle.Full,
            value: 15,
            width: 2,
            name: '',
          },
        ],
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
      expect(thresholdLayer.mark.strokeWidth).toBe(2);
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
      const customStyles: Partial<BarChartStyleControls> = {
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
        thresholdLines: [
          {
            id: '1',
            color: '#00FF00',
            show: true,
            style: ThresholdLineStyle.Full,
            value: 15,
            width: 2,
            name: '',
          },
        ],
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
      expect(thresholdLayer.mark.strokeWidth).toBe(2);
      expect(thresholdLayer.encoding.y.datum).toBe(15);
    });

    test('throws error when required columns are missing', () => {
      // No numerical columns
      expect(() => {
        createTimeBarChart(mockData, [], [mockDateColumn], defaultBarChartStyles);
      }).toThrow('Time bar chart requires at least one numerical column and one date column');

      // No date columns
      expect(() => {
        createTimeBarChart(mockData, [mockNumericalColumn], [], defaultBarChartStyles);
      }).toThrow('Time bar chart requires at least one numerical column and one date column');
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

      // Check encoding
      expect(spec.encoding.x.field).toBe('date');
      expect(spec.encoding.x.type).toBe('temporal');
      expect(spec.encoding.y.field).toBe('count');
      expect(spec.encoding.y.type).toBe('quantitative');
      expect(spec.encoding.color.field).toBe('category');
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
      const customStyles: Partial<BarChartStyleControls> = {
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

      // Check bar styling
      expect(spec.mark.size).toBe(10); // 0.5 * 20
      expect(spec.mark.binSpacing).toBe(2); // 0.2 * 10
      expect(spec.mark.stroke).toBe('#FF0000');
      expect(spec.mark.strokeWidth).toBe(2);
    });

    test('adds threshold line when enabled', () => {
      const customStyles = {
        ...defaultBarChartStyles,
        thresholdLines: [
          {
            id: '1',
            color: '#00FF00',
            show: true,
            style: ThresholdLineStyle.Full,
            value: 15,
            width: 2,
            name: '',
          },
        ],
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
      expect(thresholdLayer.mark.strokeWidth).toBe(2);
      expect(thresholdLayer.encoding.y.datum).toBe(15);
    });

    test('throws error when required columns are missing', () => {
      // No numerical columns
      expect(() => {
        createGroupedTimeBarChart(
          mockData,
          [],
          [mockCategoricalColumn],
          [mockDateColumn],
          defaultBarChartStyles
        );
      }).toThrow(
        'Grouped time bar chart requires at least one numerical column, one categorical column, and one date column'
      );

      // No categorical columns
      expect(() => {
        createGroupedTimeBarChart(
          mockData,
          [mockNumericalColumn],
          [],
          [mockDateColumn],
          defaultBarChartStyles
        );
      }).toThrow(
        'Grouped time bar chart requires at least one numerical column, one categorical column, and one date column'
      );

      // No date columns
      expect(() => {
        createGroupedTimeBarChart(
          mockData,
          [mockNumericalColumn],
          [mockCategoricalColumn],
          [],
          defaultBarChartStyles
        );
      }).toThrow(
        'Grouped time bar chart requires at least one numerical column, one categorical column, and one date column'
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

      // Check encoding in the spec
      expect(spec.spec.layer[0].encoding.x.field).toBe('date');
      expect(spec.spec.layer[0].encoding.y.field).toBe('count');
      expect(spec.spec.layer[0].encoding.color.field).toBe('category');
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
      const customStyles: Partial<BarChartStyleControls> = {
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
        thresholdLines: [
          {
            id: '1',
            color: '#00FF00',
            show: true,
            style: ThresholdLineStyle.Full,
            value: 15,
            width: 2,
            name: '',
          },
        ],
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
      expect(thresholdLayer.mark.strokeWidth).toBe(2);
      expect(thresholdLayer.encoding.y.datum).toBe(15);
    });

    test('throws error when required columns are missing', () => {
      // No numerical columns
      expect(() => {
        createFacetedTimeBarChart(
          mockData,
          [],
          [mockCategoricalColumn, mockCategoricalColumn2],
          [mockDateColumn],
          defaultBarChartStyles
        );
      }).toThrow(
        'Faceted time bar chart requires at least one numerical column, two categorical columns, and one date column'
      );

      // Only one categorical column
      expect(() => {
        createFacetedTimeBarChart(
          mockData,
          [mockNumericalColumn],
          [mockCategoricalColumn],
          [mockDateColumn],
          defaultBarChartStyles
        );
      }).toThrow(
        'Faceted time bar chart requires at least one numerical column, two categorical columns, and one date column'
      );

      // No date columns
      expect(() => {
        createFacetedTimeBarChart(
          mockData,
          [mockNumericalColumn],
          [mockCategoricalColumn, mockCategoricalColumn2],
          [],
          defaultBarChartStyles
        );
      }).toThrow(
        'Faceted time bar chart requires at least one numerical column, two categorical columns, and one date column'
      );
    });
  });

  describe('createNumericalHistogramBarChart', () => {
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
      const spec = createNumericalHistogramBarChart(
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
      expect(mainLayer.encoding.x.type).toBe('quantitative');
      expect(mainLayer.encoding.y.field).toBe('sum');
      expect(mainLayer.encoding.y.aggregate).toBe('sum');
      expect(mainLayer.encoding.y.type).toBe('quantitative');
    });

    test('applies bucket options correctly', () => {
      const stylesWithBucket = {
        ...defaultBarChartStyles,
        bucket: {
          bucketSize: 50,
          aggregationType: AggregationType.SUM,
        },
      };

      const spec = createNumericalHistogramBarChart(
        mockData,
        [mockNumericalColumn, mockNumericalColumn2],
        stylesWithBucket,
        mockAxisColumnMappings
      );

      expect(spec.layer[0].encoding.x.bin.step).toBe(50);
      expect(spec.layer[0].encoding.y.aggregate).toBe('sum');
    });
  });

  describe('createSingleBarChart', () => {
    const mockAxisColumnMappings = {
      [AxisRole.X]: mockNumericalColumn,
    };
    test('creates a numerical histogram bar chart spec', () => {
      const spec = createSingleBarChart(
        mockData,
        [mockNumericalColumn],
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
      expect(mainLayer.encoding.x.type).toBe('quantitative');
      expect(spec.layer[0].encoding.y.aggregate).toBe('count');
    });

    test('applies bucket options correctly, single bar aggregation should only be count', () => {
      const stylesWithBucket = {
        ...defaultBarChartStyles,
        bucket: {
          bucketSize: 50,
          aggregationType: AggregationType.SUM,
        },
      };

      const spec = createSingleBarChart(
        mockData,
        [mockNumericalColumn],
        stylesWithBucket,
        mockAxisColumnMappings
      );

      expect(spec.layer[0].encoding.x.bin.step).toBe(50);
      expect(spec.layer[0].encoding.y.aggregate).toBe('count');
    });
  });
});
