/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationRule } from '../types';
import { createMetricConfig } from './metric_vis_config';

// for metric chart
// match rule: 1 Metric

export const metricChartRule: VisualizationRule = {
  name: 'metricChart',
  matches: (numericalColumns, categoricalColumns, dateColumns) => {
    return (
      numericalColumns.length === 1 && categoricalColumns.length === 0 && dateColumns.length === 0
    );
  },
  createConfig: () => createMetricConfig(),
};
