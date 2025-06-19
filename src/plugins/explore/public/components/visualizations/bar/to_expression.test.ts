/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createBarSpec, createStackedBarSpec } from './to_expression';
import { defaultBarChartStyles } from './bar_vis_config';
import { Positions, VisColumn, VisFieldType, VEGASCHEMA } from '../types';

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
        defaultBarChartStyles
      );

      // Check basic structure
      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.title).toBe('Count by Category');
      expect(spec.data.values).toBe(mockData);
      expect(spec.layer).toHaveLength(1);

      // Check encoding
      const mainLayer = spec.layer[0];
      expect(mainLayer.mark.type).toBe('bar');
      expect(mainLayer.mark.tooltip).toBe(true);
      expect(mainLayer.encoding.x.field).toBe('category');
      expect(mainLayer.encoding.y.field).toBe('count');
    });

    test('applies bar styling options', () => {
      const customStyles = {
        ...defaultBarChartStyles,
        barWidth: 0.5,
        barPadding: 0.2,
        showBarBorder: true,
        barBorderColor: '#FF0000',
        barBorderWidth: 2,
      };

      const spec = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        customStyles
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
        thresholdLine: {
          ...defaultBarChartStyles.thresholdLine,
          show: true,
          value: 15,
          color: '#00FF00',
          width: 2,
        },
      };

      const spec = createBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn],
        [],
        customStyles
      );

      // Check threshold line
      expect(spec.layer).toHaveLength(2);
      const thresholdLayer = spec.layer[1];
      expect(thresholdLayer.mark.type).toBe('rule');
      expect(thresholdLayer.mark.color).toBe('#00FF00');
      expect(thresholdLayer.mark.strokeWidth).toBe(2);
      expect(thresholdLayer.encoding.y.value).toBe(15);
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
        defaultBarChartStyles
      );

      // Check basic structure
      expect(spec.$schema).toBe(VEGASCHEMA);
      expect(spec.title).toBe('Count by Category and Category2');
      expect(spec.data.values).toBe(mockData);

      // Check encoding
      expect(spec.encoding.x.field).toBe('category');
      expect(spec.encoding.y.field).toBe('count');
      expect(spec.encoding.y.stack).toBe('normalize');
      expect(spec.encoding.color.field).toBe('category2');
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
        thresholdLine: {
          ...defaultBarChartStyles.thresholdLine,
          show: true,
          value: 15,
          color: '#00FF00',
          width: 2,
        },
      };

      const spec = createStackedBarSpec(
        mockData,
        [mockNumericalColumn],
        [mockCategoricalColumn, mockCategoricalColumn2],
        [],
        customStyles
      );

      // Check threshold line
      expect(spec.layer).toBeDefined();
      expect(spec.layer).toHaveLength(2);
      const thresholdLayer = spec.layer[1];
      expect(thresholdLayer.mark.type).toBe('rule');
      expect(thresholdLayer.mark.color).toBe('#00FF00');
      expect(thresholdLayer.mark.strokeWidth).toBe(2);
      expect(thresholdLayer.encoding.y.value).toBe(15);
    });
  });
});
