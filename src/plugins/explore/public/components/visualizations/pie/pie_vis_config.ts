/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';

import { PieVisStyleControls } from './pie_vis_options';
import { AxisRole, Positions, TitleOptions, TooltipOptions, VisFieldType } from '../types';
import { LegendOptions } from '../style_panel/legend/legend';

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
  legends: LegendOptions[];
  tooltipOptions: TooltipOptions;

  // Exclusive controls
  exclusive: PieExclusiveStyleControl;

  titleOptions: TitleOptions;
}

export const defaultPieChartStyles: PieChartStyleControls = {
  // Basic controls
  addTooltip: true,
  legends: [{ role: 'color', show: true, position: Positions.RIGHT, title: '' }],
  tooltipOptions: {
    mode: 'all',
  },
  exclusive: {
    donut: true,
    showValues: false,
    showLabels: false,
    truncate: 100,
  },
  titleOptions: {
    show: false,
    titleName: '',
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
    availableMappings: [
      {
        [AxisRole.SIZE]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
      },
    ],
  },
});
