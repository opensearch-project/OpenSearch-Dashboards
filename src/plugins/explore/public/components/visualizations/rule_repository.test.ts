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

// Mock the line chart expression functions
jest.mock('./line/to_expression', () => ({
  createSimpleLineChart: jest.fn().mockReturnValue('simple-line-chart-expression'),
  createLineBarChart: jest.fn().mockReturnValue('line-bar-chart-expression'),
  createMultiLineChart: jest.fn().mockReturnValue('multi-line-chart-expression'),
  createFacetedMultiLineChart: jest.fn().mockReturnValue('faceted-multi-line-chart-expression'),
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
    }));

    const categoricalColumns: VisColumn[] = Array.from({ length: numCategorical }, (_, i) => ({
      id: numNumerical + i,
      name: `category${i + 1}`,
      schema: VisFieldType.Categorical,
      column: `field-${numNumerical + i}`,
    }));

    const dateColumns: VisColumn[] = Array.from({ length: numDate }, (_, i) => ({
      id: numNumerical + numCategorical + i,
      name: `date${i + 1}`,
      schema: VisFieldType.Date,
      column: `field-${numNumerical + numCategorical + i}`,
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
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe(true);
    });

    it('should not match other combinations', () => {
      // 2 metrics, 0 categories, 1 date
      const test1 = createTestColumns(2, 0, 1);
      expect(
        rule?.matches(test1.numericalColumns, test1.categoricalColumns, test1.dateColumns)
      ).toBe(false);

      // 1 metric, 1 category, 1 date
      const test2 = createTestColumns(1, 1, 1);
      expect(
        rule?.matches(test2.numericalColumns, test2.categoricalColumns, test2.dateColumns)
      ).toBe(false);

      // 1 metric, 0 categories, 2 dates
      const test3 = createTestColumns(1, 0, 2);
      expect(
        rule?.matches(test3.numericalColumns, test3.categoricalColumns, test3.dateColumns)
      ).toBe(false);
    });

    it('should create a simple line chart expression by default', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 0, 1);
      const expression = rule?.toExpression?.(
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
        styleOptions
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
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe(true);
    });

    it('should create a line bar chart expression by default', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(2, 0, 1);
      const expression = rule?.toExpression?.(
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
        styleOptions
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
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe(true);
    });

    it('should create a multi line chart expression by default', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 1, 1);
      const expression = rule?.toExpression?.(
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
        styleOptions
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
      expect(rule?.matches(numericalColumns, categoricalColumns, dateColumns)).toBe(true);
    });

    it('should create a faceted multi line chart expression by default', () => {
      const { numericalColumns, categoricalColumns, dateColumns } = createTestColumns(1, 2, 1);
      const expression = rule?.toExpression?.(
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
        styleOptions
      );
    });
  });
});
