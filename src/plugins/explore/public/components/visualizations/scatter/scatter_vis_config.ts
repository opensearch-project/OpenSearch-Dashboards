/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { ScatterVisStyleControls } from './scatter_vis_options';
import { StandardAxes, PointShape, AxisRole, Positions } from '../types';

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

  // Standard axes
  StandardAxes: [
    {
      id: 'Axis-1',
      position: Positions.BOTTOM,
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
      position: Positions.LEFT,
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
};

export const createScatterConfig = (): VisualizationType<'scatter'> => ({
  name: 'scatter',
  type: 'scatter',
  ui: {
    style: {
      defaults: defaultScatterChartStyles,
      render: (props) => React.createElement(ScatterVisStyleControls, props),
    },
  },
});
