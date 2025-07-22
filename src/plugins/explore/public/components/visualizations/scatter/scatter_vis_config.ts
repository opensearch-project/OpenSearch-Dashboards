/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { ScatterVisStyleControls } from './scatter_vis_options';
import {
  StandardAxes,
  PointShape,
  AxisRole,
  Positions,
  TooltipOptions,
  VisFieldType,
} from '../types';

export interface ExclusiveScatterConfig {
  pointShape: PointShape;
  angle: number;
  filled: boolean;
}
// Complete line chart style controls interface
export interface ScatterChartStyleControls {
  // Basic controls
  tooltipOptions: TooltipOptions;
  addLegend: boolean;
  legendPosition: Positions;
  // Axes configuration
  standardAxes: StandardAxes[];

  exclusive: ExclusiveScatterConfig;
  switchAxes: boolean;
}

export const defaultScatterChartStyles: ScatterChartStyleControls = {
  // Basic controls
  tooltipOptions: {
    mode: 'all',
  },
  addLegend: true,
  legendPosition: Positions.RIGHT,

  // exclusive
  exclusive: {
    pointShape: PointShape.CIRCLE,
    angle: 0,
    filled: false,
  },
  // Standard axes
  standardAxes: [
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
      grid: {
        showLines: false,
      },
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
      grid: {
        showLines: false,
      },
      axisRole: AxisRole.Y,
    },
  ],
  switchAxes: false,
};

export const createScatterConfig = (): VisualizationType<'scatter'> => ({
  name: 'scatter',
  type: 'scatter',
  ui: {
    style: {
      defaults: defaultScatterChartStyles,
      render: (props) => React.createElement(ScatterVisStyleControls, props),
    },
    availableMappings: [
      {
        mapping: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 1 },
          },
        ],
      },
      {
        mapping: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 1 },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
          },
        ],
      },
      {
        mapping: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 1 },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
            [AxisRole.SIZE]: { type: VisFieldType.Numerical, index: 2 },
          },
        ],
      },
    ],
  },
});
