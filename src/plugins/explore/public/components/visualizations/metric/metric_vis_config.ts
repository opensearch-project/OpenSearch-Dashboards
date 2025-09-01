/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { MetricVisStyleControls } from './metric_vis_options';
import { RangeValue, ColorSchemas, AxisRole, VisFieldType } from '../types';

export type TextAlignment = 'auto' | 'center';

export interface MetricChartStyleControls {
  showTitle: boolean;
  title: string;
  fontSize?: number;
  titleSize?: number;
  useColor: boolean;
  colorSchema: ColorSchemas;
  valueCalculation: string;
  customRanges?: RangeValue[];
}

export const defaultMetricChartStyles: MetricChartStyleControls = {
  showTitle: true,
  title: '',
  useColor: false,
  colorSchema: ColorSchemas.BLUES,
  valueCalculation: 'last',
  // add default range for metric
  customRanges: [{ min: 0, max: 100 }],
};

export const createMetricConfig = (): VisualizationType<'metric'> => ({
  name: 'metric',
  type: 'metric',
  ui: {
    style: {
      defaults: defaultMetricChartStyles,
      render: (props) => React.createElement(MetricVisStyleControls, props),
    },
    availableMappings: [
      {
        [AxisRole.Value]: { type: VisFieldType.Numerical, index: 0 },
      },
      {
        [AxisRole.Value]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Time]: { type: VisFieldType.Date, index: 0 },
      },
    ],
  },
});
