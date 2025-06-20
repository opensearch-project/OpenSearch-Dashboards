/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { HeatmapVisStyleControls } from './heatmap_vis_options';
import {
  StandardAxes,
  RangeValue,
  ColorSchemas,
  ScaleType,
  Positions,
  AxisRole,
  LabelAggregationType,
} from '../types';

export interface HeatmapLabels {
  show: boolean;
  rotate: boolean;
  overwriteColor: boolean;
  color: string;
  type?: LabelAggregationType;
}
export interface ExclusiveHeatmapConfig {
  colorSchema: ColorSchemas;
  reverseSchema: boolean;
  colorScaleType: ScaleType;
  scaleToDataBounds: boolean;
  percentageMode: boolean;
  maxNumberOfColors: number;
  useCustomRanges: boolean;
  customRanges?: RangeValue[];
}
// Complete heatmap chart style controls interface
export interface HeatmapChartStyleControls {
  // Basic controls
  addTooltip: boolean;
  addLegend: boolean;
  legendPosition: Positions;

  // Axes configuration
  StandardAxes: StandardAxes[];

  exclusive: ExclusiveHeatmapConfig;
  label: HeatmapLabels;
}

export const defaultHeatmapChartStyles: HeatmapChartStyleControls = {
  // Basic controls
  addTooltip: true,
  addLegend: true,
  legendPosition: Positions.RIGHT,

  // exclusive
  exclusive: {
    colorSchema: ColorSchemas.BLUES,
    reverseSchema: false,
    colorScaleType: ScaleType.LINEAR,
    scaleToDataBounds: false,
    percentageMode: false,
    maxNumberOfColors: 4,
    useCustomRanges: false,
  },
  label: {
    type: LabelAggregationType.SUM,
    show: false,
    rotate: false,
    overwriteColor: false,
    color: 'black',
  },

  // Standard axes
  StandardAxes: [
    {
      id: 'Axis-1',
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
    {
      id: 'Axis-2',
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
  ],
};

export const createHeatmapConfig = (): VisualizationType<'heatmap'> => ({
  name: 'heatmap',
  type: 'heatmap',
  ui: {
    style: {
      defaults: defaultHeatmapChartStyles,
      render: (props) => React.createElement(HeatmapVisStyleControls, props),
    },
  },
});
