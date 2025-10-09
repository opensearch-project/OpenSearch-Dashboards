/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { GaugeVisStyleControls } from './gauge_vis_options';
import { ThresholdOptions, AxisRole, VisFieldType, Threshold } from '../types';
import { CalculationMethod } from '../utils/calculation';
import { getColors } from '../theme/default_colors';

export interface GaugeChartStyleOptions {
  showTitle?: boolean;
  title?: string;
  min?: number;
  max?: number;

  /**
   * @deprecated - use thresholdOptions instead
   */
  baseColor?: string;
  /**
   * @deprecated - use thresholdOptions instead
   */
  thresholds?: Threshold[];
  valueCalculation?: CalculationMethod;
  unitId?: string;
  thresholdOptions?: ThresholdOptions;
  useThresholdColor?: boolean;
}

export type GaugeChartStyle = Required<
  Omit<GaugeChartStyleOptions, 'min' | 'max' | 'unitId' | 'baseColor' | 'thresholds'>
> &
  Pick<GaugeChartStyleOptions, 'min' | 'max' | 'unitId'>;

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
  name: 'gauge',
  type: 'gauge',
  ui: {
    style: {
      defaults: defaultGaugeChartStyles,
      render: (props) => React.createElement(GaugeVisStyleControls, props),
    },
    availableMappings: [
      {
        [AxisRole.Value]: { type: VisFieldType.Numerical, index: 0 },
      },
    ],
  },
});
