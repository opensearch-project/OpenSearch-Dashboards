/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../../../view_components/utils/use_visualization_types';
import { Positions } from '../utils/collections';
import { LineVisStyleControls, LineVisStyleControlsProps } from './line_vis_options';
import { toExpression } from './to_expression';

// Threshold line configuration
export interface ThresholdLine {
  color: string;
  show: boolean;
  style: 'full' | 'dashed' | 'dot-dashed';
  value: number;
  width: number;
}

// Grid configuration
export interface GridOptions {
  categoryLines: boolean;
  valueLines: boolean;
}

// Axis label configuration
export interface AxisLabels {
  show: boolean;
  filter: boolean;
  rotate: number;
  truncate: number;
}

// Axis scale configuration
export interface AxisScale {
  type: 'linear' | 'log';
  mode?: 'normal' | 'percentage';
  defaultYExtents?: boolean;
  setYExtents?: boolean;
  min?: number;
  max?: number;
}

// Axis title configuration
export interface AxisTitle {
  text?: string;
}

// Category axis configuration
export interface CategoryAxis {
  id: string;
  type: 'category';
  position: 'top' | 'bottom';
  show: boolean;
  style: Record<string, any>;
  scale: AxisScale;
  labels: AxisLabels;
  title: AxisTitle;
}

// Value axis configuration
export interface ValueAxis {
  id: string;
  name: string;
  type: 'value';
  position: 'left' | 'right';
  show: boolean;
  style: Record<string, any>;
  scale: AxisScale;
  labels: AxisLabels;
  title: AxisTitle;
}

// Complete line chart style controls interface
export interface LineChartStyleControls {
  // Basic controls
  addTooltip: boolean;
  addLegend: boolean;
  legendPosition: Positions;
  addTimeMarker: boolean;

  showLine: boolean;
  lineMode: string;
  lineWidth: number;
  showDots: boolean;

  // Threshold and grid
  thresholdLine: ThresholdLine;
  grid: GridOptions;

  // Axes configuration
  categoryAxes: CategoryAxis[];
  valueAxes: ValueAxis[];
}

const defaultLineChartStyles: LineChartStyleControls = {
  // Basic controls
  addTooltip: true,
  addLegend: true,
  legendPosition: Positions.RIGHT,
  addTimeMarker: false,

  showLine: true,
  lineMode: 'smooth',
  lineWidth: 2,
  showDots: true,

  // Threshold and grid
  thresholdLine: {
    color: '#E7664C',
    show: false,
    style: 'full',
    value: 10,
    width: 1,
  },
  grid: {
    categoryLines: true,
    valueLines: true,
  },

  // Category axes
  categoryAxes: [
    {
      id: 'CategoryAxis-1',
      type: 'category',
      position: 'bottom',
      show: true,
      style: {},
      scale: {
        type: 'linear',
      },
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
      position: 'left',
      show: true,
      style: {},
      scale: {
        type: 'linear',
        mode: 'normal',
        defaultYExtents: false,
        setYExtents: false,
      },
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

export const createLineConfig = (): VisualizationType => ({
  name: 'line',
  type: 'line',
  toExpression,
  ui: {
    style: {
      defaults: defaultLineChartStyles,
      render: (props: LineVisStyleControlsProps) =>
        React.createElement(LineVisStyleControls, props),
    },
  },
});
