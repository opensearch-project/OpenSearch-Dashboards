/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';

import {
  ThresholdMode,
  TooltipOptions,
  VisFieldType,
  AxisRole,
  StandardAxes,
  TitleOptions,
  AggregationType,
  BucketOptions,
  ThresholdOptions,
} from '../types';
import { HistogramVisStyleControls } from './histogram_vis_options';
import { DEFAULT_X_AXIS_CONFIG } from '../constants';
import { getColors } from '../theme/default_colors';
import { createNumericalHistogramChart, createSingleHistogramChart } from './to_expression';
import { EchartsRender } from '../echarts_render';

export interface HistogramChartStyleOptions {
  // Basic controls
  tooltipOptions?: TooltipOptions;

  barSizeMode?: 'auto' | 'manual';
  barWidth?: number;
  barPadding?: number;
  showBarBorder?: boolean;
  barBorderWidth?: number;
  barBorderColor?: string;

  // Axes configuration
  standardAxes?: StandardAxes[];

  titleOptions?: TitleOptions;

  // histogram bucket config
  bucket?: BucketOptions;

  thresholdOptions?: ThresholdOptions;

  useThresholdColor?: boolean;
}

export type HistogramChartStyle = Required<HistogramChartStyleOptions>;

export const defaultHistogramChartStyles: HistogramChartStyle = {
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
  standardAxes: [
    {
      ...DEFAULT_X_AXIS_CONFIG,
      grid: {
        showLines: false,
      },
    },
  ],
  titleOptions: {
    show: false,
    titleName: '',
  },
  bucket: {
    aggregationType: AggregationType.SUM,
  },
};

export const createHistogramConfig = (): VisualizationType<'histogram'> => ({
  name: 'Histogram',
  type: 'histogram',
  icon: 'visBarVertical',
  getRules: () => {
    const rules: Array<VisRule<'histogram'>> = [
      {
        priority: 80,
        mappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const spec = createNumericalHistogramChart(
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
            [AxisRole.X]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const spec = createSingleHistogramChart(
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
      defaults: defaultHistogramChartStyles,
      render: (props) => React.createElement(HistogramVisStyleControls, props),
    },
  },
});
