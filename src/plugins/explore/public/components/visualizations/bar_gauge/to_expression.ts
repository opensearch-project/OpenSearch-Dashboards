/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarGaugeChartStyle } from './bar_gauge_vis_config';
import { AxisColumnMappings, VisFieldType } from '../types';
import { getBarOrientation, createBarGaugeSeries, assembleBarGaugeSpec } from './bar_gauge_utils';
import { pipe, createBaseConfig } from '../utils/echarts_spec';
import { aggregate, transform } from '../utils/data_transformation';

export const createBarGaugeSpec = (
  transformedData: Array<Record<string, any>>,
  styleOptions: BarGaugeChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const { xAxis, yAxis } = getBarOrientation(styleOptions, axisColumnMappings);
  if (!xAxis || !yAxis) {
    throw Error('Missing axis config for bar gauge chart');
  }

  let categoryField = '';
  let valueField = '';

  if (xAxis.schema === VisFieldType.Categorical) {
    categoryField = xAxis.column;
    valueField = yAxis.column;
  } else if (yAxis.schema === VisFieldType.Categorical) {
    categoryField = yAxis.column;
    valueField = xAxis.column;
  }

  const result = pipe(
    transform(
      aggregate({
        groupBy: categoryField,
        field: valueField,
        calculateType: styleOptions.valueCalculation,
      })
    ), // Bar gauge uses individual series with custom itemStyle per bar, can't use 2d array format
    createBaseConfig({ title: `${yAxis?.name} by ${xAxis?.name}`, legend: { show: false } }),
    createBarGaugeSeries({ styles: styleOptions, categoryField, valueField }),
    assembleBarGaugeSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisConfig: {},
    axisColumnMappings: axisColumnMappings ?? {},
  });
  return result.spec;
};
