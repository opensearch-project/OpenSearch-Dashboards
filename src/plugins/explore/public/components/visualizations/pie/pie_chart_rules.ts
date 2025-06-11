/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationRule } from '../types';
import { createPieConfig } from './pie_vis_config';

// for pie chart
// match rule: 1 Metric & 1 Dimension

export const pieChartRule: VisualizationRule = {
  name: 'pieChart',
  matches: (numericalColumns, categoricalColumns, dateColumns) => {
    return (
      numericalColumns.length === 1 && categoricalColumns.length === 1 && dateColumns.length === 0
    );
  },
  createConfig: () => createPieConfig(),
};
