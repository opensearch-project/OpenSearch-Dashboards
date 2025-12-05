/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { StateTimeLineVisStyleControls } from './state_timeline_vis_options';
import {
  StandardAxes,
  AxisRole,
  Positions,
  TooltipOptions,
  VisFieldType,
  TitleOptions,
  ValueMappingOptions,
  DisconnectValuesOption,
  ConnectNullValuesOption,
  DisableMode,
  ThresholdOptions,
} from '../types';
import { getColors } from '../theme/default_colors';

export interface ExclusiveStateTimeLineConfig {
  showValues?: boolean;
  rowHeight?: number;
  disconnectValues?: DisconnectValuesOption;
  connectNullValues?: ConnectNullValuesOption;
}
// Complete line chart style controls interface
export interface StateTimeLineChartStyleOptions {
  // Basic controls
  tooltipOptions?: TooltipOptions;
  addLegend?: boolean;
  legendPosition?: Positions;
  legendTitle?: string;
  // Axes configuration
  standardAxes?: StandardAxes[];

  exclusive?: ExclusiveStateTimeLineConfig;

  titleOptions?: TitleOptions;

  valueMappingOptions?: ValueMappingOptions;
  useThresholdColor?: boolean;
  thresholdOptions?: ThresholdOptions;
}

export type StateTimeLineChartStyle = Required<StateTimeLineChartStyleOptions>;

export const defaultStateTimeLineChartStyles: StateTimeLineChartStyle = {
  // Basic controls
  tooltipOptions: {
    mode: 'all',
  },
  addLegend: true,
  legendPosition: Positions.RIGHT,
  legendTitle: '',

  // exclusive
  exclusive: {
    showValues: false,
    rowHeight: 0.8,
    disconnectValues: {
      disableMode: DisableMode.Never,
      threshold: '1h',
    },
    connectNullValues: {
      connectMode: DisableMode.Never,
      threshold: '1h',
    },
  },

  valueMappingOptions: {
    valueMappings: [],
  },

  useThresholdColor: false,
  thresholdOptions: {
    thresholds: [],
    baseColor: getColors().statusGreen,
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

  titleOptions: {
    show: false,
    titleName: '',
  },
};

export const createStateTimelineConfig = (): VisualizationType<'state_timeline'> => ({
  name: 'state_timeline',
  type: 'state_timeline',
  ui: {
    style: {
      defaults: defaultStateTimeLineChartStyles,
      render: (props) => React.createElement(StateTimeLineVisStyleControls, props),
    },
    availableMappings: [
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Numerical, index: 0 },
      },

      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
      },
    ],
  },
});
