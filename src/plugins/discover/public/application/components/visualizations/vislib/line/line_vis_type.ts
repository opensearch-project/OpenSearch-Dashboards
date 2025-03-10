/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationType } from '../../../../view_components/utils/use_visualization_types';
import { toExpression } from './to_expression';

export interface LineOptionsDefaults {
  type: 'line';
}

export const createLineConfig = (): VisualizationType<LineOptionsDefaults> => ({
  name: 'line',
  title: 'Line',
  icon: 'visLine',
  description: 'Display line chart',
  toExpression,
  ui: {},
});
