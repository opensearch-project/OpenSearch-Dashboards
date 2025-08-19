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
        { type: 'line', priority: 100, name: 'Line Chart', icon: '' },
        { type: 'bar', priority: 90, name: 'Bar Chart', icon: '' },
      ],
      toSpec: jest.fn(),
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
        chartTypes: [{ type: 'bar', priority: 100, name: 'Bar Chart', icon: '' }],
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
    it('should return an object with undefined visualizationType if no rule matches', () => {
      (mockRule.matches as jest.Mock).mockReturnValue('NOT_MATCH');
      registry.registerRule(mockRule);

      const columns: VisColumn[] = [
        {
          id: 1,
          name: 'value',
          schema: VisFieldType.Numerical,
          column: 'field-1',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
      ];

      const result = registry.findBestMatch(columns, [], []);
      expect(result).toBe(null);
      expect(mockRule.matches).toHaveBeenCalled();
    });

    it('should return the visualization type if a rule matches', () => {
      (mockRule.matches as jest.Mock).mockReturnValue('EXACT_MATCH');
      registry.registerRule(mockRule);

      const columns: VisColumn[] = [
        {
          id: 0,
          name: 'date',
          schema: VisFieldType.Date,
          column: 'field-0',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
        {
          id: 1,
          name: 'value',
          schema: VisFieldType.Numerical,
          column: 'field-1',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
        {
          id: 2,
          name: 'category',
          schema: VisFieldType.Categorical,
          column: 'field-2',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
      ];

      const result = registry.findBestMatch(
        columns.filter((c) => c.schema === VisFieldType.Numerical),
        columns.filter((c) => c.schema === VisFieldType.Categorical),
        columns.filter((c) => c.schema === VisFieldType.Date)
      );

      expect(result).toBeDefined();
      expect(result?.rule.id).toBe('test-rule');
      expect(result?.chartType.type).toBe('line');
      expect(result?.rule.chartTypes).toBe(mockRule.chartTypes);
      expect(result?.rule.toSpec).toBe(mockRule.toSpec);
    });

    it('should select the rule with the highest priority chart type', () => {
      const lowPriorityRule = {
        id: 'low-priority-rule',
        name: 'Low Priority Rule',
        matches: jest.fn().mockReturnValue('EXACT_MATCH'),
        chartTypes: [{ type: 'bar', priority: 50, name: 'Bar Chart', icon: '' }],
        toExpression: jest.fn(),
      };

      const highPriorityRule = {
        id: 'high-priority-rule',
        name: 'High Priority Rule',
        matches: jest.fn().mockReturnValue('EXACT_MATCH'),
        chartTypes: [{ type: 'line', priority: 100, name: 'Line Chart', icon: '' }],
        toExpression: jest.fn(),
      };

      registry.registerRules([lowPriorityRule, highPriorityRule]);

      const columns: VisColumn[] = [
        {
          id: 1,
          name: 'value',
          schema: VisFieldType.Numerical,
          column: 'field-1',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
      ];

      const result = registry.findBestMatch(columns, [], []);

      expect(result?.rule.id).toBe('high-priority-rule');
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
