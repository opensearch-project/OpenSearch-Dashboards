/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CHART_METADATA } from '../constants';
import { ChartType } from './use_visualization_types';

export function isChartType(type: string): type is ChartType {
  if (type in CHART_METADATA) {
    return true;
  }
  return false;
}
