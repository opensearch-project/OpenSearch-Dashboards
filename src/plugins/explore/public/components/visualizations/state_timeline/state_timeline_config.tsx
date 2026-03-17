/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';
import { visualizationRegistry } from '../visualization_registry';
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
import { DEFAULT_X_AXIS_CONFIG, DEFAULT_Y_AXIS_CONFIG } from '../constants';
import {
  createNumericalStateTimeline,
  createCategoricalStateTimeline,
  createSingleCategoricalStateTimeline,
  createSingleNumericalStateTimeline,
} from './to_expression';
import { EchartsRender } from '../echarts_render';

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
  // @deprecated - removed this once migrated to echarts
  legendTitle?: string;
  // Axes configuration
  standardAxes?: StandardAxes[];

  exclusive?: ExclusiveStateTimeLineConfig;

  titleOptions?: TitleOptions;

  valueMappingOptions?: ValueMappingOptions;
  // TODO add Color mode options(temporary name) to make a switch between No style, Use Value Mapping Color, Use Threshold Color
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
      ...DEFAULT_X_AXIS_CONFIG,
      grid: {
        showLines: false,
      },
    },
    {
      ...DEFAULT_Y_AXIS_CONFIG,
      grid: {
        showLines: false,
      },
    },
  ],

  titleOptions: {
    show: false,
    titleName: '',
  },
};

export const createStateTimelineConfig = (): VisualizationType<'state_timeline'> => ({
  name: 'State timeline',
  type: 'state_timeline',
  icon: 'visBarHorizontal',
  getRules: () => {
    const rules: Array<VisRule<'state_timeline'>> = [
      {
        priority: 100,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date },
            [AxisRole.Y]: { type: VisFieldType.Categorical },
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const spec = createNumericalStateTimeline(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
        },
      },
      {
        priority: 100,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date },
            [AxisRole.Y]: { type: VisFieldType.Categorical },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const spec = createCategoricalStateTimeline(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
        },
      },
      {
        priority: 100,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const spec = createSingleCategoricalStateTimeline(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
        },
      },
      {
        priority: 40,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date },
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const spec = createSingleNumericalStateTimeline(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
        },
      },
    ];
    return rules;
  },
  ui: {
    style: {
      defaults: defaultStateTimeLineChartStyles,
      render: (props) => React.createElement(StateTimeLineVisStyleControls, props),
    },
  },
});
