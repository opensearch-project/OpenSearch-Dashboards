/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Positions } from '../../../../../../vis_type_vislib/public';
import { VisualizationType } from '../../../view_components/utils/use_visualization_types';
import { toExpression } from './to_expression';
import { LineVisOptions } from './line_vis_options';

export interface LineOptionsDefaults {
  type: 'line';
}

export const createLineConfig = (): VisualizationType<LineOptionsDefaults> => ({
  name: 'line',
  title: 'Line',
  icon: 'visLine',
  description: 'Display line chart',
  toExpression,
  ui: {
    style: {
      defaults: {
        addTooltip: true,
        addLegend: true,
        legendPosition: Positions.RIGHT,
        type: 'line',
      },
      render: LineVisOptions,
    },
  },
});
