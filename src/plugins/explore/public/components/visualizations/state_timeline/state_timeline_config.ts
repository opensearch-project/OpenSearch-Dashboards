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
  ThresholdOptions,
  DisconnectValuesOption,
  DisableMode,
} from '../types';
import { getColors } from '../theme/default_colors';

interface ConnectNullValuesOption {
  connectMode: 'never' | 'always' | 'threshold';
  threshold: string;
}
export interface ExclusiveStateTimeLineConfig {
  // mergeConsecutive: boolean;
  showValues?: boolean;
  rowHeight?: number;
  disconnectValues?: DisconnectValuesOption;
  connectNullValues?: ConnectNullValuesOption;
}
// Complete line chart style controls interface
export interface StateTimeLineChartStyleControls {
  // Basic controls
  tooltipOptions: TooltipOptions;
  addLegend: boolean;
  legendPosition: Positions;
  // Axes configuration
  standardAxes: StandardAxes[];

  exclusive: ExclusiveStateTimeLineConfig;

  titleOptions: TitleOptions;

  valueMappingOptions?: ValueMappingOptions;
  thresholdOptions?: ThresholdOptions;

  useValueMappingColor?: boolean;
}

export const defaultStateTimeLineChartStyles: StateTimeLineChartStyleControls = {
  // Basic controls
  tooltipOptions: {
    mode: 'all',
  },
  addLegend: true,
  legendPosition: Positions.RIGHT,

  useValueMappingColor: false,

  // exclusive
  exclusive: {
    showValues: false,
    rowHeight: 1,
    disconnectValues: {
      disableMode: DisableMode.Never,
      threshold: '1h',
    },
  },

  valueMappingOptions: {
    valueMappings: [
      { type: 'value', value: 'text', displayText: '012', color: '#1d53b8ff' },
      { type: 'range', range: { min: 10, max: 20 }, displayText: '123', color: '#cece0dff' },
    ],
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

  thresholdOptions: {
    baseColor: getColors().statusGreen,
    thresholds: [],
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
    ],
  },
});
