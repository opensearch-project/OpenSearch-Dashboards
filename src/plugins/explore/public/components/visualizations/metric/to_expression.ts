/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricChartStyle } from './metric_vis_config';
import { AxisRole, VisColumn } from '../types';
import { assembleSpec, buildAxisConfigs, createBaseConfig, pipe } from '../utils/echarts_spec';
import { convertTo2DArray, transform } from '../utils/data_transformation';
import { assembleForMetric, createMetricChartSeries } from './metric_utils';

export interface MetricAxisMapping {
  [AxisRole.Value]: VisColumn;
  [AxisRole.Time]?: VisColumn;
}

export const createSingleMetric = (
  transformedData: Array<Record<string, any>>,
  styles: MetricChartStyle,
  axisColumnMappings: { [AxisRole.Value]: VisColumn; [AxisRole.Time]?: VisColumn }
) => {
  const valueColumn = axisColumnMappings[AxisRole.Value];
  const numericField = valueColumn.column;
  const numericFieldName = valueColumn.name;

  const dateColumn = axisColumnMappings[AxisRole.Time];
  const dateField = dateColumn?.column;

  if (!dateField) {
    return { spec: undefined, name: numericFieldName, data: transformedData };
  }

  // Return React component spec for HTML text rendering with ECharts sparkline
  const result = pipe(
    transform(convertTo2DArray()),
    createBaseConfig({}),
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
    axisConfig: {},
    axisColumnMappings: {
      [AxisRole.X]: dateColumn,
      [AxisRole.Y]: valueColumn,
    },
  });
  return { spec: result.spec, name: numericFieldName, data: transformedData };
};
