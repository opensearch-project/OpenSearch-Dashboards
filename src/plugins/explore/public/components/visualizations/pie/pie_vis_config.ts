/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';

import { PieVisStyleControls } from './pie_vis_options';
import { Positions } from '../types';

export interface PieExclusiveStyleControl {
  donut: boolean;
  showValues: boolean;
  showLabels: boolean;
  truncate: number;
  // Todo:  shall we support 2 layers pie chart?
  showTopLevelOnly?: boolean;
}
export interface PieChartStyleControls {
  // Basic controls
  addTooltip: boolean;
  addLegend: boolean;
  legendPosition: Positions;

  // Exclusive controls
  exclusive: PieExclusiveStyleControl;
}

export const defaultPieChartStyles: PieChartStyleControls = {
  // Basic controls
  addTooltip: true,
  addLegend: true,
  legendPosition: Positions.RIGHT,
  exclusive: {
    donut: true,
    showValues: true,
    showLabels: false,
    truncate: 100,
  },
};

export const createPieConfig = (): VisualizationType<'pie'> => ({
  name: 'pie',
  type: 'pie',
  ui: {
    style: {
      defaults: defaultPieChartStyles,
      render: (props) => React.createElement(PieVisStyleControls, props),
    },
  },
});
