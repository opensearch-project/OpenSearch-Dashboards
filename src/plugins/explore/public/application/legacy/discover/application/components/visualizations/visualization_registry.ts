/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreVisColumn, VisualizationRule } from './types';

export class VisualizationRegistry {
  private rules: VisualizationRule[] = [];

  /**
   * Register a new visualization rule.
   */
  registerRule(rule: VisualizationRule) {
    this.rules.push(rule);
  }

  /**
   * Get the matching visualization type based on the columns.
   */
  getVisualizationType(columns: ExploreVisColumn[]) {
    const numericalColumns = columns.filter((column) => column.schema === 'numerical');
    const categoricalColumns = columns.filter((column) => column.schema === 'categorical');
    const dateColumns = columns.filter((column) => column.schema === 'date');
    for (const rule of this.rules) {
      if (rule.matches(numericalColumns, categoricalColumns, dateColumns)) {
        return {
          visualizationType: rule.createConfig(),
          numericalColumns,
          categoricalColumns,
          dateColumns,
        };
      }
    }

    // Todo: Handle the case where no rule matches
    console.log('No matching visualization type found');
    return;
  }
}

// Create a singleton instance of the registry
export const visualizationRegistry = new VisualizationRegistry();
