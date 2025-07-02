/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AreaVisStyleControls } from './area_vis_options';
import { VisualizationType } from '../utils/use_visualization_types';
import {
  CategoryAxis,
  GridOptions,
  ThresholdLines,
  ThresholdLineStyle,
  ValueAxis,
  Positions,
  TooltipOptions,
} from '../types';

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
  grid: GridOptions;

  // Axes configuration
  categoryAxes: CategoryAxis[];
  valueAxes: ValueAxis[];
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

export const createAreaConfig = (): VisualizationType<'area'> => ({
  name: 'area',
  type: 'area',
  ui: {
    style: {
      defaults: defaultAreaChartStyles,
      render: (props) => React.createElement(AreaVisStyleControls, props),
    },
  },
});
