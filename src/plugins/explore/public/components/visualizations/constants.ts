/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChartMetadata } from './types';
import { ChartType } from './utils/use_visualization_types';

export const CHART_METADATA: Record<ChartType, ChartMetadata> = {
  line: { type: 'line', name: 'Line', icon: 'visLine' },
  bar: { type: 'bar', name: 'Bar', icon: 'visBarVertical' },
  area: { type: 'area', name: 'Area', icon: 'visArea' },
  pie: { type: 'pie', name: 'Pie', icon: 'visPie' },
  heatmap: { type: 'heatmap', name: 'Heatmap', icon: 'heatmap' },
  metric: { type: 'metric', name: 'Metric', icon: 'visMetric' },
  scatter: { type: 'scatter', name: 'Scatter', icon: '' },
  table: { type: 'table', name: 'Table', icon: 'visTable' },
};
