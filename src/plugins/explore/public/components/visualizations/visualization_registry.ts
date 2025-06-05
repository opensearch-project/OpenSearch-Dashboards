/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createLineConfig } from './line/line_vis_config';
import { ALL_VISUALIZATION_RULES } from './rule_repository';
import { ChartTypeMapping, VisColumn, VisualizationRule } from './types';

export class VisualizationRegistry {
  private rules: VisualizationRule[] = ALL_VISUALIZATION_RULES;

  /**
   * Get the matching visualization type based on the columns.
   * Currently every time this is called, it will browse all rules and find the best match.
   */
  getVisualizationType(columns: VisColumn[]) {
    const numericalColumns = columns.filter((column) => column.schema === 'numerical');
    const categoricalColumns = columns.filter((column) => column.schema === 'categorical');
    const dateColumns = columns.filter((column) => column.schema === 'date');

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

    // Todo: Handle the case where no rule matches, render empty state or default table visualization
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
   * Manually switch to a different chart type
   */
  private switchChartType(newType: string) {
    // TODO: Implement logic to switch chart type
    // This will be implemented to switch to chart type: ${newType}
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
}

export const visualizationRegistry = new VisualizationRegistry();
