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
import { VisColumn, VisFieldType, Positions, VEGASCHEMA, ThresholdLineStyle } from '../types';

describe('area chart to_expression', () => {
  // Mock data for tests
  const mockTransformedData = [
    { date: '2023-01-01', value: 10, category: 'A' },
    { date: '2023-01-02', value: 20, category: 'A' },
    { date: '2023-01-03', value: 15, category: 'A' },
    { date: '2023-01-01', value: 5, category: 'B' },
    { date: '2023-01-02', value: 15, category: 'B' },
    { date: '2023-01-03', value: 25, category: 'B' },
  ];

  const mockNumericalColumns: VisColumn[] = [
    {
      id: 1,
      name: 'Value',
      column: 'value',
      schema: VisFieldType.Numerical,
      validValuesCount: 100,
      uniqueValuesCount: 50,
    },
  ];

  const mockCategoricalColumns: VisColumn[] = [
    {
      id: 2,
      name: 'Category',
      column: 'category',
      schema: VisFieldType.Categorical,
      validValuesCount: 100,
      uniqueValuesCount: 2,
    },
  ];

  const mockDateColumns: VisColumn[] = [
    {
      id: 3,
      name: 'Date',
      column: 'date',
      schema: VisFieldType.Date,
      validValuesCount: 100,
      uniqueValuesCount: 100,
    },
  ];

  const mockStyles = {
    addTooltip: true,
    addLegend: true,
    legendPosition: Positions.RIGHT,
    areaOpacity: 0.6,
  };

  describe('createSimpleAreaChart', () => {
    it('should create a valid Vega spec for a simple area chart', () => {
      const spec = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        mockStyles
      );

      // Check basic structure
      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.title).toBe('Value Over Time');
      expect(spec.data.values).toBe(mockTransformedData);
      expect(spec.layer).toBeInstanceOf(Array);
      expect(spec.layer.length).toBeGreaterThanOrEqual(1);

      // Check main layer
      const mainLayer = spec.layer[0];
      expect(mainLayer.mark.type).toBe('area');
      expect(mainLayer.mark.opacity).toBe(0.6);
      expect(mainLayer.encoding.x.field).toBe('date');
      expect(mainLayer.encoding.y.field).toBe('value');
    });

    it('should include threshold layer when enabled', () => {
      const stylesWithThreshold = {
        ...mockStyles,
        thresholdLine: {
          show: true,
          color: '#E7664C',
          value: 15,
          width: 1,
          style: ThresholdLineStyle.Full,
        },
      };

      const spec = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        stylesWithThreshold
      );

      // Check that there are at least 2 layers (main + threshold)
      expect(spec.layer.length).toBeGreaterThanOrEqual(2);

      // Check threshold layer
      const thresholdLayer = spec.layer.find((layer: any) => layer.mark.type === 'rule');
      expect(thresholdLayer).toBeDefined();
      expect(thresholdLayer.mark.color).toBe('#E7664C');
      expect(thresholdLayer.encoding.y.datum).toBe(15);
    });

    it('should include time marker layer when enabled', () => {
      const stylesWithTimeMarker = {
        ...mockStyles,
        addTimeMarker: true,
      };

      const spec = createSimpleAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockDateColumns,
        stylesWithTimeMarker
      );

      // Check that there are at least 2 layers (main + time marker)
      expect(spec.layer.length).toBeGreaterThanOrEqual(2);

      // Check time marker layer
      const timeMarkerLayer = spec.layer.find(
        (layer: any) => layer.mark.type === 'rule' && layer.encoding.x?.datum?.expr === 'now()'
      );
      expect(timeMarkerLayer).toBeDefined();
      expect(timeMarkerLayer.mark.color).toBe('#FF6B6B');
    });
  });

  describe('createMultiAreaChart', () => {
    it('should create a valid Vega spec for a multi-area chart', () => {
      const spec = createMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        mockDateColumns,
        mockStyles
      );

      // Check basic structure
      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.title).toBe('Value Over Time by Category');
      expect(spec.data.values).toBe(mockTransformedData);
      expect(spec.layer).toBeInstanceOf(Array);

      // Check main layer
      const mainLayer = spec.layer[0];
      expect(mainLayer.mark.type).toBe('area');
      expect(mainLayer.encoding.x.field).toBe('date');
      expect(mainLayer.encoding.y.field).toBe('value');
      expect(mainLayer.encoding.color.field).toBe('category');
      expect(mainLayer.encoding.color.legend.title).toBe('Category');
    });
  });

  describe('createFacetedMultiAreaChart', () => {
    it('should create a valid Vega spec for a faceted multi-area chart', () => {
      const secondCategoricalColumn: VisColumn = {
        id: 4,
        name: 'Second Category',
        column: 'second_category',
        schema: VisFieldType.Categorical,
        validValuesCount: 100,
        uniqueValuesCount: 3,
      };

      const spec = createFacetedMultiAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [...mockCategoricalColumns, secondCategoricalColumn],
        mockDateColumns,
        mockStyles
      );

      // Check basic structure
      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.title).toBe('Value Over Time by Category (Faceted by Second Category)');
      expect(spec.data.values).toBe(mockTransformedData);
      expect(spec.facet).toBeDefined();
      expect(spec.facet.field).toBe('second_category');
      expect(spec.spec).toBeDefined();
      expect(spec.spec.layer).toBeInstanceOf(Array);

      // Check main layer in the facet spec
      const mainLayer = spec.spec.layer[0];
      expect(mainLayer.mark.type).toBe('area');
      expect(mainLayer.encoding.x.field).toBe('date');
      expect(mainLayer.encoding.y.field).toBe('value');
      expect(mainLayer.encoding.color.field).toBe('category');
    });
  });

  describe('createCategoryAreaChart', () => {
    it('should create a valid Vega spec for a category-based area chart', () => {
      const spec = createCategoryAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        mockCategoricalColumns,
        [],
        mockStyles
      );

      // Check basic structure
      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.title).toBe('Value by Category');
      expect(spec.data.values).toBe(mockTransformedData);
      expect(spec.layer).toBeInstanceOf(Array);

      // Check main layer
      const mainLayer = spec.layer[0];
      expect(mainLayer.mark.type).toBe('area');
      expect(mainLayer.encoding.x.field).toBe('category');
      expect(mainLayer.encoding.y.field).toBe('value');
    });

    it('should throw an error if required columns are missing', () => {
      expect(() => {
        createCategoryAreaChart(mockTransformedData, [], mockCategoricalColumns, [], mockStyles);
      }).toThrow();

      expect(() => {
        createCategoryAreaChart(mockTransformedData, mockNumericalColumns, [], [], mockStyles);
      }).toThrow();
    });
  });

  describe('createStackedAreaChart', () => {
    it('should create a valid Vega spec for a stacked area chart', () => {
      const secondCategoricalColumn: VisColumn = {
        id: 4,
        name: 'Second Category',
        column: 'second_category',
        schema: VisFieldType.Categorical,
        validValuesCount: 100,
        uniqueValuesCount: 3,
      };

      const spec = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [...mockCategoricalColumns, secondCategoricalColumn],
        [],
        mockStyles
      );

      // Check basic structure
      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.title).toBe('Value by Category and Second Category');
      expect(spec.data.values).toBe(mockTransformedData);

      // Check encoding
      if ('encoding' in spec) {
        expect(spec.encoding.x.field).toBe('category');
        expect(spec.encoding.y.field).toBe('value');
        expect(spec.encoding.y.stack).toBe('normalize');
        expect(spec.encoding.color.field).toBe('second_category');
      } else if ('layer' in spec && spec.layer.length > 0) {
        const mainLayer = spec.layer[0];
        expect(mainLayer.encoding.x.field).toBe('category');
        expect(mainLayer.encoding.y.field).toBe('value');
        expect(mainLayer.encoding.y.stack).toBe('normalize');
        expect(mainLayer.encoding.color.field).toBe('second_category');
      }
    });

    it('should throw an error if required columns are missing', () => {
      expect(() => {
        createStackedAreaChart(mockTransformedData, [], mockCategoricalColumns, [], mockStyles);
      }).toThrow();

      expect(() => {
        createStackedAreaChart(
          mockTransformedData,
          mockNumericalColumns,
          [mockCategoricalColumns[0]],
          [],
          mockStyles
        );
      }).toThrow();
    });

    it('should include threshold line when enabled', () => {
      const secondCategoricalColumn: VisColumn = {
        id: 4,
        name: 'Second Category',
        column: 'second_category',
        schema: VisFieldType.Categorical,
        validValuesCount: 100,
        uniqueValuesCount: 3,
      };

      const stylesWithThreshold = {
        ...mockStyles,
        thresholdLine: {
          show: true,
          color: '#E7664C',
          value: 15,
          width: 1,
          style: ThresholdLineStyle.Full,
        },
      };

      const spec = createStackedAreaChart(
        mockTransformedData,
        mockNumericalColumns,
        [...mockCategoricalColumns, secondCategoricalColumn],
        [],
        stylesWithThreshold
      );

      // Check that there are layers with threshold
      expect(spec.layer).toBeInstanceOf(Array);
      expect(spec.layer.length).toBe(2);

      // Check threshold layer
      const thresholdLayer = spec.layer[1];
      expect(thresholdLayer.mark.type).toBe('rule');
      expect(thresholdLayer.mark.color).toBe('#E7664C');
    });
  });
});
