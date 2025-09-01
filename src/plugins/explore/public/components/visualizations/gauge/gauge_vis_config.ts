/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { GaugeVisStyleControls } from './gauge_vis_options';
import { ThresholdRangeValue, AxisRole, VisFieldType } from '../types';

export interface GaugeChartStyleControls {
  showTitle: boolean;
  title: string;
  min?: number;
  max?: number;
  baseColor: string;
  thresholdValues: ThresholdRangeValue[];
  valueCalculation: string;
}

export const defaultGaugeChartStyles: GaugeChartStyleControls = {
  showTitle: true,
  title: '',
  thresholdValues: [],
  baseColor: '#9EE9FA',
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
