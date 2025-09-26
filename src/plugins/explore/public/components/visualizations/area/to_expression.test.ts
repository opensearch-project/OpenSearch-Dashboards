/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSimpleAreaChart,
  createMultiAreaChart,
  createFacetedMultiAreaChart,
  createCategoryAreaChart,
  createStackedAreaChart,
} from './to_expression';
import {
  VisColumn,
  VisFieldType,
  VEGASCHEMA,
  ThresholdMode,
  Positions,
  AxisRole,
  AxisColumnMappings,
} from '../types';
import { AreaChartStyleControls } from './area_vis_config';

describe('Area Chart to_expression', () => {
  // Mock data for testing
  const mockTransformedData = [
    { date: '2023-01-01', value: 10, category: 'A', category2: 'X' },
    { date: '2023-01-02', value: 20, category: 'A', category2: 'X' },
    { date: '2023-01-03', value: 15, category: 'A', category2: 'X' },
    { date: '2023-01-01', value: 5, category: 'B', category2: 'Y' },
    { date: '2023-01-02', value: 15, category: 'B', category2: 'Y' },
    { date: '2023-01-03', value: 25, category: 'B', category2: 'Y' },
  ];

  const mockNumericalColumns: VisColumn[] = [
    {
      id: 1,
      name: 'Value',
      schema: VisFieldType.Numerical,
      column: 'value',
      validValuesCount: 6,
      uniqueValuesCount: 5,
    },
  ];

  const mockDateColumns: VisColumn[] = [
    {
      id: 2,
      name: 'Date',
      schema: VisFieldType.Date,
      column: 'date',
      validValuesCount: 6,
      uniqueValuesCount: 3,
    },
  ];

  const mockCategoricalColumns: VisColumn[] = [
    {
      id: 3,
      name: 'Category',
      schema: VisFieldType.Categorical,
      column: 'category',
      validValuesCount: 6,
      uniqueValuesCount: 2,
    },
    {
      id: 4,
      name: 'Category2',
      schema: VisFieldType.Categorical,
      column: 'category2',
      validValuesCount: 6,
      uniqueValuesCount: 2,
    },
  ];

  const mockStyles: Partial<AreaChartStyleControls> = {
    addLegend: true,
    legendPosition: Positions.RIGHT,
    addTimeMarker: false,
    areaOpacity: 0.6,
    tooltipOptions: {
      mode: 'all',
    },
    thresholdOptions: {
      baseColor: '#00BD6B',
      thresholds: [],
      thresholdStyle: ThresholdMode.Solid,
    },
    titleOptions: {
      show: true,
      titleName: '',
    },
  };

  describe('createSimpleAreaChart', () => {
    it('should create a simple area chart with one metric and one date', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
      };

      const result = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        mockStyles,
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('title', 'Value Over Time');
      expect(result).toHaveProperty('data.values', mockTransformedData);
      expect(result).toHaveProperty('layer');
      expect(Array.isArray(result.layer)).toBe(true);

      // Verify the main layer
      const mainLayer = result.layer[0];
      expect(mainLayer).toHaveProperty('mark.type', 'area');
      expect(mainLayer).toHaveProperty('mark.opacity', 0.6);
      expect(mainLayer).toHaveProperty('encoding.x.field', 'date');
      expect(mainLayer).toHaveProperty('encoding.y.field', 'value');

      // Verify legend configuration
      expect(result).toHaveProperty('legend');
      expect(result.legend).toHaveProperty('orient', 'right');
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        noTitleStyles,
        mockAxisColumnMappings
      );

      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult).toHaveProperty('title', 'Value Over Time');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Area Chart Title',
        },
      };

      const customTitleResult = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult).toHaveProperty('title', 'Custom Area Chart Title');
    });

    it('should create a simple area chart with time marker when enabled', () => {
      const stylesWithTimeMarker = {
        ...mockStyles,
        addTimeMarker: true,
      };

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
      };

      const result = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        stylesWithTimeMarker,
        mockAxisColumnMappings
      );

      // Verify time marker layer exists
      expect(result.layer.length).toBeGreaterThan(1);
      const timeMarkerLayer = result.layer.find(
        (layer: any) => layer.mark?.type === 'rule' && layer.encoding?.x?.datum
      );
      expect(timeMarkerLayer).toBeDefined();
      expect(timeMarkerLayer).toHaveProperty('mark.color', '#FF6B6B');
      expect(timeMarkerLayer).toHaveProperty('mark.strokeDash');
    });

    it('should create a simple area chart with threshold line when enabled', () => {
      const stylesWithThreshold = {
        ...mockStyles,
        thresholdOptions: {
          baseColor: '#00BD6B',
          thresholds: [{ value: 15, color: '#E7664C' }],
          thresholdStyle: ThresholdMode.Solid,
        },
      };

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
      };

      const result = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        stylesWithThreshold,
        mockAxisColumnMappings
      );

      // Verify threshold layer exists
      expect(result.layer.length).toBeGreaterThan(1);
      const thresholdLayer = result.layer.find(
        (layer: any) => layer.mark?.type === 'rule' && layer.encoding?.y?.datum === 15
      );
      expect(thresholdLayer).toBeDefined();
      expect(thresholdLayer).toHaveProperty('mark.color', '#E7664C');
      expect(thresholdLayer).toHaveProperty('mark.strokeWidth', 1);
      expect(thresholdLayer).toHaveProperty('mark.strokeDash');
    });

    it('should fallback to default tooltip format when dateField is missing', () => {
      const incompleteAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: { ...mockDateColumns[0], column: undefined as any },
      };
      const result = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        mockStyles,
        incompleteAxisColumnMappings
      );
      const tooltip = result.layer[0].encoding.tooltip;
      expect(tooltip[0].format).toBe('%b %d, %Y %H:%M:%S');
    });
  });

  describe('createMultiAreaChart', () => {
    it('should create a multi-area chart with one metric, one date, and one categorical column', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
      };

      const result = createMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        mockDateColumns,
        mockStyles,
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('title', 'Value Over Time by Category');
      expect(result).toHaveProperty('data.values', mockTransformedData);
      expect(result).toHaveProperty('layer');
      expect(Array.isArray(result.layer)).toBe(true);

      // Verify the main layer
      const mainLayer = result.layer[0];
      expect(mainLayer).toHaveProperty('mark.type', 'area');
      expect(mainLayer).toHaveProperty('mark.opacity', 0.6);
      expect(mainLayer).toHaveProperty('encoding.x.field', 'date');
      expect(mainLayer).toHaveProperty('encoding.y.field', 'value');
      expect(mainLayer).toHaveProperty('encoding.color.field', 'category');

      // Verify tooltip configuration
      expect(mainLayer.encoding).toHaveProperty('tooltip');
      expect(Array.isArray(mainLayer.encoding.tooltip)).toBe(true);
      expect(mainLayer.encoding.tooltip).toHaveLength(3);
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        mockDateColumns,
        noTitleStyles,
        mockAxisColumnMappings
      );

      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        mockDateColumns,
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult).toHaveProperty('title', 'Value Over Time by Category');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Multi-Area Chart',
        },
      };

      const customTitleResult = createMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        mockDateColumns,
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult).toHaveProperty('title', 'Custom Multi-Area Chart');
    });

    it('should fallback to default tooltip format when dateField is missing', () => {
      const incompleteAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
        [AxisRole.X]: { ...mockDateColumns[0], column: undefined as any },
      };
      const result = createMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        mockDateColumns,
        mockStyles,
        incompleteAxisColumnMappings
      );
      const tooltip = result.layer[0].encoding.tooltip;
      expect(tooltip[0].format).toBe('%b %d, %Y %H:%M:%S');
    });
  });

  describe('createFacetedMultiAreaChart', () => {
    it('should create a faceted multi-area chart with one metric, one date, and two categorical columns', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
        [AxisRole.FACET]: mockCategoricalColumns[1],
      };

      const result = createFacetedMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        mockStyles,
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('title', 'Value Over Time by Category (Faceted by Category2)');
      expect(result).toHaveProperty('data.values', mockTransformedData);
      expect(result).toHaveProperty('facet');
      expect(result).toHaveProperty('spec');

      // Verify facet configuration
      expect(result.facet).toHaveProperty('field', 'category2');

      // Verify spec configuration
      expect(result.spec).toHaveProperty('layer');
      expect(Array.isArray(result.spec.layer)).toBe(true);

      // Verify the main layer
      const mainLayer = result.spec.layer[0];
      expect(mainLayer).toHaveProperty('mark.type', 'area');
      expect(mainLayer).toHaveProperty('mark.opacity', 0.6);
      expect(mainLayer).toHaveProperty('encoding.x.field', 'date');
      expect(mainLayer).toHaveProperty('encoding.y.field', 'value');
      expect(mainLayer).toHaveProperty('encoding.color.field', 'category');
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
        [AxisRole.FACET]: mockCategoricalColumns[1],
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createFacetedMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        noTitleStyles,
        mockAxisColumnMappings
      );

      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createFacetedMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult).toHaveProperty(
        'title',
        'Value Over Time by Category (Faceted by Category2)'
      );

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Faceted Chart',
        },
      };

      const customTitleResult = createFacetedMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult).toHaveProperty('title', 'Custom Faceted Chart');
    });

    it('should add threshold lines to each facet when enabled', () => {
      const stylesWithThreshold = {
        ...mockStyles,
        thresholdOptions: {
          baseColor: '#00BD6B',
          thresholds: [{ value: 15, color: '#E7664C' }],
          thresholdStyle: ThresholdMode.Solid,
        },
      };

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockDateColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
        [AxisRole.FACET]: mockCategoricalColumns[1],
      };

      const result = createFacetedMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        stylesWithThreshold,
        mockAxisColumnMappings
      );

      // Verify threshold layer exists in each facet
      expect(result.spec.layer.length).toBeGreaterThan(1);
      const thresholdLayer = result.spec.layer.find(
        (layer: any) => layer.mark?.type === 'rule' && layer.encoding?.y?.datum === 15
      );
      expect(thresholdLayer).toBeDefined();
      expect(thresholdLayer).toHaveProperty('mark.color', '#E7664C');
      expect(thresholdLayer).toHaveProperty('mark.strokeWidth', 1);
      expect(thresholdLayer).toHaveProperty('mark.strokeDash');
    });

    it('should fallback to default tooltip format when dateField is missing', () => {
      const incompleteAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[0],
        [AxisRole.FACET]: mockCategoricalColumns[1],
        [AxisRole.X]: { ...mockDateColumns[0], column: undefined as any },
      };
      const result = createFacetedMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        mockStyles,
        incompleteAxisColumnMappings
      );
      const tooltip = result.spec.layer[0].encoding.tooltip;
      expect(tooltip[0].format).toBe('%b %d, %Y %H:%M:%S');
    });
  });

  describe('createCategoryAreaChart', () => {
    it('should create a category-based area chart with one metric and one category', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockCategoricalColumns[0],
      };

      const result = createCategoryAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        [],
        mockStyles,
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('title', 'Value by Category');
      expect(result).toHaveProperty('data.values', mockTransformedData);
      expect(result).toHaveProperty('layer');
      expect(Array.isArray(result.layer)).toBe(true);

      // Verify the main layer
      const mainLayer = result.layer[0];
      expect(mainLayer).toHaveProperty('mark.type', 'area');
      expect(mainLayer).toHaveProperty('mark.opacity', 0.6);
      expect(mainLayer).toHaveProperty('encoding.x.field', 'category');
      expect(mainLayer).toHaveProperty('encoding.y.field', 'value');

      // Verify tooltip configuration
      expect(mainLayer.encoding).toHaveProperty('tooltip');
      expect(Array.isArray(mainLayer.encoding.tooltip)).toBe(true);
      expect(mainLayer.encoding.tooltip).toHaveLength(2);
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockCategoricalColumns[0],
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createCategoryAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        [],
        noTitleStyles,
        mockAxisColumnMappings
      );

      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createCategoryAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        [],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult).toHaveProperty('title', 'Value by Category');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Category Chart',
        },
      };

      const customTitleResult = createCategoryAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        [],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult).toHaveProperty('title', 'Custom Category Chart');
    });

    it('should throw an error when required columns are missing', () => {
      expect(() => {
        createCategoryAreaChart(mockTransformedData, [], [], [], mockStyles);
      }).toThrow(
        'Category area chart requires at least one numerical column and one categorical column'
      );
    });
  });

  describe('createStackedAreaChart', () => {
    it('should create a stacked area chart with one metric and two categorical columns', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockCategoricalColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[1],
      };

      const result = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        [],
        mockStyles,
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('title', 'Value by Category and Category2');
      expect(result).toHaveProperty('data.values', mockTransformedData);

      // Verify encoding
      expect(result.layer[0]).toHaveProperty('encoding.x.field', 'category');
      expect(result.layer[0]).toHaveProperty('encoding.y.field', 'value');
      expect(result.layer[0]).toHaveProperty('encoding.y.stack', 'normalize');
      expect(result.layer[0]).toHaveProperty('encoding.color.field', 'category2');

      // Verify tooltip configuration
      expect(result.layer[0].encoding).toHaveProperty('tooltip');
      expect(Array.isArray(result.layer[0].encoding.tooltip)).toBe(true);
      expect(result.layer[0].encoding.tooltip).toHaveLength(3);
    });

    it('should handle different title display options', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockCategoricalColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[1],
      };

      // Case 1: No title (show = false)
      const noTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: false,
          titleName: '',
        },
      };

      const noTitleResult = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        [],
        noTitleStyles,
        mockAxisColumnMappings
      );

      expect(noTitleResult.title).toBeUndefined();

      // Case 2: Default title (show = true, titleName = '')
      const defaultTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: '',
        },
      };

      const defaultTitleResult = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        [],
        defaultTitleStyles,
        mockAxisColumnMappings
      );
      expect(defaultTitleResult).toHaveProperty('title', 'Value by Category and Category2');

      // Case 3: Custom title (show = true, titleName = 'Custom Title')
      const customTitleStyles = {
        ...mockStyles,
        titleOptions: {
          show: true,
          titleName: 'Custom Stacked Chart',
        },
      };

      const customTitleResult = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        [],
        customTitleStyles,
        mockAxisColumnMappings
      );
      expect(customTitleResult).toHaveProperty('title', 'Custom Stacked Chart');
    });

    it('should throw an error when required columns are missing', () => {
      expect(() => {
        createStackedAreaChart(
          mockTransformedData,
          mockNumericalColumns,
          [mockCategoricalColumns[0]],
          [],
          mockStyles
        );
      }).toThrow(
        'Stacked area chart requires at least one numerical column and two categorical columns'
      );
    });

    it('should add threshold layer when enabled', () => {
      const stylesWithThreshold = {
        ...mockStyles,
        thresholdOptions: {
          baseColor: '#00BD6B',
          thresholds: [{ value: 15, color: '#E7664C' }],
          thresholdStyle: ThresholdMode.Solid,
        },
      };

      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.X]: mockCategoricalColumns[0],
        [AxisRole.COLOR]: mockCategoricalColumns[1],
      };

      const result = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        [],
        stylesWithThreshold,
        mockAxisColumnMappings
      );

      // Verify the chart structure has changed to use layers
      expect(result).toHaveProperty('layer');
      expect(Array.isArray(result.layer)).toBe(true);
      expect(result.layer.length).toBeGreaterThan(1);

      // Verify the main layer is now the first element in the layer array
      const mainLayer = result.layer[0];
      expect(mainLayer).toHaveProperty('mark.type', 'area');
      expect(mainLayer).toHaveProperty('encoding.x.field', 'category');
      expect(mainLayer).toHaveProperty('encoding.y.field', 'value');
      expect(mainLayer).toHaveProperty('encoding.color.field', 'category2');
    });
  });
});
