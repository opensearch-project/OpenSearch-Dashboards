/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../../../view_components/utils/use_visualization_types';
import { ScatterVisStyleControls, ScatterVisStyleControlsProps } from './scatter_vis_options';
import { toExpression } from './to_expression';
import { StandardAxes, PointShape, Positions, AxisRole, AxisPosition } from '../types';

export interface ExclusiveScatterConfig {
  pointShape: PointShape;
  angle: number;
  filled: boolean;
}
// Complete line chart style controls interface
export interface ScatterChartStyleControls {
  // Basic controls
  addTooltip: boolean;
  addLegend: boolean;
  legendPosition: Positions;

  // Axes configuration
  StandardAxes: StandardAxes[];

  exclusive: ExclusiveScatterConfig;

  // Additional vis_lib compatibility
  type: string;
}

export const defaultScatterChartStyles: ScatterChartStyleControls = {
  // Basic controls
  addTooltip: true,
  addLegend: true,
  legendPosition: Positions.RIGHT,

  // exclusive
  exclusive: {
    pointShape: PointShape.CIRCLE,
    angle: 0,
    filled: false,
  },

  StandardAxes: [
    {
      id: 'Axis-1',
      position: AxisPosition.BOTTOM,
      show: true,
      style: {},
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: 100,
      },
      title: {
        text: '',
      },
      grid: { showLines: true },
      axisRole: AxisRole.X,
    },
    {
      id: 'Axis-2',
      position: AxisPosition.LEFT,
      show: true,
      style: {},
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: 100,
      },
      title: {
        text: '',
      },
      grid: { showLines: true },
      axisRole: AxisRole.Y,
    },
  ],

  // Additional properties
  type: 'scatter',
};

export const createScatterConfig = (): VisualizationType => ({
  name: 'scatter',
  type: 'scatter',
  toExpression,
  ui: {
    style: {
      defaults: defaultScatterChartStyles,
      render: (props: ScatterVisStyleControlsProps) =>
        React.createElement(ScatterVisStyleControls, props),
    },
  },
});
