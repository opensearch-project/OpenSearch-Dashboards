/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisRole, VisColumn } from '../types';

// TODO: we should use strong typed axis mapping like this for all other types of visualizations
// axisColumnMappings should passed to create*Series function explicitly instead of reading from state
export interface BarGaugeAxisMapping {
  [AxisRole.X]: VisColumn;
  [AxisRole.Y]: VisColumn;
}
