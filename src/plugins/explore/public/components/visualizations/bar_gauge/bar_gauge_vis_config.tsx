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
import { BarGaugeRender } from './bar_gauge_render';
import { aggregate } from '../utils/data_transformation';

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

          const categoryField = x.schema === VisFieldType.Categorical ? x.column : y.column;
          const valueField = x.schema === VisFieldType.Numerical ? x.column : y.column;
          const isHorizontal = x.schema === VisFieldType.Numerical;

          const aggregated = aggregate({
            groupBy: categoryField,
            field: valueField,
            calculateType: props.styleOptions.valueCalculation,
          })(props.transformedData);

          const gaugeData = aggregated.map((row) => ({
            category: String(row[categoryField]),
            value:
              row[valueField] !== undefined && row[valueField] !== null
                ? Number(row[valueField])
                : null,
          }));

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
