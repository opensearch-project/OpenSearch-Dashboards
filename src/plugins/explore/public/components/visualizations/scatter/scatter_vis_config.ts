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
  TitleOptions,
  ThresholdMode,
  ThresholdOptions,
} from '../types';
import { getColors } from '../theme/default_colors';

export interface ExclusiveScatterConfig {
  pointShape: PointShape;
  angle: number;
  filled: boolean;
}
// Complete line chart style controls interface
export interface ScatterChartStyleOptions {
  // Basic controls
  tooltipOptions?: TooltipOptions;
  addLegend?: boolean;
  legendPosition?: Positions;
  // @deprecated - removed this once migrated to echarts
  legendTitle?: string;
  // @deprecated - removed this once migrated to echarts
  legendTitleForSize?: string;
  // Axes configuration
  standardAxes?: StandardAxes[];

  exclusive?: ExclusiveScatterConfig;
  switchAxes?: boolean;

  titleOptions?: TitleOptions;

  useThresholdColor?: boolean;
  thresholdOptions?: ThresholdOptions;
}

export type ScatterChartStyle = Required<
  Omit<ScatterChartStyleOptions, 'legendTitle' | 'legendTitleForSize'>
> &
  Pick<ScatterChartStyleOptions, 'legendTitle' | 'legendTitleForSize'>;

export const defaultScatterChartStyles: ScatterChartStyle = {
  // Basic controls
  tooltipOptions: {
    mode: 'all',
  },
  addLegend: true,
  legendTitle: '',
  legendPosition: Positions.BOTTOM,

  // exclusive
  exclusive: {
    pointShape: PointShape.CIRCLE,
    angle: 0,
    filled: true,
  },

  useThresholdColor: false,
  // Threshold options
  thresholdOptions: {
    baseColor: getColors().statusGreen,
    thresholds: [],
    thresholdStyle: ThresholdMode.Off,
  },
  standardAxes: [],
  switchAxes: false,
  titleOptions: {
    show: false,
    titleName: '',
  },
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
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 1 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 1 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.SIZE]: { type: VisFieldType.Numerical, index: 2 },
      },
    ],
  },
});
