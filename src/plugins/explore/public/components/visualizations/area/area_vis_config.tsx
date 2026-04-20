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
  TitleOptions,
  ThresholdOptions,
  StandardAxes,
} from '../types';
import { getColors } from '../theme/default_colors';
import {
  createSimpleAreaChart,
  createMultiAreaChart,
  createFacetedMultiAreaChart,
  createCategoryAreaChart,
  createStackedAreaChart,
} from './to_expression';
import { EchartsRender } from '../echarts_render';

// Complete area chart style controls interface
export interface AreaChartStyleOptions {
  // Basic controls
  addLegend?: boolean;
  legendPosition?: Positions;
  // @deprecated - removed this once migrated to echarts
  legendTitle?: string;
  addTimeMarker?: boolean;
  areaOpacity?: number;
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

export type AreaChartStyle = Required<
  Omit<
    AreaChartStyleOptions,
    'areaOpacity' | 'thresholdLines' | 'legendTitle' | 'categoryAxes' | 'valueAxes'
  >
> &
  Pick<AreaChartStyleOptions, 'areaOpacity' | 'legendTitle'>;

const defaultAreaChartStyles: AreaChartStyle = {
  // Basic controls
  addLegend: true,
  legendTitle: '',
  legendPosition: Positions.BOTTOM,
  addTimeMarker: false,
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

          const spec = createSimpleAreaChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y },
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
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for multi-area chart');

          const spec = createMultiAreaChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color },
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
            [AxisRole.COLOR]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for multi-area chart');

          const spec = createMultiAreaChart(
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
            throw Error('Missing axis config for faceted multi-area chart');

          const spec = createFacetedMultiAreaChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color, [AxisRole.FACET]: facet },
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
            throw Error('Missing axis config for faceted multi-area chart');

          const spec = createFacetedMultiAreaChart(
            props.transformedData,
            props.styleOptions,
            { [AxisRole.X]: x, [AxisRole.Y]: y, [AxisRole.COLOR]: color, [AxisRole.FACET]: facet },
            props.timeRange
          );
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
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

          const spec = createCategoryAreaChart(props.transformedData, props.styleOptions, {
            [AxisRole.X]: x,
            [AxisRole.Y]: y,
          });
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
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

          const spec = createStackedAreaChart(props.transformedData, props.styleOptions, {
            [AxisRole.X]: x,
            [AxisRole.Y]: y,
            [AxisRole.COLOR]: color,
          });
          return <EchartsRender spec={spec} onSelectTimeRange={props.onSelectTimeRange} />;
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

          const spec = createStackedAreaChart(props.transformedData, props.styleOptions, {
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
      defaults: defaultAreaChartStyles,
      render: (props) => React.createElement(AreaVisStyleControls, props),
    },
  },
});
