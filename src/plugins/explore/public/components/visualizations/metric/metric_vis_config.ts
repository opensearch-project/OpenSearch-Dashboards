/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationType } from '../utils/use_visualization_types';
import { MetricVisStyleControls } from './metric_vis_options';
import {
  RangeValue,
  ColorSchemas,
  AxisRole,
  VisFieldType,
  PercentageColor,
  UnitItem,
  ThresholdOptions,
} from '../types';
import { CalculationMethod } from '../utils/calculation';
import { getColors } from '../theme/default_colors';

export type TextAlignment = 'auto' | 'center';

export interface MetricChartStyleControls {
  showTitle: boolean;
  title: string;
  fontSize?: number;
  titleSize?: number;
  percentageSize?: number;
  /**
   * @deprecated - use useThresholdColor instead
   */
  useColor?: boolean;
  showPercentage?: boolean;
  /**
   * @deprecated - use global thresholdOptions
   */
  colorSchema?: ColorSchemas;
  valueCalculation?: CalculationMethod;
  percentageColor?: PercentageColor;
  /**
   * @deprecated - use global thresholdOptions instead
   */
  customRanges?: RangeValue[];
  unitId?: string;
  thresholdOptions?: ThresholdOptions;
  min?: number;
  max?: number;
  useThresholdColor?: boolean;
}

// TODO: refactor other type of chart to ensure the default style control object is properly typed
export type DefaultMetricChartStyleControls = MetricChartStyleControls &
  Required<
    Pick<MetricChartStyleControls, 'showPercentage' | 'percentageColor' | 'valueCalculation'>
  >;

export const defaultMetricChartStyles: DefaultMetricChartStyleControls = {
  showTitle: true,
  title: '',
  showPercentage: false,
  percentageColor: 'standard',
  valueCalculation: 'last',
  // useColor: true,
  colorSchema: ColorSchemas.GREENS,
  // customRanges: [{ min: 10, max: 100 }],
  // add default range for metric
  thresholdOptions: {
    baseColor: getColors().statusGreen,
    thresholds: [],
  },
  useThresholdColor: false,
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
