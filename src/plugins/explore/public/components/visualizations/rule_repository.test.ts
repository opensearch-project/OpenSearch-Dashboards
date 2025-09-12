/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ALL_VISUALIZATION_RULES } from './rule_repository';
import { VisColumn, VisFieldType } from './types';
import {
  createSimpleLineChart,
  createLineBarChart,
  createMultiLineChart,
  createFacetedMultiLineChart,
} from './line/to_expression';
import { createRegularHeatmap } from './heatmap/to_expression';
import { createPieSpec } from './pie/to_expression';
import {
  createTwoMetricScatter,
  createTwoMetricOneCateScatter,
  createThreeMetricOneCateScatter,
} from './scatter/to_expression';
import { createSingleMetric } from './metric/to_expression';
import { createBarSpec, createStackedBarSpec } from './bar/to_expression';
// Area chart expressions are only used in mocks, removing unused import

// Mock the chart expression functions
jest.mock('./line/to_expression', () => ({
  createSimpleLineChart: jest.fn().mockReturnValue('simple-line-chart-expression'),
  createLineBarChart: jest.fn().mockReturnValue('line-bar-chart-expression'),
  createMultiLineChart: jest.fn().mockReturnValue('multi-line-chart-expression'),
  createFacetedMultiLineChart: jest.fn().mockReturnValue('faceted-multi-line-chart-expression'),
  createCategoryLineChart: jest.fn().mockReturnValue('category-line-chart-expression'),
}));

jest.mock('./heatmap/to_expression', () => ({
  createHeatmapWithBin: jest.fn().mockReturnValue('heatmap-with-bin-expression'),
  createRegularHeatmap: jest.fn().mockReturnValue('regular-heatmap-expression'),
}));

jest.mock('./pie/to_expression', () => ({
  createPieSpec: jest.fn().mockReturnValue('pie-chart-expression'),
}));

jest.mock('./scatter/to_expression', () => ({
  createTwoMetricScatter: jest.fn().mockReturnValue('two-metric-scatter-expression'),
  createTwoMetricOneCateScatter: jest
    .fn()
    .mockReturnValue('two-metric-one-cate-scatter-expression'),
  createThreeMetricOneCateScatter: jest
    .fn()
    .mockReturnValue('three-metric-one-cate-scatter-expression'),
}));

jest.mock('./gauge/to_expression', () => ({
  createGauge: jest.fn().mockReturnValue('single-metric-gauge-expression'),
}));

jest.mock('./metric/to_expression', () => ({
  createSingleMetric: jest.fn().mockReturnValue('single-metric-expression'),
}));

jest.mock('./bar/to_expression', () => ({
  createBarSpec: jest.fn().mockReturnValue('bar-chart-expression'),
  createStackedBarSpec: jest.fn().mockReturnValue('stacked-bar-chart-expression'),
  createTimeBarChart: jest.fn().mockReturnValue('time-bar-chart-expression'),
  createGroupedTimeBarChart: jest.fn().mockReturnValue('grouped-time-bar-chart-expression'),
  createFacetedTimeBarChart: jest.fn().mockReturnValue('faceted-time-bar-chart-expression'),
}));

jest.mock('./area/to_expression', () => ({
  createSimpleAreaChart: jest.fn().mockReturnValue('simple-area-chart-expression'),
  createMultiAreaChart: jest.fn().mockReturnValue('multi-area-chart-expression'),
  createFacetedMultiAreaChart: jest.fn().mockReturnValue('faceted-multi-area-chart-expression'),
  createStackedAreaChart: jest.fn().mockReturnValue('stacked-area-chart-expression'),
  createCategoryAreaChart: jest.fn().mockReturnValue('category-area-chart-expression'),
}));

