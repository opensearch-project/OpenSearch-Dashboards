/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../../../view_components/utils/use_visualization_types';
import { MetricVisStyleControlsProps, MetricVisStyleControls } from './metric_vis_options';
import { toExpression } from './to_expression';
import { RangeValue } from '../types';

export interface MetricChartStyleControls {
  showTitle: boolean;
  title: string;
  fontSize: number;
  useColor: boolean;
  customRanges?: RangeValue[];
}

export const defaultMetricChartStyles: MetricChartStyleControls = {
  showTitle: true,
  title: '',
  fontSize: 60,
  useColor: false,
};

export const createMetricConfig = (): VisualizationType => ({
  name: 'metric',
  type: 'metric',
  toExpression,
  ui: {
    style: {
      defaults: defaultMetricChartStyles,
      render: (props: MetricVisStyleControlsProps) =>
        React.createElement(MetricVisStyleControls, props),
    },
  },
});
