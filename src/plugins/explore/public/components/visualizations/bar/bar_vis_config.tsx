/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';

import {
  Positions,
  ThresholdLines,
  ThresholdMode,
  TooltipOptions,
  VisFieldType,
  AxisRole,
  StandardAxes,
  AggregationType,
  BucketOptions,
  TimeUnit,
  ThresholdOptions,
} from '../types';
import { BarVisStyleControls } from './bar_vis_options';
import { DEFAULT_X_AXIS_CONFIG } from '../constants';
import { getColors } from '../theme/default_colors';
import {
  createBarSpec,
  createDoubleNumericalBarChart,
  createGroupedTimeBarChart,
  createStackedBarSpec,
  createTimeBarChart,
} from './to_expression';
import { EchartsRender } from '../echarts_render';

export interface BarChartStyleOptions {
  // Basic controls
  addLegend?: boolean;
  legendPosition?: Positions;
  legendTitle?: string;
  legendShape?: 'circle' | 'square';
  tooltipOptions?: TooltipOptions;

  // Bar specific controls
  barSizeMode?: 'auto' | 'manual';
  barWidth?: number;
  barPadding?: number;
  showBarBorder?: boolean;
  barBorderWidth?: number;
  barBorderColor?: string;
  stackMode?: 'none' | 'total';

  /**
   * @deprecated - use thresholdOptions instead
   */
  thresholdLines?: ThresholdLines;
  // Axes configuration
  standardAxes?: StandardAxes[];

  // histogram bucket config
  bucket?: BucketOptions;

  thresholdOptions?: ThresholdOptions;

  useThresholdColor?: boolean;
  showFullTimeRange?: boolean;
}

export type BarChartStyle = Required<
  Omit<BarChartStyleOptions, 'legendShape' | 'thresholdLines' | 'legendTitle' | 'stackMode'>
> &
  Pick<BarChartStyleOptions, 'legendShape' | 'legendTitle' | 'stackMode'>;

export const defaultBarChartStyles: BarChartStyle = {
  // Basic controls
  addLegend: true,
  legendTitle: '',
  legendPosition: Positions.BOTTOM,
  tooltipOptions: {
    mode: 'all',
  },

  // Bar specific controls
  barSizeMode: 'auto',
  barWidth: 0.7,
  barPadding: 0.1,
  showBarBorder: false,
  barBorderWidth: 1,
  barBorderColor: '#000000',

  // Threshold options
  thresholdOptions: {
    baseColor: getColors().statusGreen,
    thresholds: [],
    thresholdStyle: ThresholdMode.Off,
  },
  useThresholdColor: false,
  standardAxes: [{ ...DEFAULT_X_AXIS_CONFIG, grid: { showLines: false } }],
  bucket: {
    aggregationType: AggregationType.SUM,
    bucketTimeUnit: TimeUnit.AUTO,
  },
  showFullTimeRange: false,
};

export const createBarConfig = (): VisualizationType<'bar'> => ({
  name: 'Bar',
  type: 'bar',
  icon: 'visBarVertical',
  getRules: () => {
    const rules: Array<VisRule<'bar'>> = [
      {
        priority: 100,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Categorical },
            [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y;
          if (!x || !y || y.length === 0) throw Error('Missing axis config for bar chart');

          const spec = createBarSpec(
            props.transformedData,
            props.styleOptions,
            {
              [AxisRole.X]: x,
              [AxisRole.Y]: y,
            },
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
            />
          );
        },
      },
      {
        priority: 100,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical, multi: true },
            [AxisRole.Y]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x;
          const y = props.axisColumnMappings.y?.[0];
          if (!x || !y || x.length === 0) throw Error('Missing axis config for bar chart');

          const spec = createBarSpec(
            props.transformedData,
            props.styleOptions,
            {
              [AxisRole.X]: x,
              [AxisRole.Y]: y,
            },
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
            />
          );
        },
      },
      {
        priority: 60,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date },
            [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y;
          if (!x || !y || y.length === 0) throw Error('Missing axis config for time bar chart');

          const spec = createTimeBarChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y },
            props.timeRange,
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
            />
          );
        },
      },
      {
        priority: 60,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical, multi: true },
            [AxisRole.Y]: { type: VisFieldType.Date },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x;
          const y = props.axisColumnMappings.y?.[0];
          if (!x || !y || x.length === 0) throw Error('Missing axis config for time bar chart');

          const spec = createTimeBarChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y },
            props.timeRange,
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
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
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for grouped time bar chart');

          const spec = createGroupedTimeBarChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color },
            props.timeRange,
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
            />
          );
        },
      },
      {
        priority: 60,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Date },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for grouped time bar chart');

          const spec = createGroupedTimeBarChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color },
            props.timeRange,
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
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
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for grouped time bar chart');

          const spec = createGroupedTimeBarChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color },
            props.timeRange,
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
            />
          );
        },
      },
      {
        priority: 80,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Date },
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for grouped time bar chart');

          const spec = createGroupedTimeBarChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color },
            props.timeRange,
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
            />
          );
        },
      },
      {
        priority: 100,
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
          if (!x || !y || !color) throw Error('Missing axis config for stacked bar chart');

          const spec = createStackedBarSpec(
            props.transformedData,
            props.styleOptions,
            {
              [AxisRole.X]: x,
              [AxisRole.Y]: y,
              [AxisRole.COLOR]: color,
            },
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
            />
          );
        },
      },
      {
        priority: 100,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Categorical },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for stacked bar chart');

          const spec = createStackedBarSpec(
            props.transformedData,
            props.styleOptions,
            {
              [AxisRole.X]: x,
              [AxisRole.Y]: y,
              [AxisRole.COLOR]: color,
            },
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
            />
          );
        },
      },
      {
        priority: 80,
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
          if (!x || !y || !color) throw Error('Missing axis config for stacked bar chart');

          const spec = createStackedBarSpec(
            props.transformedData,
            props.styleOptions,
            {
              [AxisRole.X]: x,
              [AxisRole.Y]: y,
              [AxisRole.COLOR]: color,
            },
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
            />
          );
        },
      },
      {
        priority: 80,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Categorical },
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for stacked bar chart');

          const spec = createStackedBarSpec(
            props.transformedData,
            props.styleOptions,
            {
              [AxisRole.X]: x,
              [AxisRole.Y]: y,
              [AxisRole.COLOR]: color,
            },
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
            />
          );
        },
      },
      {
        priority: 60,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y;
          if (!x || !y || y.length === 0)
            throw Error('Missing axis config for double numerical bar chart');

          const spec = createDoubleNumericalBarChart(
            props.transformedData,
            props.styleOptions,
            {
              [AxisRole.X]: x,
              [AxisRole.Y]: y,
            },
            props.onLegend
          );
          return (
            <EchartsRender
              spec={spec}
              onSelectTimeRange={props.onSelectTimeRange}
              legendSelected$={props.legendSelected$}
              highlightedSeries$={props.highlightedSeries$}
            />
          );
        },
      },
    ];
    return rules;
  },
  ui: {
    style: {
      defaults: defaultBarChartStyles,
      render: (props) => React.createElement(BarVisStyleControls, props),
    },
  },
});
