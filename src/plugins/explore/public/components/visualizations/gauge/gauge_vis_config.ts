/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { GaugeVisStyleControls } from './gauge_vis_options';
import { ThresholdRangeValue, AxisRole, VisFieldType, AggregationType } from '../types';

export interface GaugeChartStyleControls {
  showTitle: boolean;
  title: string;
  min?: number;
  max?: number;
  baseColor: string;
  customRanges: ThresholdRangeValue[];
  aggregationType: AggregationType;
}

export const defaultGaugeChartStyles: GaugeChartStyleControls = {
  showTitle: true,
  title: '',
  customRanges: [],
  baseColor: '#9EE9FA',
  aggregationType: AggregationType.MEAN,
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
