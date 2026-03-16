/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisColumn } from './types';
import { ChartType, StyleOptions } from './utils/use_visualization_types';

export interface VisData {
  transformedData: Array<Record<string, any>>;
  dateColumns: VisColumn[];
  numericalColumns: VisColumn[];
  categoricalColumns: VisColumn[];
}

export interface ChartConfig {
  type: ChartType;
  styles?: StyleOptions;
  axesMapping?: Record<string, string>;
}
