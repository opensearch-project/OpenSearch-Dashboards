/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationRule } from '../types';
import { createScatterConfig } from './scatter_vis_config';

// rule1: 2 Metrics & 0 Dimension
// rule2: 2 Metrics & 1 Dimension
// rule3: 3 Metrics & 1 Dimension
export const scatterChartRule: VisualizationRule = {
  name: 'scatter',
  matches: (numericalColumns, categoricalColumns, dateColumns) => {
    return (
      (numericalColumns.length === 2 &&
        dateColumns.length === 0 &&
        categoricalColumns.length === 0) ||
      (numericalColumns.length === 2 &&
        dateColumns.length === 0 &&
        categoricalColumns.length === 1) ||
      (numericalColumns.length === 3 && dateColumns.length === 0 && categoricalColumns.length === 1)
    );
  },
  createConfig: () => createScatterConfig(),
};
