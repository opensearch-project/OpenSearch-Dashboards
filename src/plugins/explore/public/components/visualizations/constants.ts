/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OPENSEARCH_FIELD_TYPES, OSD_FIELD_TYPES, PPL_FIELD_TYPES } from '../../../../data/common';
import { ChartMetadata, VisFieldType } from './types';
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
  gauge: { type: 'gauge', name: 'Gauge', icon: 'visGauge' },
  state_timeline: { type: 'state_timeline', name: 'State timeline', icon: 'visBarHorizontal' },
  bar_gauge: { type: 'bar_gauge', name: 'Bar Gauge', icon: 'visBarHorizontal' },
};

// Map both OSD_FIELD_TYPES and OPENSEARCH_FIELD_TYPES to VisFieldType
// We also need to handle the case where a new field is created with a opensearch type
export const FIELD_TYPE_MAP: Partial<Record<string, VisFieldType>> = {
  // Map OSD_FIELD_TYPES to VisFieldType
  [OSD_FIELD_TYPES.BOOLEAN]: VisFieldType.Categorical,
  [OSD_FIELD_TYPES.DATE]: VisFieldType.Date,
  [OSD_FIELD_TYPES.NUMBER]: VisFieldType.Numerical,
  [OSD_FIELD_TYPES.STRING]: VisFieldType.Categorical,
  [OSD_FIELD_TYPES.OBJECT]: VisFieldType.Unknown,
  [OSD_FIELD_TYPES.NESTED]: VisFieldType.Unknown,
  [OSD_FIELD_TYPES.HISTOGRAM]: VisFieldType.Numerical,
  [OSD_FIELD_TYPES.UNKNOWN]: VisFieldType.Unknown,

  // Map the rest of OPENSEARCH_FIELD_TYPES to VisFieldType
  [OPENSEARCH_FIELD_TYPES.DATE_NANOS]: VisFieldType.Date,
  [OPENSEARCH_FIELD_TYPES.FLOAT]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.HALF_FLOAT]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.SCALED_FLOAT]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.DOUBLE]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.INTEGER]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.INT]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.LONG]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.SHORT]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.UNSIGNED_LONG]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.TEXT]: VisFieldType.Categorical,
  [OPENSEARCH_FIELD_TYPES.KEYWORD]: VisFieldType.Categorical,
  [OPENSEARCH_FIELD_TYPES.WILDCARD]: VisFieldType.Categorical,

  // Map rest of PPL_FIELD_TYPES to VisFieldType
  [PPL_FIELD_TYPES.TINYINT]: VisFieldType.Numerical,
  [PPL_FIELD_TYPES.SMALLINT]: VisFieldType.Numerical,
  [PPL_FIELD_TYPES.BIGINT]: VisFieldType.Numerical,
  [PPL_FIELD_TYPES.TIMESTAMP]: VisFieldType.Date,
  [PPL_FIELD_TYPES.TIME]: VisFieldType.Date,
  [PPL_FIELD_TYPES.INTERVAL]: VisFieldType.Unknown,
  [PPL_FIELD_TYPES.IP]: VisFieldType.Unknown,
  [PPL_FIELD_TYPES.GEO_POINT]: VisFieldType.Unknown,
  [PPL_FIELD_TYPES.BINARY]: VisFieldType.Unknown,
  [PPL_FIELD_TYPES.STRUCT]: VisFieldType.Unknown,
  [PPL_FIELD_TYPES.ARRAY]: VisFieldType.Unknown,
};

export const DEFAULT_OPACITY = 0.87;
export const AXIS_LABEL_MAX_LENGTH = 100;
