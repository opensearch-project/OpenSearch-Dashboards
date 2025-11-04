/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';

import {
  Positions,
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
import { AXIS_LABEL_MAX_LENGTH } from '../constants';
import { getColors } from '../theme/default_colors';

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
      id: 'Axis-1',
      position: Positions.BOTTOM,
      show: true,
      style: {},
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: AXIS_LABEL_MAX_LENGTH,
      },
      title: {
        text: '',
      },
      grid: {
        showLines: false,
      },
      axisRole: AxisRole.X,
    },
    {
      id: 'Axis-2',
      position: Positions.LEFT,
      show: true,
      style: {},
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: AXIS_LABEL_MAX_LENGTH,
      },
      title: {
        text: '',
      },
      grid: {
        showLines: true,
      },
      axisRole: AxisRole.Y,
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
  name: 'histogram',
  type: 'histogram',
  ui: {
    style: {
      defaults: defaultHistogramChartStyles,
      render: (props) => React.createElement(HistogramVisStyleControls, props),
    },
    availableMappings: [
      {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
      },
    ],
  },
});
