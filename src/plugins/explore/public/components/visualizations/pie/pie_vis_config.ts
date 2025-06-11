/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../../../view_components/utils/use_visualization_types';

import { PieVisStyleControls, PieChartStyleControlsProps } from './pie_vis_options';
import { toExpression } from './to_expression';
import { Positions } from '../types';

export interface PieExclusiveStyleControl {
  donut: boolean;
  showValues: boolean;
  showLabels: boolean;
  truncate: number;
  // Todo:  shall we support 2 layers pie chart?
  showTopLevelOnly?: boolean;
}
export interface PieChartStyleControls {
  // Basic controls
  addTooltip: boolean;
  addLegend: boolean;
  legendPosition: Positions;

  // Exclusive controls
  exclusive: PieExclusiveStyleControl;
}

export const defaultPieChartStyles: PieChartStyleControls = {
  // Basic controls
  addTooltip: true,
  addLegend: true,
  legendPosition: Positions.RIGHT,
  exclusive: {
    donut: true,
    showValues: true,
    showLabels: false,
    truncate: 100,
  },
};

export const createPieConfig = (): VisualizationType => ({
  name: 'pie',
  type: 'pie',
  toExpression,
  ui: {
    style: {
      defaults: defaultPieChartStyles,
      render: (props: PieChartStyleControlsProps) =>
        React.createElement(PieVisStyleControls, props),
    },
  },
});
