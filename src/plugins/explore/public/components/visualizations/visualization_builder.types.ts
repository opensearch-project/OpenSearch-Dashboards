/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisFieldNameMappings, VisColumn } from './types';
import { ChartType, StyleOptions } from './utils/use_visualization_types';
import { UrlTransformationState } from '../data_transformations/types';

export type SplitLayout = 'auto' | 'horizontal' | 'vertical';

export interface VisData {
  transformedData: Array<Record<string, any>>;
  dateColumns: VisColumn[];
  numericalColumns: VisColumn[];
  categoricalColumns: VisColumn[];
  unknownColumns: VisColumn[];
}

export interface SplitConfig {
  splitField?: string;
  splitLayout?: SplitLayout;
  showSplitLabel?: boolean;
}

export interface ChartConfig extends SplitConfig {
  type: ChartType;
  styles?: StyleOptions;
  axesMapping?: AxisFieldNameMappings;
  dataTransformations?: UrlTransformationState[];
}
