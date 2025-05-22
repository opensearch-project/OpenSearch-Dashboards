/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationType } from '../../../view_components/utils/use_visualization_types';
import { Positions } from '../utils/collections';
import { LineVisStyleControls } from './line_vis_options';
import { toExpression } from './to_expression';
export interface LineChartStyleControls {
  addTooltip: boolean;
  addLegend: boolean;
  legendPosition: Positions;
}

const defaultLineChartStyles: LineChartStyleControls = {
  addTooltip: true,
  addLegend: true,
  legendPosition: Positions.RIGHT,
};

export const createLineConfig = (): VisualizationType => ({
  name: 'line',
  type: 'line',
  toExpression,
  ui: {
    style: {
      defaults: defaultLineChartStyles,
      render: LineVisStyleControls,
    },
  },
});
