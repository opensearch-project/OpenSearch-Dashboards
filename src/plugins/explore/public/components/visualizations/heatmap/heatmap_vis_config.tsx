/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';
import { HeatmapVisStyleControls } from './heatmap_vis_options';
import {
  StandardAxes,
  RangeValue,
  ColorSchemas,
  ScaleType,
  Positions,
  AxisRole,
  TooltipOptions,
  AggregationType,
  VisFieldType,
  TitleOptions,
  ThresholdOptions,
} from '../types';
import { getColors } from '../theme/default_colors';
import { DEFAULT_X_AXIS_CONFIG, DEFAULT_Y_AXIS_CONFIG } from '../constants';
import { createRegularHeatmap } from './to_expression';
import { EchartsRender } from '../echarts_render';

export interface HeatmapLabels {
  show: boolean;
  rotate: boolean;
  overwriteColor: boolean;
  color: string;
  type?: AggregationType;
}
export interface ExclusiveHeatmapConfig {
  colorSchema: ColorSchemas;
  reverseSchema: boolean;
  colorScaleType: ScaleType;
  scaleToDataBounds: boolean;
  percentageMode: boolean;
  maxNumberOfColors: number;
  /**
   * @deprecated - use useThresholdColor instead
   */
  useCustomRanges?: boolean;
  label: HeatmapLabels;

  /**
   * @deprecated - use global thresholdOptions instead
   */
  customRanges?: RangeValue[];
}
// Complete heatmap chart style options interface
export interface HeatmapChartStyleOptions {
  // Basic controls
  tooltipOptions?: TooltipOptions;
  addLegend?: boolean;
  legendPosition?: Positions;
  // @deprecated - removed this once migrated to echarts
  legendTitle?: string;

  // Axes configuration
  standardAxes?: StandardAxes[];

  exclusive?: ExclusiveHeatmapConfig;

  titleOptions?: TitleOptions;
  useThresholdColor?: boolean;
  thresholdOptions?: ThresholdOptions;
}

export type HeatmapChartStyle = Required<Omit<HeatmapChartStyleOptions, 'legendTitle'>> &
  Pick<HeatmapChartStyleOptions, 'legendTitle'>;

export const defaultHeatmapChartStyles: HeatmapChartStyle = {
  // Basic controls
  tooltipOptions: {
    mode: 'all',
  },
  addLegend: true,
  legendTitle: '',
  legendPosition: Positions.BOTTOM,

  // exclusive
  exclusive: {
    colorSchema: ColorSchemas.BLUES,
    reverseSchema: false,
    colorScaleType: ScaleType.LINEAR,
    scaleToDataBounds: false,
    percentageMode: false,
    maxNumberOfColors: 4,

    label: {
      type: AggregationType.SUM,
      show: false,
      rotate: false,
      overwriteColor: false,
      color: 'black',
    },
  },
  useThresholdColor: false,
  thresholdOptions: {
    baseColor: getColors().statusGreen,
    thresholds: [],
  },

  // Standard axes
  standardAxes: [
    {
      ...DEFAULT_X_AXIS_CONFIG,
      grid: {
        showLines: true,
      },
    },
    {
      ...DEFAULT_Y_AXIS_CONFIG,
      grid: {
        showLines: true,
      },
    },
  ],
  titleOptions: {
    show: false,
    titleName: '',
  },
};

export const createHeatmapConfig = (): VisualizationType<'heatmap'> => ({
  name: 'Heatmap',
  type: 'heatmap',
  icon: 'heatmap',
  getRules: () => {
    const rules: Array<VisRule<'heatmap'>> = [
      {
        priority: 90,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Categorical },
            [AxisRole.Y]: { type: VisFieldType.Categorical },
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for heatmap chart');
          const spec = createRegularHeatmap(props.transformedData, props.styleOptions, {
            [AxisRole.X]: x,
            [AxisRole.Y]: y,
            [AxisRole.COLOR]: color,
          });
          return <EchartsRender spec={spec ?? {}} />;
        },
      },
    ];
    return rules;
  },
  ui: {
    style: {
      defaults: defaultHeatmapChartStyles,
      render: (props) => React.createElement(HeatmapVisStyleControls, props),
    },
  },
});
