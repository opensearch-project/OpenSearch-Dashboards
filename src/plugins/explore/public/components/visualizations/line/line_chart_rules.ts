/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationRule } from '../types';
import { createLineConfig } from './line_vis_config';

export const lineChartRule: VisualizationRule = {
  name: 'lineChart',
  matches: (numericalColumns, categoricalColumns, dateColumns) => {
    return (
      (numericalColumns.length === 1 && dateColumns.length === 1) || // Rule 1
      (numericalColumns.length === 2 && dateColumns.length === 1) || // Rule 2
      (numericalColumns.length === 1 &&
        categoricalColumns.length === 1 &&
        dateColumns.length === 1) || // Rule 3
      (numericalColumns.length === 1 && categoricalColumns.length === 2 && dateColumns.length === 1) // Rule 4
    );
  },
  createConfig: () => createLineConfig(),
};
