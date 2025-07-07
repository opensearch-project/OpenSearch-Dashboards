/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';

import {
  CategoryAxis,
  GridOptions,
  Positions,
  ThresholdLines,
  ThresholdLineStyle,
  ValueAxis,
  TooltipOptions,
} from '../types';
import { BarVisStyleControls, BarVisStyleControlsProps } from './bar_vis_options';

export interface BarChartStyleControls {
  // Basic controls
  addLegend: boolean;
  legendPosition: Positions;
  tooltipOptions: TooltipOptions;

  // Bar specific controls
  barWidth: number;
  barPadding: number;
  showBarBorder: boolean;
  barBorderWidth: number;
  barBorderColor: string;

  // Threshold and grid
  thresholdLines: ThresholdLines;
  grid: GridOptions;

  // Axes configuration
  categoryAxes: CategoryAxis[];
  valueAxes: ValueAxis[];
}

export const defaultBarChartStyles: BarChartStyleControls = {
  // Basic controls
  addLegend: true,
  legendPosition: Positions.RIGHT,
  tooltipOptions: {
    mode: 'all',
  },

  // Bar specific controls
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
  grid: {
    categoryLines: true,
    valueLines: true,
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
        truncate: 100,
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
        truncate: 100,
      },
      title: {
        text: '',
      },
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
  },
});
