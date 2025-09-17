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
  ThresholdLineStyle,
  ValueAxis,
  Positions,
  TooltipOptions,
  AxisRole,
  VisFieldType,
  TitleOptions,
} from '../types';
import { AXIS_LABEL_MAX_LENGTH } from '../constants';

// Complete area chart style controls interface
export interface AreaChartStyleControls {
  // Basic controls
  addLegend: boolean;
  legendPosition: Positions;
  addTimeMarker: boolean;
  areaOpacity?: number;
  tooltipOptions: TooltipOptions;

  // Threshold and grid
  thresholdLines: ThresholdLines;

  // Axes configuration
  categoryAxes: CategoryAxis[];
  valueAxes: ValueAxis[];

  titleOptions: TitleOptions;
}

const defaultAreaChartStyles: AreaChartStyleControls = {
  // Basic controls
  addLegend: true,
  legendPosition: Positions.RIGHT,
  addTimeMarker: false,
  tooltipOptions: {
    mode: 'all',
  },

  // Threshold and grid
  thresholdLines: [
    {
      id: '1',
      color: '#E7664C',
      show: false,
      style: ThresholdLineStyle.Full,
      value: 10,
      width: 1,
      name: '',
    },
  ],

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
