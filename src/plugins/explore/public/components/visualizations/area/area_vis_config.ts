/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AreaVisStyleControls } from './area_vis_options';
import { VisualizationType } from '../utils/use_visualization_types';
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
} from '../types';
import { AXIS_LABEL_MAX_LENGTH } from '../constants';
import { getColors } from '../theme/default_colors';

// Complete area chart style controls interface
export interface AreaChartStyleOptions {
  // Basic controls
  addLegend?: boolean;
  legendPosition?: Positions;
  legendTitle?: string;
  addTimeMarker?: boolean;
  areaOpacity?: number;
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

export type AreaChartStyle = Required<
  Omit<AreaChartStyleOptions, 'areaOpacity' | 'thresholdLines' | 'legendTitle'>
> &
  Pick<AreaChartStyleOptions, 'areaOpacity' | 'legendTitle'>;

const defaultAreaChartStyles: AreaChartStyle = {
  // Basic controls
  addLegend: true,
  legendPosition: Positions.RIGHT,
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
      grid: {
        showLines: true,
      },
      title: {
        text: '',
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
      grid: {
        showLines: true,
      },
      title: {
        text: '',
      },
    },
  ],

  titleOptions: {
    show: false,
    titleName: '',
  },
};

export const createAreaConfig = (): VisualizationType<'area'> => ({
  name: 'area',
  type: 'area',
  ui: {
    style: {
      defaults: defaultAreaChartStyles,
      render: (props) => React.createElement(AreaVisStyleControls, props),
    },
    availableMappings: [
      {
        [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
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
      {
        [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 1 },
      },
    ],
  },
});
