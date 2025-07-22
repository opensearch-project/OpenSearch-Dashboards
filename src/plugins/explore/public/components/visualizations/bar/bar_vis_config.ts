/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';

import {
  Positions,
  ThresholdLines,
  ThresholdLineStyle,
  TooltipOptions,
  VisFieldType,
  AxisRole,
  StandardAxes,
} from '../types';
import { BarVisStyleControls, BarVisStyleControlsProps } from './bar_vis_options';

export interface BarChartStyleControls {
  // Basic controls
  addLegend: boolean;
  legendPosition: Positions;
  tooltipOptions: TooltipOptions;

  // Bar specific controls
  barSizeMode: 'auto' | 'manual';
  barWidth: number;
  barPadding: number;
  showBarBorder: boolean;
  barBorderWidth: number;
  barBorderColor: string;

  // Threshold and grid
  thresholdLines: ThresholdLines;
  // Axes configuration
  standardAxes: StandardAxes[];

  switchAxes: boolean;
}

export const defaultBarChartStyles: BarChartStyleControls = {
  // Basic controls
  switchAxes: false,
  addLegend: true,
  legendPosition: Positions.RIGHT,
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
        truncate: 100,
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
        truncate: 100,
      },
      title: {
        text: '',
      },
      grid: {
        showLines: false,
      },
      axisRole: AxisRole.Y,
    },
  ],
};

export const createBarConfig = (): VisualizationType<'bar'> => ({
  name: 'bar',
  type: 'bar',
  ui: {
    style: {
      defaults: defaultBarChartStyles,
      render: (props) =>
        React.createElement(BarVisStyleControls, props as BarVisStyleControlsProps),
    },
    availableMappings: [
      {
        mapping: [
          // TODO the first one should be default?
          {
            [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
          },
          {
            [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Categorical, index: 0 },
          },
        ],
      },
      {
        mapping: [
          {
            [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
          },
          {
            [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Date, index: 0 },
          },
        ],
      },
      {
        mapping: [
          {
            [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
          },
          {
            [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Date, index: 0 },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
          },
        ],
      },
      {
        mapping: [
          {
            [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
            [AxisRole.FACET]: { type: VisFieldType.Categorical, index: 1 },
          },
          {
            [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Date, index: 0 },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
            [AxisRole.FACET]: { type: VisFieldType.Categorical, index: 1 },
          },
        ],
      },
      {
        mapping: [
          {
            [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 1 },
          },
          {
            [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Categorical, index: 0 },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 1 },
          },
        ],
      },
    ],
  },
});
