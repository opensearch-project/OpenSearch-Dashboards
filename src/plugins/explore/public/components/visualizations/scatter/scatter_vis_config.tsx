/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';
import { visualizationRegistry } from '../visualization_registry';
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
  switchAxes?: boolean;

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
  switchAxes: false,
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
          const spec = createTwoMetricScatter(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
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
          const spec = createTwoMetricOneCateScatter(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
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
          const spec = createThreeMetricOneCateScatter(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
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
