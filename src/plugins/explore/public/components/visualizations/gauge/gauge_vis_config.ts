/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { GaugeVisStyleControls } from './gauge_vis_options';
import { Threshold, AxisRole, VisFieldType, UnitItem } from '../types';
import { CalculationMethod } from '../utils/calculation';
import { getColors } from '../theme/default_colors';

export interface GaugeChartStyleControls {
  showTitle: boolean;
  title: string;
  min?: number;
  max?: number;
  baseColor: string;
  thresholds: Threshold[];
  valueCalculation: CalculationMethod;
  unitId?: string;
}

export const defaultGaugeChartStyles: GaugeChartStyleControls = {
  showTitle: true,
  title: '',
  thresholds: [],
  baseColor: getColors().statusGreen,
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
