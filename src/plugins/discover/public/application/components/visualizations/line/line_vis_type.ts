/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Positions } from '../../../../../../vis_type_vislib/public';
import { VisualizationType } from '../../../view_components/utils/use_visualization_types';
import { LineVisStyleControls } from './line_vis_options';
import { toExpression } from './to_expression';

export interface LineOptionsDefaults {
  type: 'line';
}

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

export const createLineConfig = (): VisualizationType<LineOptionsDefaults> => ({
  name: 'line',
  title: 'Line',
  icon: 'visLine',
  description: 'Display line chart',
  toExpression,
  ui: {
    style: {
      defaults: defaultLineChartStyles,
      render: LineVisStyleControls,
    },
  },
});
