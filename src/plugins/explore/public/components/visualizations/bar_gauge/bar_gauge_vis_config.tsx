/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';
import { BarGaugeVisStyleControls } from './bar_gauge_vis_options';
import {
  AxisRole,
  VisFieldType,
  ThresholdOptions,
  TooltipOptions,
  StandardOptions,
} from '../types';
import { CalculationMethod } from '../utils/calculation';
import { getColors } from '../theme/default_colors';
import { BarGaugeRender } from './bar_gauge_render';
import { aggregate } from '../utils/data_transformation';

export interface ExclusiveBarGaugeConfig {
  displayMode: 'gradient' | 'stack' | 'basic';
  valueDisplay: 'valueColor' | 'textColor' | 'hidden';
  showUnfilledArea: boolean;
  orientation: 'vertical' | 'horizontal';
}

export interface BarGaugeChartStyleOptions extends StandardOptions {
  tooltipOptions?: TooltipOptions;
  exclusive?: ExclusiveBarGaugeConfig;
  thresholdOptions?: ThresholdOptions;
  valueCalculation?: CalculationMethod;
}

export type BarGaugeChartStyle = Required<
  Omit<BarGaugeChartStyleOptions, 'min' | 'max' | 'unitId' | 'unitSuffix' | 'decimals'>
> &
  Pick<BarGaugeChartStyleOptions, 'min' | 'max' | 'unitId' | 'unitSuffix' | 'decimals'>;

export const defaultBarGaugeChartStyles: BarGaugeChartStyle = {
  tooltipOptions: {
    mode: 'all',
  },
  exclusive: {
    displayMode: 'gradient',
    valueDisplay: 'valueColor',
    showUnfilledArea: true,
    orientation: 'vertical',
  },
  thresholdOptions: { thresholds: [], baseColor: getColors().statusGreen },
  valueCalculation: 'last',
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

          const categoryField = x.schema === VisFieldType.Categorical ? x.column : y.column;
          const valueField = x.schema === VisFieldType.Numerical ? x.column : y.column;

          // For orientation, only swap the label visually. Whatever the x-axis schema is, both will share the same style combo.
          const isHorizontal =
            (x.schema === VisFieldType.Numerical &&
              props.styleOptions.exclusive.orientation === 'vertical') ||
            (x.schema !== VisFieldType.Numerical &&
              props.styleOptions.exclusive.orientation === 'horizontal');

          const aggregated = aggregate({
            groupBy: categoryField,
            field: valueField,
            calculateType: props.styleOptions.valueCalculation,
          })(props.data);

          const gaugeData = aggregated.map((row) => {
            return {
              category: String(row[categoryField] ?? '-') || '-',
              value: row[valueField] !== null ? row[valueField] : null,
            };
          });

          return (
            <BarGaugeRender
              data={gaugeData}
              styles={props.styleOptions}
              isHorizontal={isHorizontal}
            />
          );
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
