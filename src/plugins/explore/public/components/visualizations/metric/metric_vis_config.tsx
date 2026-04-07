/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisRule, VisualizationType } from '../utils/use_visualization_types';
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
import { createSingleMetric, createMultiMetric } from './to_expression';
import { MetricChartRender } from './metric_component';

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
  name: 'Metric',
  icon: 'visMetric',
  type: 'metric',
  getRules: () => {
    const rules: Array<VisRule<'metric'>> = [
      {
        priority: 100,
        mappings: [
          {
            [AxisRole.Value]: { type: VisFieldType.Numerical },
          },
        ],
        render(props) {
          const spec = createSingleMetric(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
          return (
            <MetricChartRender
              spec={spec}
              styles={props.styleOptions}
              axisColumnMappings={props.axisColumnMappings}
            />
          );
        },
      },
      {
        priority: 40,
        mappings: [
          {
            [AxisRole.Value]: { type: VisFieldType.Numerical },
            [AxisRole.Time]: { type: VisFieldType.Date },
          },
        ],
        render(props) {
          const spec = createSingleMetric(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
          return (
            <MetricChartRender
              spec={spec}
              styles={props.styleOptions}
              axisColumnMappings={props.axisColumnMappings}
            />
          );
        },
      },
      {
        priority: 50,
        mappings: [
          {
            [AxisRole.Value]: { type: VisFieldType.Numerical },
            [AxisRole.FACET]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const specs = createMultiMetric(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
          return (
            <MetricChartRender
              spec={specs}
              styles={props.styleOptions}
              axisColumnMappings={props.axisColumnMappings}
            />
          );
        },
      },
      {
        priority: 50,
        mappings: [
          {
            [AxisRole.Value]: { type: VisFieldType.Numerical },
            [AxisRole.Time]: { type: VisFieldType.Date },
            [AxisRole.FACET]: { type: VisFieldType.Categorical },
          },
        ],
        render(props) {
          const specs = createMultiMetric(
            props.transformedData,
            props.styleOptions,
            props.axisColumnMappings
          );
          return (
            <MetricChartRender
              spec={specs}
              styles={props.styleOptions}
              axisColumnMappings={props.axisColumnMappings}
            />
          );
        },
      },
    ];
    return rules;
  },
  ui: {
    style: {
      defaults: defaultMetricChartStyles,
      render: (props) => React.createElement(MetricVisStyleControls, props),
    },
  },
});
