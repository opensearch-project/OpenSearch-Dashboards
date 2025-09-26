/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LineVisStyleControls } from './line_vis_options';
import { VisualizationType } from '../utils/use_visualization_types';
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
} from '../types';
import { LineStyle } from './line_exclusive_vis_options';
import { TooltipOptions } from '../types';
import { AXIS_LABEL_MAX_LENGTH } from '../constants';
import { getColors } from '../theme/default_colors';

export type LineMode = 'straight' | 'smooth' | 'stepped';

// Complete line chart style controls interface
export interface LineChartStyleOptions {
  addLegend?: boolean;
  legendPosition?: Positions;
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
  categoryAxes?: CategoryAxis[];
  valueAxes?: ValueAxis[];

  titleOptions?: TitleOptions;
  thresholdOptions?: ThresholdOptions;
}

export type LineChartStyle = Required<Omit<LineChartStyleOptions, 'thresholdLines'>>;

export const defaultLineChartStyles: LineChartStyle = {
  addLegend: true,
  legendPosition: Positions.RIGHT,
  addTimeMarker: false,

  lineStyle: 'both',
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

  // Category axes
  categoryAxes: [
    {
      id: 'CategoryAxis-1',
      type: 'category',
      position: Positions.BOTTOM,
      show: true,
      labels: {
        show: true,
        filter: true,
        rotate: 0,
        truncate: AXIS_LABEL_MAX_LENGTH,
      },
      title: {
        text: '',
      },
      grid: {
        showLines: true,
      },
    },
  ],

  // Value axes
  valueAxes: [
    {
      id: 'ValueAxis-1',
      name: 'LeftAxis-1',
      type: 'value',
      position: Positions.LEFT,
      show: true,
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
    },
  ],

  titleOptions: {
    show: false,
    titleName: '',
  },
};

export const createLineConfig = (): VisualizationType<'line'> => ({
  name: 'line',
  type: 'line',
  ui: {
    style: {
      defaults: defaultLineChartStyles,
      render: (props) => React.createElement(LineVisStyleControls, props),
    },
    availableMappings: [
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y_SECOND]: { type: VisFieldType.Numerical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.FACET]: { type: VisFieldType.Categorical, index: 1 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
      },
    ],
  },
});
