/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEqual } from 'lodash';
import { createLineConfig } from './line/line_vis_config';
import { createHeatmapConfig } from './heatmap/heatmap_vis_config';
import { createScatterConfig } from './scatter/scatter_vis_config';
import { createMetricConfig } from './metric/metric_vis_config';
import { createPieConfig } from './pie/pie_vis_config';
import { createAreaConfig } from './area/area_vis_config';
import { ALL_VISUALIZATION_RULES } from './rule_repository';
import {
  AxisColumnMappings,
  ChartMetadata,
  ChartTypeMapping,
  VisColumn,
  VisFieldType,
  VisualizationRule,
} from './types';
import { createBarConfig } from './bar/bar_vis_config';
import { getColumnMatchFromMapping } from './visualization_container_utils';
import { createTableConfig } from './table/table_vis_config';
import { ChartType } from './utils/use_visualization_types';

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
      const mappingObj = this.getDefaultAxesMapping(
        bestMatch.rule,
        bestMatch.chartType.type,
        numericalColumns,
        categoricalColumns,
        dateColumns
      );
      return {
        visualizationType: this.getVisualizationConfig(bestMatch.chartType.type),
        numericalColumns,
        categoricalColumns,
        dateColumns,
        ruleId: bestMatch.rule.id,
        availableChartTypes: bestMatch.rule.chartTypes,
        toExpression: bestMatch.rule.toExpression,
        axisColumnMappings: mappingObj,
      };
    }

    // Render empty state for the user to manually select the columns
    return {
      visualizationType: undefined,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      ruleId: undefined,
      availableChartTypes: [],
      toExpression: undefined,
      axisColumnMappings: {},
    };
  }

  getDefaultAxesMapping(
    rule: VisualizationRule,
    chartTypeName: string,
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[]
  ) {
    const findColumns = (type: VisFieldType) => {
      switch (type) {
        case VisFieldType.Numerical:
          return numericalColumns;
        case VisFieldType.Categorical:
          return categoricalColumns;
        case VisFieldType.Date:
          return dateColumns;
        default:
          return [];
      }
    };

    const possibleMapping = this.getVisualizationConfig(chartTypeName)?.ui.availableMappings;
    const currentlyDisplayedMapping = possibleMapping?.find(({ mapping }) =>
      isEqual(getColumnMatchFromMapping(mapping), rule.matchIndex)
    );
    return currentlyDisplayedMapping
      ? (Object.fromEntries(
          Object.entries(currentlyDisplayedMapping!.mapping[0]).map(([role, config]) => [
            role,
            config && findColumns(config.type)[config.index],
          ])
        ) as AxisColumnMappings)
      : {};
  }

  /**
   * Get all available chart types based on registered rules
   */
  getAvailableChartTypes() {
    const availableChartTypes: ChartMetadata[] = [];
    for (const rule of this.rules) {
      for (const chartType of rule.chartTypes) {
        if (availableChartTypes.every((t) => t.type !== chartType.type)) {
          availableChartTypes.push({
            type: chartType.type,
            name: chartType.name,
            icon: chartType.icon,
          });
        }
      }
    }
    return availableChartTypes;
  }

  /**
   * Find the best matching rule and visualization type based on priorities.
   */
  public findBestMatch(
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[],
    chartType?: ChartType
  ): { rule: VisualizationRule; chartType: ChartTypeMapping } | null {
    let bestMatch: { rule: VisualizationRule; chartType: ChartTypeMapping } | null = null;
    let highestPriority = -1;

    for (const rule of this.rules) {
      if (rule.matches(numericalColumns, categoricalColumns, dateColumns)) {
        // If the rule has a dynamic chart types function, we would handle it here
        // This is a placeholder for future functionality

        // Get the highest priority chart type from this rule
        const topChartType = chartType
          ? rule.chartTypes.find((t) => t.type === chartType)
          : rule.chartTypes[0];

        if (topChartType && topChartType.priority > highestPriority) {
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
  public getVisualizationConfig(type: string) {
    switch (type) {
      case 'line':
        return createLineConfig();
      case 'heatmap':
        return createHeatmapConfig();
      case 'pie':
        return createPieConfig();
      case 'scatter':
        return createScatterConfig();
      case 'metric':
        return createMetricConfig();
      case 'bar':
        return createBarConfig();
      case 'area':
        return createAreaConfig();
      case 'table':
        return createTableConfig();
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
