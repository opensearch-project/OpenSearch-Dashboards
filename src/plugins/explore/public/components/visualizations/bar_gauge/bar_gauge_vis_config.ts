/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { BarGaugeVisStyleControls } from './bar_gauge_vis_options';
import { TitleOptions, AxisRole, VisFieldType, ThresholdOptions, TooltipOptions } from '../types';
import { CalculationMethod } from '../utils/calculation';
import { getColors } from '../theme/default_colors';

export interface ExclusiveBarGaugeConfig {
  orientation: 'vertical' | 'horizontal';
  displayMode: 'gradient' | 'stack' | 'basic';
  valueDisplay: 'valueColor' | 'textColor' | 'hidden';
  showUnfilledArea: boolean;
}

export interface BarGaugeChartStyleOptions {
  tooltipOptions?: TooltipOptions;
  exclusive?: ExclusiveBarGaugeConfig;
  thresholdOptions?: ThresholdOptions;
  valueCalculation?: CalculationMethod;
  titleOptions?: TitleOptions;
  min?: number;
  max?: number;
  unitId?: string;
}

export type BarGaugeChartStyle = Required<
  Omit<BarGaugeChartStyleOptions, 'min' | 'max' | 'unitId'>
> &
  Pick<BarGaugeChartStyleOptions, 'min' | 'max' | 'unitId'>;

export const defaultBarGaugeChartStyles: BarGaugeChartStyle = {
  tooltipOptions: {
    mode: 'all',
  },
  exclusive: {
    orientation: 'vertical',
    displayMode: 'gradient',
    valueDisplay: 'valueColor',
    showUnfilledArea: true,
  },
  thresholdOptions: { thresholds: [], baseColor: getColors().statusGreen },
  valueCalculation: 'last',
  titleOptions: {
    show: false,
    titleName: '',
  },
};

export const createBarGaugeConfig = (): VisualizationType<'bar_gauge'> => ({
  name: 'bar_gauge',
  type: 'bar_gauge',
  ui: {
    style: {
      defaults: defaultBarGaugeChartStyles,
      render: (props) => React.createElement(BarGaugeVisStyleControls, props),
    },
    availableMappings: [
      {
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
      },
      {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Categorical, index: 0 },
      },
    ],
  },
});