describe('rule_repository', () => {
  // Helper function to create test columns
  const createTestColumns = (
    numNumerical: number,
    numCategorical: number,
    numDate: number
  ): {
    numericalColumns: VisColumn[];
    categoricalColumns: VisColumn[];
    dateColumns: VisColumn[];
  } => {
    const numericalColumns: VisColumn[] = Array.from({ length: numNumerical }, (_, i) => ({
      id: i,
      name: `value${i + 1}`,
      schema: VisFieldType.Numerical,
      column: `field-${i}`,
      validValuesCount: 1,
      uniqueValuesCount: 1,
    }));

    const categoricalColumns: VisColumn[] = Array.from({ length: numCategorical }, (_, i) => ({
      id: numNumerical + i,
      name: `category${i + 1}`,
      schema: VisFieldType.Categorical,
      column: `field-${numNumerical + i}`,
      validValuesCount: 1,
      uniqueValuesCount: 1,
    }));

    const dateColumns: VisColumn[] = Array.from({ length: numDate }, (_, i) => ({
      id: numNumerical + numCategorical + i,
      name: `date${i + 1}`,
      schema: VisFieldType.Date,
      column: `field-${numNumerical + numCategorical + i}`,
      validValuesCount: 1,
      uniqueValuesCount: 1,
    }));

    return { numericalColumns, categoricalColumns, dateColumns };
  };

  // Sample transformed data for testing
  const transformedData = [{ 'field-0': '2023-01-01', 'field-1': 100, 'field-2': 'Category A' }];
  const styleOptions = { showLine: true };

  describe('ALL_VISUALIZATION_RULES', () => {
    it('should export an array of visualization rules', () => {
      expect(Array.isArray(ALL_VISUALIZATION_RULES)).toBe(true);
      expect(ALL_VISUALIZATION_RULES.length).toBeGreaterThan(0);
    });

    it('should have unique rule IDs', () => {
      const ruleIds = ALL_VISUALIZATION_RULES.map((rule) => rule.id);
      const uniqueRuleIds = [...new Set(ruleIds)];
      expect(ruleIds.length).toBe(uniqueRuleIds.length);
    });
  });

  describe('oneMetricOneDateRule', () => {
    // Find the rule by ID
    const rule = ALL_VISUALIZATION_RULES.find((r) => r.id === 'one-metric-one-date');

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should match 1 metric and 1 date', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 0, 1);
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe('EXACT_MATCH');
    });

    it('should not match other combinations', () => {
      // 2 metrics, 0 categories, 1 date
      const test1 = createTestColumns(2, 0, 1);
      expect(
        rule?.matches(test1.numericalColumns, test1.categoricalColumns, test1.dateColumns)
      ).toBe('COMPATIBLE_MATCH');

      // 1 metric, 1 category, 1 date
      const test2 = createTestColumns(1, 1, 1);
      expect(
        rule?.matches(test2.numericalColumns, test2.categoricalColumns, test2.dateColumns)
      ).toBe('COMPATIBLE_MATCH');

      // 1 metric, 0 categories, 2 dates
      const test3 = createTestColumns(1, 0, 2);
      expect(
        rule?.matches(test3.numericalColumns, test3.categoricalColumns, test3.dateColumns)
      ).toBe('COMPATIBLE_MATCH');

      // 1 metric, 1 categories, 0 date
      const test4 = createTestColumns(1, 1, 0);
      expect(
        rule?.matches(test4.numericalColumns, test4.categoricalColumns, test4.dateColumns)
      ).toBe('NOT_MATCH');
    });

    it('should create a simple line chart expression by default', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 0, 1);
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions
      );

      expect(expression).toBe('simple-line-chart-expression');

      // Verify the createSimpleLineChart function was called with the correct arguments
      expect(createSimpleLineChart).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        dateColumns,
        styleOptions,
        undefined
      );
    });
  });

  describe('twoMetricOneDateRule', () => {
    // Find the rule by ID
    const rule = ALL_VISUALIZATION_RULES.find((r) => r.id === 'two-metric-one-date');

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should match 2 metrics and 1 date', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(2, 0, 1);
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe('EXACT_MATCH');
    });

    it('should create a line bar chart expression by default', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(2, 0, 1);
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions
      );

      expect(expression).toBe('line-bar-chart-expression');

      // Verify the createLineBarChart function was called with the correct arguments
      expect(createLineBarChart).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        dateColumns,
        styleOptions,
        undefined
      );
    });
  });

  describe('oneMetricOneCateOneDateRule', () => {
    // Find the rule by ID
    const rule = ALL_VISUALIZATION_RULES.find((r) => r.id === 'one-metric-one-category-one-date');

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should match 1 metric, 1 category, and 1 date', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 1, 1);
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe('EXACT_MATCH');
    });

    it('should create a multi line chart expression by default', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 1, 1);
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions
      );
      expect(expression).toBe('multi-line-chart-expression');
      expect(createMultiLineChart).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        undefined
      );
    });
  });

  describe('oneMetricTwoCateOneDateRule', () => {
    // Find the rule by ID
    const rule = ALL_VISUALIZATION_RULES.find((r) => r.id === 'one-metric-two-category-one-date');

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should match 1 metric, 2 categories, and 1 date', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 2, 1);
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe('EXACT_MATCH');
    });

    it('should create a faceted multi line chart expression by default', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 2, 1);
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions
      );

      expect(expression).toBe('faceted-multi-line-chart-expression');

      // Verify the createFacetedMultiLineChart function was called with the correct arguments
      expect(createFacetedMultiLineChart).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        undefined
      );
    });
  });

  describe('oneMetricTwoCateHighCardRule', () => {
    // Find the rule by ID
    const rule = ALL_VISUALIZATION_RULES.find(
      (r) => r.id === 'one-metric-two-category-high-cardinality'
    );

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should match 1 metric, 2 categories with high cardinality, and 0 dates', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 2, 0);
      // Modify one of the columns to have high cardinality
      categoricalColumns[0].uniqueValuesCount = 10;
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe('EXACT_MATCH');
    });

    it('should not match with low cardinality', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 2, 0);
      // All columns have low cardinality
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe(
        'COMPATIBLE_MATCH'
      );
    });

    it('should create a regular heatmap expression by default', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 2, 0);
      categoricalColumns[0].uniqueValuesCount = 10;
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions
      );

      expect(expression).toBe('regular-heatmap-expression');
      expect(createRegularHeatmap).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        styleOptions,
        undefined
      );
    });

    it('should create a stacked bar chart expression when chart type is bar', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 2, 0);
      categoricalColumns[0].uniqueValuesCount = 10;
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        'bar'
      );

      expect(expression).toBe('stacked-bar-chart-expression');
      expect(createStackedBarSpec).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        undefined
      );
    });
  });

  describe('oneMetricOneCateRule', () => {
    // Find the rule by ID
    const rule = ALL_VISUALIZATION_RULES.find((r) => r.id === 'one-metric-one-category');

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should match 1 metric, 1 category, and 0 dates', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 1, 0);
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe('EXACT_MATCH');
    });

    it('should create a pie chart expression by default', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 1, 0);
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions
      );

      expect(expression).toBe('pie-chart-expression');
      expect(createPieSpec).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        undefined
      );
    });

    it('should create a bar chart expression when chart type is bar', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 1, 0);
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        'bar'
      );

      expect(expression).toBe('bar-chart-expression');
      expect(createBarSpec).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        undefined
      );
    });

    it('should create a pie chart expression when chart type is pie', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 1, 0);
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        'pie'
      );

      expect(expression).toBe('pie-chart-expression');
      expect(createPieSpec).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        undefined
      );
    });
  });

  describe('oneMetricRule', () => {
    // Find the rule by ID
    const rule = ALL_VISUALIZATION_RULES.find((r) => r.id === 'one-metric');

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should match 1 metric with validValuesCount=1, 0 categories, and 0 dates', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 0, 0);
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe('EXACT_MATCH');
    });

    it('should create a single metric expression', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 0, 0);
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions
      );

      expect(expression).toBe('single-metric-expression');
      expect(createSingleMetric).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        undefined
      );
    });
  });

  describe('twoMetricRule', () => {
    // Find the rule by ID
    const rule = ALL_VISUALIZATION_RULES.find((r) => r.id === 'two-metric');

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should match 2 metrics, 0 categories, and 0 dates', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(2, 0, 0);
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe('EXACT_MATCH');
    });

    it('should create a scatter chart expression', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(2, 0, 0);
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions
      );

      expect(expression).toBe('two-metric-scatter-expression');
      expect(createTwoMetricScatter).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        undefined
      );
    });
  });

  describe('twoMetricOneCateRule', () => {
    // Find the rule by ID
    const rule = ALL_VISUALIZATION_RULES.find((r) => r.id === 'two-metric-one-category');

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should match 2 metrics, 1 category, and 0 dates', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(2, 1, 0);
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe('EXACT_MATCH');
    });

    it('should create a scatter chart with category expression', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(2, 1, 0);
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions
      );

      expect(expression).toBe('two-metric-one-cate-scatter-expression');
      expect(createTwoMetricOneCateScatter).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        undefined
      );
    });
  });

  describe('threeMetricOneCateRule', () => {
    // Find the rule by ID
    const rule = ALL_VISUALIZATION_RULES.find((r) => r.id === 'three-metric-one-category');

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should match 3 metrics, 1 category, and 0 dates', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(3, 1, 0);
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe('EXACT_MATCH');
    });

    it('should create a scatter chart with three metrics and one category expression', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(3, 1, 0);
      const expression = rule?.toSpec?.(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions
      );

      expect(expression).toBe('three-metric-one-cate-scatter-expression');
      expect(createThreeMetricOneCateScatter).toHaveBeenCalledWith(
        transformedData,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        styleOptions,
        undefined
      );
    });
  });
});
