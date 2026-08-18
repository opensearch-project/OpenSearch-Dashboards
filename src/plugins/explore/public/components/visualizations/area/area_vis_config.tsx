/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AreaVisStyleControls } from './area_vis_options';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';
import {
  CategoryAxis,
  ThresholdLines,
  ThresholdMode,
  ValueAxis,
  Positions,
  TooltipOptions,
  AxisRole,
  VisFieldType,
  ThresholdOptions,
  StandardAxes,
  StackMode,
  LineDashStyle,
  LineMode,
} from '../types';
import { getColors } from '../theme/default_colors';
import {
  createSimpleAreaChart,
  createMultiAreaChart,
  createCategoryAreaChart,
  createStackedAreaChart,
} from './to_expression';
import { EchartsRender } from '../echarts_render';

export const DEFAULT_FILL_OPACITY = 30;
/**
 * - `none`: flat fill in the series color.
 * - `opacity`: fades from the series color at the line to transparent at the baseline.
 * - `hue`: transitions from the series color at the line to a lighter variant at the baseline.
 */
export type GradientMode = 'none' | 'opacity' | 'hue';

// Complete area chart style controls interface
export interface AreaChartStyleOptions {
  // Basic controls
  addLegend?: boolean;
  legendPosition?: Positions;
  // @deprecated - removed this once migrated to echarts
  legendTitle?: string;
  addTimeMarker?: boolean;
  areaOpacity?: number;
  gradientMode?: GradientMode;
  tooltipOptions?: TooltipOptions;

  // Border line configuration
  lineDashStyle?: LineDashStyle;
  lineMode?: LineMode;
  lineWidth?: number;

  pointSize?: number;
  showValues?: boolean;

  /**
   * @deprecated - use thresholdOptions instead
   */
  thresholdLines?: ThresholdLines;

  // Axes configuration
  /**
   * @deprecated - use standardAxes instead
   */
  categoryAxes?: CategoryAxis[];
  /**
   * @deprecated - use standardAxes instead
   */
  valueAxes?: ValueAxis[];

  standardAxes?: StandardAxes[];

  thresholdOptions?: ThresholdOptions;
  showFullTimeRange?: boolean;
  stackMode?: StackMode;
}

export type AreaChartStyle = Required<
  Omit<
    AreaChartStyleOptions,
    | 'thresholdLines'
    | 'legendTitle'
    | 'categoryAxes'
    | 'valueAxes'
    | 'lineWidth'
    | 'pointSize'
    | 'areaOpacity'
  >
> &
  Pick<AreaChartStyleOptions, 'legendTitle' | 'lineWidth' | 'pointSize' | 'areaOpacity'>;

export const defaultAreaChartStyles: AreaChartStyle = {
  // Basic controls
  addLegend: true,
  legendTitle: '',
  legendPosition: Positions.BOTTOM,
  addTimeMarker: false,
  gradientMode: 'none',
  tooltipOptions: {
    mode: 'all',
  },
  lineDashStyle: 'solid',

  lineMode: 'smooth',

  showValues: false,
  // Threshold options
  thresholdOptions: {
    baseColor: getColors().statusGreen,
    thresholds: [],
    thresholdStyle: ThresholdMode.Off,
  },

  standardAxes: [],

  showFullTimeRange: true,
  stackMode: 'total',
};

export const createAreaConfig = (): VisualizationType<'area'> => ({
  name: 'Area',
  icon: 'visArea',
  type: 'area',
  getRules: () => {
    const rules: Array<VisRule<'area'>> = [
      {
        priority: 80,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date },
            [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y;
          if (!x || !y || y.length === 0) throw Error('Missing axis config for area chart');

          const { spec, legendItems } = createSimpleAreaChart(
            props.data,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y },
            props.timeRange
          );
          props.onLegend?.(legendItems);
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedLegendTarget$={props.highlightedLegendTarget$}
            />
          );
        },
      },
      {
        priority: 80,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for multi-area chart');

          const { spec, legendItems } = createMultiAreaChart(
            props.data,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color },
            props.timeRange,
            props.allData
          );
          props.onLegend?.(legendItems);
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedLegendTarget$={props.highlightedLegendTarget$}
            />
          );
        },
      },
      {
        priority: 60,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for multi-area chart');

          const { spec, legendItems } = createMultiAreaChart(
            props.data,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color },
            props.timeRange,
            props.allData
          );
          props.onLegend?.(legendItems);
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedLegendTarget$={props.highlightedLegendTarget$}
            />
          );
        },
      },
      {
        priority: 20,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Categorical },
            [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y;
          if (!x || !y || y.length === 0)
            throw Error('Missing axis config for category area chart');

          const { spec, legendItems } = createCategoryAreaChart(props.data, props.styleOptions, {
            [AxisRole.X]: x,
            [AxisRole.Y]: y,
          });
          props.onLegend?.(legendItems);
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedLegendTarget$={props.highlightedLegendTarget$}
            />
          );
        },
      },
      {
        priority: 60,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Categorical },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for stacked area chart');

          const { spec, legendItems } = createStackedAreaChart(
            props.data,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color },
            props.allData
          );
          props.onLegend?.(legendItems);
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedLegendTarget$={props.highlightedLegendTarget$}
            />
          );
        },
      },
      {
        priority: 60,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Categorical },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for stacked area chart');

          const { spec, legendItems } = createStackedAreaChart(
            props.data,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color },
            props.allData
          );
          props.onLegend?.(legendItems);
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedLegendTarget$={props.highlightedLegendTarget$}
            />
          );
        },
      },
    ];
    return rules;
  },
  ui: {
    style: {
      defaults: defaultAreaChartStyles,
      render: (props) => React.createElement(AreaVisStyleControls, props),
    },
  },
});
