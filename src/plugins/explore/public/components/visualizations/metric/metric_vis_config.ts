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
  ThresholdOptions,
} from '../types';
import { CalculationMethod } from '../utils/calculation';
import { getColors } from '../theme/default_colors';

export type TextAlignment = 'auto' | 'center';
export type LayoutType = 'horizontal' | 'vertical' | 'auto';
export type TextMode = 'value' | 'name' | 'value_and_name' | 'none';
export type ColorMode = 'none' | 'value' | 'background_gradient' | 'background_solid';

export interface MetricChartStyleOptions {
  showTitle?: boolean;
  title?: string;
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
  layoutType?: LayoutType;
  textMode?: TextMode;
  colorMode?: ColorMode;
}

export type MetricChartStyle = Required<
  Omit<
    MetricChartStyleOptions,
    | 'fontSize'
    | 'titleSize'
    | 'percentageSize'
    | 'unitId'
    | 'colorSchema'
    | 'customRanges'
    | 'useColor'
    | 'min'
    | 'max'
    | 'layoutType'
    | 'textMode'
    | 'colorMode'
  >
> &
  Pick<
    MetricChartStyleOptions,
    | 'fontSize'
    | 'titleSize'
    | 'percentageSize'
    | 'unitId'
    | 'min'
    | 'max'
    | 'layoutType'
    | 'textMode'
    | 'colorMode'
  >;

export const defaultMetricChartStyles: MetricChartStyle = {
  showTitle: true,
  title: '',
  showPercentage: false,
  percentageColor: 'standard',
  valueCalculation: 'last',
  // useColor: true,
  // colorSchema: ColorSchemas.GREENS,
  // customRanges: [{ min: 10, max: 100 }],
  // add default range for metric
  thresholdOptions: {
    baseColor: getColors().statusGreen,
    thresholds: [],
  },
  useThresholdColor: false,
  textMode: 'value_and_name',
  colorMode: 'none',
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
      {
        [AxisRole.Value]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.FACET]: { type: VisFieldType.Categorical, index: 0 },
      },
      {
        [AxisRole.Value]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Time]: { type: VisFieldType.Date, index: 0 },
        [AxisRole.FACET]: { type: VisFieldType.Categorical, index: 0 },
      },
    ],
  },
});
