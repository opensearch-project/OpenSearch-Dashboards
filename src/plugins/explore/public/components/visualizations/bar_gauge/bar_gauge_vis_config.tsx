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
            [AxisRole.X]: { type: VisFieldType.Categorical },
            [AxisRole.Y]: { type: VisFieldType.Numerical },
          },
          {
            [AxisRole.X]: { type: VisFieldType.Numerical },
            [AxisRole.Y]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const x = props.axisColumnMappings.x?.[0];
          const y = props.axisColumnMappings.y?.[0];
          if (!x || !y) throw Error('Missing axis config for bar gauge chart');
          const spec = createBarGaugeSpec(props.transformedData, props.styleOptions, {
            [AxisRole.X]: x,
            [AxisRole.Y]: y,
          });
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
