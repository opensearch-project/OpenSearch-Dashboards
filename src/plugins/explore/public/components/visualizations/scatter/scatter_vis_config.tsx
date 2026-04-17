/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';
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
import {
  createTwoMetricScatter,
  createTwoMetricOneCateScatter,
  createThreeMetricOneCateScatter,
} from './to_expression';
import { EchartsRender } from '../echarts_render';

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
  titleOptions: {
    show: false,
    titleName: '',
  },
};

export const createScatterConfig = (): VisualizationType<'scatter'> => ({
  name: 'Scatter',
  icon: '',
  type: 'scatter',
  getRules: () => {
    const rules: Array<VisRule<'scatter'>> = [
      {
        priority: 100,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          if (!x || !y) throw Error('Missing axis config for scatter chart');
          const spec = createTwoMetricScatter(props.transformedData, props.styleOptions, {
            [AxisRole.X]: x,
            [AxisRole.Y]: y,
          });
          return <EchartsRender spec={spec} />;
        },
      },
      {
        priority: 100,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          if (!x || !y || !color) throw Error('Missing axis config for scatter chart');
          const spec = createTwoMetricOneCateScatter(props.transformedData, props.styleOptions, {
            [AxisRole.X]: x,
            [AxisRole.Y]: y,
            [AxisRole.COLOR]: color,
          });
          return <EchartsRender spec={spec} />;
        },
      },
      {
        priority: 100,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical },
            [AxisRole.SIZE]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          const color = props.axisColumnMappings.color?.[0];
          const size = props.axisColumnMappings.size?.[0];
          if (!x || !y || !color || !size) throw Error('Missing axis config for scatter chart');
          const spec = createThreeMetricOneCateScatter(props.transformedData, props.styleOptions, {
            [AxisRole.X]: x,
            [AxisRole.Y]: y,
            [AxisRole.COLOR]: color,
            [AxisRole.SIZE]: size,
          });
          return <EchartsRender spec={spec} />;
        },
      },
    ];
    return rules;
  },
  ui: {
    style: {
      defaults: defaultScatterChartStyles,
      render: (props) => React.createElement(ScatterVisStyleControls, props),
    },
  },
});
