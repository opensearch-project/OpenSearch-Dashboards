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
import { VisColumn, VisFieldType, VEGASCHEMA, ThresholdLineStyle, Positions } from '../types';
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
    thresholdLines: [
      {
        id: '1',
        color: '#E7664C',
        show: false,
        style: ThresholdLineStyle.Full,
        value: 10,
        width: 1,
        name: '',
      },
    ],
    grid: {
      categoryLines: true,
      valueLines: true,
    },
  };

  describe('createSimpleAreaChart', () => {
    it('should create a simple area chart with one metric and one date', () => {
      const result = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        mockStyles
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

    it('should create a simple area chart with time marker when enabled', () => {
      const stylesWithTimeMarker = {
        ...mockStyles,
        addTimeMarker: true,
      };

      const result = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        stylesWithTimeMarker
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
        thresholdLines: [
          {
            id: '1',
            color: '#E7664C',
            show: true,
            style: ThresholdLineStyle.Dashed,
            value: 15,
            width: 2,
            name: 'Test Threshold',
          },
        ],
      };

      const result = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        stylesWithThreshold
      );

      // Verify threshold layer exists
      expect(result.layer.length).toBeGreaterThan(1);
      const thresholdLayer = result.layer.find(
        (layer: any) => layer.mark?.type === 'rule' && layer.encoding?.y?.datum === 15
      );
      expect(thresholdLayer).toBeDefined();
      expect(thresholdLayer).toHaveProperty('mark.color', '#E7664C');
      expect(thresholdLayer).toHaveProperty('mark.strokeWidth', 2);
      expect(thresholdLayer).toHaveProperty('mark.strokeDash');
    });
  });

  describe('createMultiAreaChart', () => {
    it('should create a multi-area chart with one metric, one date, and one categorical column', () => {
      const result = createMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        mockDateColumns,
        mockStyles
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
  });

  describe('createFacetedMultiAreaChart', () => {
    it('should create a faceted multi-area chart with one metric, one date, and two categorical columns', () => {
      const result = createFacetedMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        mockStyles
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('title', 'Value Over Time by Category (Faceted by Category2)');
      expect(result).toHaveProperty('data.values', mockTransformedData);
      expect(result).toHaveProperty('facet');
      expect(result).toHaveProperty('spec');

      // Verify facet configuration
      expect(result.facet).toHaveProperty('field', 'category2');
      expect(result.facet).toHaveProperty('columns', 2);

      // Verify spec configuration
      expect(result.spec).toHaveProperty('width', 250);
      expect(result.spec).toHaveProperty('height', 200);
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

    it('should add threshold lines to each facet when enabled', () => {
      const stylesWithThreshold = {
        ...mockStyles,
        thresholdLines: [
          {
            id: '1',
            color: '#E7664C',
            show: true,
            style: ThresholdLineStyle.Dashed,
            value: 15,
            width: 2,
            name: 'Test Threshold',
          },
        ],
      };

      const result = createFacetedMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        stylesWithThreshold
      );

      // Verify threshold layer exists in each facet
      expect(result.spec.layer.length).toBeGreaterThan(1);
      const thresholdLayer = result.spec.layer.find(
        (layer: any) => layer.mark?.type === 'rule' && layer.encoding?.y?.value === 15
      );
      expect(thresholdLayer).toBeDefined();
      expect(thresholdLayer).toHaveProperty('mark.color', '#E7664C');
      expect(thresholdLayer).toHaveProperty('mark.strokeWidth', 2);
      expect(thresholdLayer).toHaveProperty('mark.strokeDash');
    });
  });

  describe('createCategoryAreaChart', () => {
    it('should create a category-based area chart with one metric and one category', () => {
      const result = createCategoryAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [mockCategoricalColumns[0]],
        [],
        mockStyles
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
      const result = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        [],
        mockStyles
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('title', 'Value by Category and Category2');
      expect(result).toHaveProperty('data.values', mockTransformedData);

      // Verify encoding
      expect(result).toHaveProperty('encoding.x.field', 'category');
      expect(result).toHaveProperty('encoding.y.field', 'value');
      expect(result).toHaveProperty('encoding.y.stack', 'normalize');
      expect(result).toHaveProperty('encoding.color.field', 'category2');

      // Verify tooltip configuration
      expect(result.encoding).toHaveProperty('tooltip');
      expect(Array.isArray(result.encoding.tooltip)).toBe(true);
      expect(result.encoding.tooltip).toHaveLength(3);
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
        thresholdLines: [
          {
            id: '1',
            color: '#E7664C',
            show: true,
            style: ThresholdLineStyle.Dashed,
            value: 15,
            width: 2,
            name: 'Test Threshold',
          },
        ],
      };

      const result = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        [],
        stylesWithThreshold
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
