/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createLineConfig } from './line/line_vis_config';
import { ALL_VISUALIZATION_RULES } from './rule_repository';
import { ChartTypeMapping, VisColumn, VisFieldType, VisualizationRule } from './types';

/**
 * Registry for visualization rules and configurations.
 * This class is designed to be used as a service that can be accessed by other plugins.
 */
export class VisualizationRegistry {
  private rules: VisualizationRule[] = [];

  constructor(initialRules: VisualizationRule[] = ALL_VISUALIZATION_RULES) {
    this.rules = [...initialRules];
  }

  /**
   * Get the matching visualization type based on the columns.
   * Currently every time this is called, it will browse all rules and find the best match.
   */
  getVisualizationType(columns: VisColumn[]) {
    const numericalColumns = columns.filter((column) => column.schema === VisFieldType.Numerical);
    const categoricalColumns = columns.filter(
      (column) => column.schema === VisFieldType.Categorical
    );
    const dateColumns = columns.filter((column) => column.schema === VisFieldType.Date);

    const bestMatch = this.findBestMatch(numericalColumns, categoricalColumns, dateColumns);

    if (bestMatch) {
      return {
        visualizationType: this.getVisualizationConfig(bestMatch.chartType.type),
        numericalColumns,
        categoricalColumns,
        dateColumns,
        ruleId: bestMatch.rule.id,
        availableChartTypes: bestMatch.rule.chartTypes,
        toExpression: bestMatch.rule.toExpression,
      };
    }

    // TODO: Handle the case where no rule matches, render empty state or default table visualization
    // No matching visualization type found
    return;
  }

  /**
   * Find the best matching rule and visualization type based on prorities.
   */
  private findBestMatch(
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[]
  ): { rule: VisualizationRule; chartType: ChartTypeMapping } | null {
    let bestMatch: { rule: VisualizationRule; chartType: ChartTypeMapping } | null = null;
    let highestPriority = -1;

    for (const rule of this.rules) {
      if (rule.matches(numericalColumns, categoricalColumns, dateColumns)) {
        // Get the highest priority chart type from this rule
        const topChartType = rule.chartTypes[0];

        if (topChartType.priority > highestPriority) {
          highestPriority = topChartType.priority;
          bestMatch = { rule, chartType: topChartType };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Get visualization configuration
   */
  private getVisualizationConfig(type: string) {
    switch (type) {
      case 'line':
        return createLineConfig();
      // TODO: Add other chart types' configs here
      default:
        return;
    }
  }

  /**
   * Register a new visualization rule
   * @param rule The visualization rule to register
   */
  public registerRule(rule: VisualizationRule) {
    // Check if rule with the same ID already exists
    const existingRuleIndex = this.rules.findIndex((r) => r.id === rule.id);
    if (existingRuleIndex >= 0) {
      // Replace the existing rule
      this.rules[existingRuleIndex] = rule;
    } else {
      // Add the new rule
      this.rules.push(rule);
    }
  }

  /**
   * Register multiple visualization rules
   * @param rules The visualization rules to register
   */
  public registerRules(rules: VisualizationRule[]) {
    rules.forEach((rule) => this.registerRule(rule));
  }

  /**
   * Get all registered visualization rules
   */
  public getRules(): VisualizationRule[] {
    return [...this.rules];
  }
}

// Note: This singleton instance is kept for backward compatibility.
// New code should use the VisualizationRegistryService instead.
export const visualizationRegistry = new VisualizationRegistry();
