/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricChartStyle } from './metric_vis_config';
import {
  VisColumn,
  AxisRole,
  AxisColumnMappings,
  VisFieldType,
  RendererSpecConfig,
} from '../types';
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
  const numericFieldName = valueColumn?.name;

  const dateColumn = axisColumnMappings?.[AxisRole.Time];
  const dateField = dateColumn?.column;

  if (!numericField) {
    throw Error('Missing value for metric chart');
  }

  if (!dateField) {
    return { spec: undefined, name: numericFieldName, data: transformedData };
  }

  // Return React component spec for HTML text rendering with ECharts sparkline
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
  return { spec: result.spec, name: numericFieldName, data: transformedData };
};

export const createMultiMetric = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: MetricChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  // Get the main value field
  const valueMapping = axisColumnMappings?.[AxisRole.Value];
  if (!valueMapping || valueMapping.schema !== VisFieldType.Numerical) {
    throw Error('Metric visualization requires a numerical value field');
  }

  // Get the split by (categorical) field for faceting
  const splitByMapping = axisColumnMappings?.[AxisRole.FACET];
  if (!splitByMapping || splitByMapping.schema !== VisFieldType.Categorical) {
    throw Error('Multi-metric visualization requires a categorical field for splitting');
  }

  // For multi-metric, we split the data by the categorical field
  const splitByField = splitByMapping.column;

  // Group data by the split by field (categorical)
  const groupedData = new Map<string, any[]>();
  transformedData.forEach((row) => {
    const splitByValue = row[splitByField];
    if (splitByValue === undefined || splitByValue === null) return;
    const groupKey = String(splitByValue);
    if (!groupedData.has(groupKey)) {
      groupedData.set(groupKey, []);
    }
    groupedData.get(groupKey)!.push(row);
  });

  const specs: RendererSpecConfig[] = [];
  for (const [key, value] of groupedData) {
    const result = createSingleMetric(
      value,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styles,
      axisColumnMappings
    );
    if (result && 'spec' in result) {
      specs.push({ spec: result.spec, name: key, data: value });
    }
  }

  return specs;
};
