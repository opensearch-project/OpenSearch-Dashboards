/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricChartStyle } from './metric_vis_config';
import { VisColumn, AxisRole, AxisColumnMappings } from '../types';
import { assembleSpec, buildAxisConfigs, createBaseConfig, pipe } from '../utils/echarts_spec';
import { convertTo2DArray, transform } from '../utils/data_transformation';
import { assembleForMetric, createMetricChartSeries } from './metric_utils';

export const createSingleMetric = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: MetricChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  const valueColumn = axisColumnMappings?.[AxisRole.Value];
  const numericField = valueColumn?.column;

  const dateColumn = axisColumnMappings?.[AxisRole.Time];
  const dateField = dateColumn?.column;

  if (!numericField) {
    throw Error('Missing value for metric chart');
  }

  const result = pipe(
    transform(convertTo2DArray()),
    createBaseConfig({ title: '' }),
    buildAxisConfigs,
    createMetricChartSeries({
      styles,
      dateField,
      seriesFields: [numericField],
    }),
    assembleSpec,
    assembleForMetric
  )({
    data: transformedData,
    styles,
    axisConfig: { xAxis: dateColumn, yAxis: valueColumn },
    axisColumnMappings: axisColumnMappings ?? {},
  });
  return result.spec;
};
