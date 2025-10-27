/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createLineConfig } from './line/line_vis_config';
import { createHeatmapConfig } from './heatmap/heatmap_vis_config';
import { createScatterConfig } from './scatter/scatter_vis_config';
import { createMetricConfig } from './metric/metric_vis_config';
import { createPieConfig } from './pie/pie_vis_config';
import { createAreaConfig } from './area/area_vis_config';
import { ALL_VISUALIZATION_RULES } from './rule_repository';
import {
  AxisColumnMappings,
  AxisRole,
  ChartMetadata,
  ChartTypeMapping,
  VisColumn,
  VisFieldType,
  VisualizationRule,
} from './types';
import { createBarConfig } from './bar/bar_vis_config';
import { createTableConfig } from './table/table_vis_config';
import { ChartType } from './utils/use_visualization_types';
import { getColumnsByAxesMapping } from './visualization_builder_utils';
import { createGaugeConfig } from './gauge/gauge_vis_config';
import { createStateTimelineConfig } from './state_timeline/state_timeline_config';
import { createBarGaugeConfig } from './bar_gauge/bar_gauge_vis_config';

/**
 * Registry for visualization rules and configurations.
 * This class is designed to be used as a service that can be accessed by other plugins.
 */
export class VisualizationRegistry {
  private rules: VisualizationRule[] = [];

  constructor(initialRules: VisualizationRule[] = ALL_VISUALIZATION_RULES) {
    this.rules = [...initialRules];
  }

  getDefaultAxesMapping(
    rule: VisualizationRule,
    chartTypeName: string,
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[]
  ) {
    const availableMappings =
      this.getVisualizationConfig(chartTypeName)?.ui.availableMappings ?? [];

    for (const mapping of availableMappings) {
      const mappedNumericalColumns: VisColumn[] = [];
      const mappedCategoricalColumns: VisColumn[] = [];
      const mappedDateColumns: VisColumn[] = [];
      const axesColumnMapping: AxisColumnMappings = {};
      Object.entries(mapping).forEach(([role, value]) => {
        if (value.type === VisFieldType.Numerical && numericalColumns[value.index]) {
          mappedNumericalColumns.push(numericalColumns[value.index]);
          axesColumnMapping[role as AxisRole] = numericalColumns[value.index];
        }
        if (value.type === VisFieldType.Categorical && categoricalColumns[value.index]) {
          mappedCategoricalColumns.push(categoricalColumns[value.index]);
          axesColumnMapping[role as AxisRole] = categoricalColumns[value.index];
        }
        if (value.type === VisFieldType.Date && dateColumns[value.index]) {
          mappedDateColumns.push(dateColumns[value.index]);
          axesColumnMapping[role as AxisRole] = dateColumns[value.index];
        }
      });
      const ruleMatchType = rule.matches(
        mappedNumericalColumns,
        mappedCategoricalColumns,
        mappedDateColumns
      );
      if (
        ruleMatchType === 'EXACT_MATCH' &&
        Object.keys(axesColumnMapping).length === Object.keys(mapping).length
      ) {
        return axesColumnMapping;
      }
    }
    return {};
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

  public findRuleByAxesMapping(
    axesMapping: Partial<Record<string, string>>,
    allColumns: VisColumn[]
  ) {
    const { numericalColumns, categoricalColumns, dateColumns } = getColumnsByAxesMapping(
      axesMapping,
      allColumns
    );
    const bestMatch = this.findBestMatch(numericalColumns, categoricalColumns, dateColumns);
    return bestMatch?.rule;
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
      if (rule.matches(numericalColumns, categoricalColumns, dateColumns) === 'EXACT_MATCH') {
        // If the rule has a dynamic chart types function, we would handle it here
        // This is a placeholder for future functionality

        // Get the highest priority chart type from this rule
        const topChartType = chartType
          ? rule.chartTypes.find((t) => t.type === chartType)
          : rule.chartTypes[0]; // TODO: we cannot assume rule.chartTypes[0] is the highest priority chart type of this rule

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
      case 'gauge':
        return createGaugeConfig();
      case 'state_timeline':
        return createStateTimelineConfig();
      case 'bar_gauge':
        return createBarGaugeConfig();
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
// TODO: refactor existing visualizationRegistry to use VisualizationRegistryService
export const visualizationRegistry = new VisualizationRegistry();
