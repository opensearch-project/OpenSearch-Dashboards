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
  TitleOptions,
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
  createFacetedTimeBarChart,
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

  switchAxes?: boolean;

  titleOptions?: TitleOptions;

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
  switchAxes: false,
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
  titleOptions: {
    show: false,
    titleName: '',
  },
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
            [AxisRole.Y]: { type: VisFieldType.Numerical },
          },
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const spec = createBarSpec(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
          return <EchartsRender spec={spec} />;
        },
      },
      {
        priority: 60,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
          },
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Date },
          },
        ],
        render(props) {
          const spec = createTimeBarChart(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings,
            props.timeRange
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
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
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Date },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const spec = createGroupedTimeBarChart(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings,
            props.timeRange
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
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
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Date },
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const spec = createGroupedTimeBarChart(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings,
            props.timeRange
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
        },
      },
      {
        priority: 60,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
            [AxisRole.FACET]: { type: VisFieldType.Categorical },
          },
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Date },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
            [AxisRole.FACET]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const spec = createFacetedTimeBarChart(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings,
            props.timeRange
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
        },
      },
      {
        priority: 100,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
            [AxisRole.FACET]: { type: VisFieldType.Categorical },
          },
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Date },
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
            [AxisRole.FACET]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const spec = createFacetedTimeBarChart(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings,
            props.timeRange
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
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
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Categorical },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const spec = createStackedBarSpec(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
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
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Categorical },
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const spec = createStackedBarSpec(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
        },
      },
      {
        priority: 60,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const spec = createDoubleNumericalBarChart(
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
      defaults: defaultBarChartStyles,
      render: (props) => React.createElement(BarVisStyleControls, props),
    },
  },
});
