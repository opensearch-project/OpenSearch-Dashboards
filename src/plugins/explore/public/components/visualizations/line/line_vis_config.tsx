/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LineVisStyleControls } from './line_vis_options';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';
import {
  CategoryAxis,
  ThresholdLines,
  ThresholdMode,
  ValueAxis,
  Positions,
  AxisRole,
  VisFieldType,
  TitleOptions,
  ThresholdOptions,
  StandardAxes,
} from '../types';
import { LineStyle } from './line_exclusive_vis_options';
import { TooltipOptions } from '../types';
import { getColors } from '../theme/default_colors';
import {
  createSimpleLineChart,
  createLineBarChart,
  createMultiLineChart,
  createFacetedMultiLineChart,
  createCategoryLineChart,
  createCategoryMultiLineChart,
} from './to_expression';
import { EchartsRender } from '../echarts_render';

export type LineMode = 'straight' | 'smooth' | 'stepped';

// Complete line chart style controls interface
export interface LineChartStyleOptions {
  addLegend?: boolean;
  legendPosition?: Positions;
  // @deprecated - removed this once migrated to echarts
  legendTitle?: string;
  addTimeMarker?: boolean;

  lineStyle?: LineStyle;
  lineMode?: LineMode;
  lineWidth?: number;
  tooltipOptions?: TooltipOptions;

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

  titleOptions?: TitleOptions;
  thresholdOptions?: ThresholdOptions;

  showFullTimeRange?: boolean;
}

export type LineChartStyle = Required<
  Omit<LineChartStyleOptions, 'thresholdLines' | 'legendTitle' | 'categoryAxes' | 'valueAxes'>
> &
  Pick<LineChartStyleOptions, 'legendTitle'>;

export const defaultLineChartStyles: LineChartStyle = {
  addLegend: true,
  legendTitle: '',
  legendPosition: Positions.BOTTOM,
  addTimeMarker: false,

  lineStyle: 'line',
  lineMode: 'straight',
  lineWidth: 2,
  tooltipOptions: {
    mode: 'all',
  },

  // Threshold options
  thresholdOptions: {
    baseColor: getColors().statusGreen,
    thresholds: [],
    thresholdStyle: ThresholdMode.Off,
  },

  standardAxes: [],

  titleOptions: {
    show: false,
    titleName: '',
  },

  showFullTimeRange: false,
};

export const createLineConfig = (): VisualizationType<'line'> => ({
  name: 'Line',
  icon: 'visLine',
  type: 'line',
  getRules: () => {
    const rules: Array<VisRule<'line'>> = [
      {
        priority: 100,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date },
            [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y;
          if (!x || !y || y.length === 0) throw Error('Missing axis config for line chart');

          const spec = createSimpleLineChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y },
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
            [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
            [AxisRole.Y_SECOND]: { type: VisFieldType.Numerical, multi: true },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y;
          const y2 = props.axisColumnMappings.y2;

          if (!x || !y || !y2 || y.length === 0 || y2.length === 0)
            throw Error('Missing axis config for line/bar combo chart');

          const spec = createLineBarChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.Y_SECOND]: y2 },
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
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for multi-line chart');

          const spec = createMultiLineChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color },
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
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for multi-line chart');

          const spec = createMultiLineChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color },
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
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
            [AxisRole.FACET]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          const facet = props.axisColumnMappings.facet?.[0];
          if (!x || !y || !color || !facet)
            throw Error('Missing axis config for faceted multi-line chart');

          const spec = createFacetedMultiLineChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color, [AxisRole.FACET]: facet },
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
            [AxisRole.FACET]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          const facet = props.axisColumnMappings.facet?.[0];
          if (!x || !y || !color || !facet)
            throw Error('Missing axis config for faceted multi-line chart');

          const spec = createFacetedMultiLineChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color, [AxisRole.FACET]: facet },
            props.timeRange
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
        },
      },
      {
        priority: 40,
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
            throw Error('Missing axis config for category line chart');

          const spec = createCategoryLineChart(props.transformedData, props.styleOptions, {
            [AxisRole.X]: x,
            [AxisRole.Y]: y,
          });
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
        },
      },
      {
        priority: 40,
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
          if (!x || !y || !color) throw Error('Missing axis config for category multi-line chart');

          const spec = createCategoryMultiLineChart(props.transformedData, props.styleOptions, {
            [AxisRole.X]: x,
            [AxisRole.Y]: y,
            [AxisRole.COLOR]: color,
          });
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
        },
      },
      {
        priority: 40,
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
          if (!x || !y || !color) throw Error('Missing axis config for category multi-line chart');

          const spec = createCategoryMultiLineChart(props.transformedData, props.styleOptions, {
            [AxisRole.X]: x,
            [AxisRole.Y]: y,
            [AxisRole.COLOR]: color,
          });
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
        },
      },
    ];
    return rules;
  },
  ui: {
    style: {
      defaults: defaultLineChartStyles,
      render: (props) => React.createElement(LineVisStyleControls, props),
    },
  },
});
