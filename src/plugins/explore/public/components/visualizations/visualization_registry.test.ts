/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationRegistry } from './visualization_registry';
import { VisColumn, VisFieldType, VisualizationRule } from './types';

// Mock the line config
jest.mock('./line/line_vis_config', () => ({
  createLineConfig: jest.fn().mockReturnValue({
    name: 'line',
    type: 'line',
    ui: {
      style: {
        defaults: {
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
        },
        render: jest.fn(),
      },
    },
  }),
}));

// Mock the rule repository
jest.mock('./rule_repository', () => ({
  ALL_VISUALIZATION_RULES: [],
}));

describe('VisualizationRegistry', () => {
  let registry: VisualizationRegistry;
  let mockRule: VisualizationRule;

  beforeEach(() => {
    // Create a mock rule
    mockRule = {
      id: 'test-rule',
      name: 'Test Rule',
      matches: jest.fn(),
      chartTypes: [
        { type: 'line', priority: 100, name: 'Line Chart' },
        { type: 'bar', priority: 90, name: 'Bar Chart' },
      ],
      toExpression: jest.fn(),
    };

    // Create a new registry instance for each test
    registry = new VisualizationRegistry([]);
  });

  describe('registerRule', () => {
    it('should register a new rule', () => {
      registry.registerRule(mockRule);
      expect(registry.getRules()).toContain(mockRule);
      expect(registry.getRules().length).toBe(1);
    });

    it('should replace an existing rule with the same ID', () => {
      registry.registerRule(mockRule);

      const updatedRule = {
        ...mockRule,
        chartTypes: [{ type: 'bar', priority: 100, name: 'Bar Chart' }],
      };

      registry.registerRule(updatedRule);

      expect(registry.getRules().length).toBe(1);
      expect(registry.getRules()[0]).toBe(updatedRule);
    });
  });

  describe('registerRules', () => {
    it('should register multiple rules', () => {
      const anotherRule = {
        ...mockRule,
        id: 'another-rule',
      };

      registry.registerRules([mockRule, anotherRule]);

      expect(registry.getRules()).toContain(mockRule);
      expect(registry.getRules()).toContain(anotherRule);
      expect(registry.getRules().length).toBe(2);
    });
  });

  describe('getVisualizationType', () => {
    it('should return undefined if no rule matches', () => {
      (mockRule.matches as jest.Mock).mockReturnValue(false);
      registry.registerRule(mockRule);

      const columns: VisColumn[] = [
        { id: 1, name: 'value', schema: VisFieldType.Numerical, column: 'field-1' },
      ];

      const result = registry.getVisualizationType(columns);

      expect(result).toBeUndefined();
      expect(mockRule.matches).toHaveBeenCalled();
    });

    it('should return the visualization type if a rule matches', () => {
      (mockRule.matches as jest.Mock).mockReturnValue(true);
      registry.registerRule(mockRule);

      const columns: VisColumn[] = [
        { id: 0, name: 'date', schema: VisFieldType.Date, column: 'field-0' },
        { id: 1, name: 'value', schema: VisFieldType.Numerical, column: 'field-1' },
        { id: 2, name: 'category', schema: VisFieldType.Categorical, column: 'field-2' },
      ];

      const result = registry.getVisualizationType(columns);

      expect(result).toBeDefined();
      expect(result?.ruleId).toBe('test-rule');
      expect(result?.visualizationType).toBeDefined();
      expect(result?.visualizationType?.type).toBe('line');
      expect(result?.numericalColumns).toHaveLength(1);
      expect(result?.categoricalColumns).toHaveLength(1);
      expect(result?.dateColumns).toHaveLength(1);
      expect(result?.availableChartTypes).toBe(mockRule.chartTypes);
      expect(result?.toExpression).toBe(mockRule.toExpression);
    });

    it('should select the rule with the highest priority chart type', () => {
      const lowPriorityRule = {
        id: 'low-priority-rule',
        name: 'Low Priority Rule',
        matches: jest.fn().mockReturnValue(true),
        chartTypes: [{ type: 'bar', priority: 50, name: 'Bar Chart' }],
        toExpression: jest.fn(),
      };

      const highPriorityRule = {
        id: 'high-priority-rule',
        name: 'High Priority Rule',
        matches: jest.fn().mockReturnValue(true),
        chartTypes: [{ type: 'line', priority: 100, name: 'Line Chart' }],
        toExpression: jest.fn(),
      };

      registry.registerRules([lowPriorityRule, highPriorityRule]);

      const columns: VisColumn[] = [
        { id: 1, name: 'value', schema: VisFieldType.Numerical, column: 'field-1' },
      ];

      const result = registry.getVisualizationType(columns);

      expect(result?.ruleId).toBe('high-priority-rule');
    });

    it('should filter columns by their schema type', () => {
      (mockRule.matches as jest.Mock).mockReturnValue(true);
      registry.registerRule(mockRule);

      const columns: VisColumn[] = [
        { id: 0, name: 'date', schema: VisFieldType.Date, column: 'field-0' },
        { id: 1, name: 'value1', schema: VisFieldType.Numerical, column: 'field-1' },
        { id: 2, name: 'value2', schema: VisFieldType.Numerical, column: 'field-2' },
        { id: 3, name: 'category1', schema: VisFieldType.Categorical, column: 'field-3' },
        { id: 4, name: 'category2', schema: VisFieldType.Categorical, column: 'field-4' },
        { id: 5, name: 'unknown', schema: VisFieldType.Unknown, column: 'field-5' },
      ];

      const result = registry.getVisualizationType(columns);
      expect(result?.numericalColumns).toHaveLength(2);
      expect(result?.categoricalColumns).toHaveLength(2);
      expect(result?.dateColumns).toHaveLength(1);

      // Verify that the matches function was called with the correct column arrays
      expect(mockRule.matches).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 1, schema: VisFieldType.Numerical }),
          expect.objectContaining({ id: 2, schema: VisFieldType.Numerical }),
        ]),
        expect.arrayContaining([
          expect.objectContaining({ id: 3, schema: VisFieldType.Categorical }),
          expect.objectContaining({ id: 4, schema: VisFieldType.Categorical }),
        ]),
        expect.arrayContaining([expect.objectContaining({ id: 0, schema: VisFieldType.Date })])
      );
    });
  });

  describe('getRules', () => {
    it('should return a copy of the rules array', () => {
      registry.registerRule(mockRule);

      const rules = registry.getRules();

      expect(rules).toContain(mockRule);

      // Modifying the returned array should not affect the registry
      rules.pop();

      expect(registry.getRules().length).toBe(1);
    });
  });
});
