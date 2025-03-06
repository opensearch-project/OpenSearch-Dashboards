/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { VisualizationType } from '../../../../view_components/utils/use_visualization_type';
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
