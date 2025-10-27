/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';

import { PieVisStyleControls } from './pie_vis_options';
import { AxisRole, Positions, TitleOptions, TooltipOptions, VisFieldType } from '../types';

export interface PieExclusiveStyleOptions {
  donut?: boolean;
  showValues?: boolean;
  showLabels?: boolean;
  truncate?: number;
  // Todo:  shall we support 2 layers pie chart?
  showTopLevelOnly?: boolean;
}

export interface PieChartStyleOptions {
  // Basic controls
  addTooltip?: boolean;
  addLegend?: boolean;
  legendPosition?: Positions;
  legendTitle?: string;
  tooltipOptions?: TooltipOptions;

  // Exclusive controls
  exclusive?: PieExclusiveStyleOptions;

  titleOptions?: TitleOptions;
}

export type PieChartStyle = Required<Omit<PieChartStyleOptions, 'legendTitle'>> &
  Pick<PieChartStyleOptions, 'legendTitle'>;

export const defaultPieChartStyles: PieChartStyle = {
  // Basic controls
  addTooltip: true,
  addLegend: true,
  legendPosition: Positions.RIGHT,
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
