/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { MetricVisStyleControls } from './metric_vis_options';
import { RangeValue, ColorSchemas } from '../types';

export interface MetricChartStyleControls {
  showTitle: boolean;
  title: string;
  fontSize: number;
  useColor: boolean;
  colorSchema: ColorSchemas;
  customRanges?: RangeValue[];
}

export const defaultMetricChartStyles: MetricChartStyleControls = {
  showTitle: true,
  title: '',
  fontSize: 60,
  useColor: false,
  colorSchema: ColorSchemas.BLUES,
};

export const createMetricConfig = (): VisualizationType<'metric'> => ({
  name: 'metric',
  type: 'metric',
  ui: {
    style: {
      defaults: defaultMetricChartStyles,
      render: (props) => React.createElement(MetricVisStyleControls, props),
    },
  },
});
