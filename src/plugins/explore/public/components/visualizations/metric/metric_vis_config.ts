/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { MetricVisStyleControls } from './metric_vis_options';
import { RangeValue, ColorSchemas, AxisRole, VisFieldType, PercentageColor } from '../types';
import { CalculationMethod } from '../utils/calculation';

export type TextAlignment = 'auto' | 'center';

export interface MetricChartStyleControls {
  showTitle: boolean;
  title: string;
  fontSize?: number;
  titleSize?: number;
  percentageSize?: number;
  useColor: boolean;
  showPercentage?: boolean;
  colorSchema: ColorSchemas;
  valueCalculation?: CalculationMethod;
  percentageColor?: PercentageColor;
  customRanges?: RangeValue[];
}

// TODO: refactor other type of chart to ensure the default style control object is properly typed
export type DefaultMetricChartStyleControls = MetricChartStyleControls &
  Required<
    Pick<MetricChartStyleControls, 'showPercentage' | 'percentageColor' | 'valueCalculation'>
  >;

export const defaultMetricChartStyles: DefaultMetricChartStyleControls = {
  showTitle: true,
  title: '',
  useColor: false,
  showPercentage: false,
  percentageColor: 'standard',
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
