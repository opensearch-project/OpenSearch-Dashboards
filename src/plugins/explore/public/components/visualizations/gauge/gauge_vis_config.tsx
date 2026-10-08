/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';
import { GaugeVisStyleControls } from './gauge_vis_options';
import { ThresholdOptions, AxisRole, VisFieldType, Threshold, StandardOptions } from '../types';
import { CalculationMethod } from '../utils/calculation';
import { getColors } from '../theme/default_colors';
import { createGauge } from './to_expression';
import { GaugeChartRender } from './gauge_component';

export interface GaugeChartStyleOptions extends StandardOptions {
  showTitle?: boolean;
  title?: string;

  /**
   * @deprecated - use thresholdOptions instead
   */
  baseColor?: string;
  /**
   * @deprecated - use thresholdOptions instead
   */
  thresholds?: Threshold[];
  valueCalculation?: CalculationMethod;
  thresholdOptions?: ThresholdOptions;
  useThresholdColor?: boolean;
}

export type GaugeChartStyle = Required<
  Omit<
    GaugeChartStyleOptions,
    'min' | 'max' | 'unitId' | 'unitSuffix' | 'decimals' | 'baseColor' | 'thresholds'
  >
> &
  Pick<GaugeChartStyleOptions, 'min' | 'max' | 'unitId' | 'unitSuffix' | 'decimals'>;

export const defaultGaugeChartStyles: GaugeChartStyle = {
  showTitle: true,
  title: '',
  thresholdOptions: {
    thresholds: [],
    baseColor: getColors().statusGreen,
  },
  useThresholdColor: false,
  valueCalculation: 'last',
};

export const createGaugeConfig = (): VisualizationType<'gauge'> => ({
  name: 'Gauge',
  icon: 'visGauge',
  type: 'gauge',
  getRules: () => {
    const rules: Array<VisRule<'gauge'>> = [
      {
        priority: 80,
        mappings: [
          {
            [AxisRole.Value]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const value = props.axisColumnMappings.value?.[0];
          if (!value) throw Error('Missing axis config for gauge chart');
          const gauge = createGauge(props.data, props.styleOptions, {
            [AxisRole.Value]: value,
          });
          return (
            <GaugeChartRender
              spec={gauge.spec}
              text={gauge.text}
              seriesName={props.renderContext?.seriesName}
            />
          );
        },
      },
    ];
    return rules;
  },
  ui: {
    style: {
      defaults: defaultGaugeChartStyles,
      render: (props) => React.createElement(GaugeVisStyleControls, props),
    },
  },
});
