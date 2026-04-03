/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';
import { BarGaugeVisStyleControls } from './bar_gauge_vis_options';
import { TitleOptions, AxisRole, VisFieldType, ThresholdOptions, TooltipOptions } from '../types';
import { CalculationMethod } from '../utils/calculation';
import { getColors } from '../theme/default_colors';
import { createBarGaugeSpec } from './to_expression';
import { EchartsRender } from '../echarts_render';

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
  name: 'Bar Gauge',
  icon: 'visBarHorizontal',
  type: 'bar_gauge',
  getRules: () => {
    const rules: Array<VisRule<'bar_gauge'>> = [
      {
        priority: 80,
        mappings: [
          {
            [AxisRole.Y]: { type: VisFieldType.Numerical },
            [AxisRole.X]: { type: VisFieldType.Categorical },
          },
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const spec = createBarGaugeSpec(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
          return <EchartsRender spec={spec} />;
        },
      },
    ];
    return rules;
  },
  ui: {
    style: {
      defaults: defaultBarGaugeChartStyles,
      render: (props) => React.createElement(BarGaugeVisStyleControls, props),
    },
  },
});
