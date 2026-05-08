/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricChartStyle } from './metric_vis_config';
import { AxisRole, VisColumn, RendererSpecConfig } from '../types';
import { assembleSpec, buildAxisConfigs, createBaseConfig, pipe } from '../utils/echarts_spec';
import { convertTo2DArray, transform } from '../utils/data_transformation';
import { assembleForMetric, createMetricChartSeries } from './metric_utils';

export interface MetricAxisMapping {
  [AxisRole.Value]: VisColumn;
  [AxisRole.Time]?: VisColumn;
  [AxisRole.FACET]?: VisColumn;
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
    axisConfig: {},
    axisColumnMappings,
  });
  return { spec: result.spec, name: numericFieldName, data: transformedData };
};

export const createMultiMetric = (
  transformedData: Array<Record<string, any>>,
  styles: MetricChartStyle,
  axisColumnMappings: {
    [AxisRole.Value]: VisColumn;
    [AxisRole.Time]?: VisColumn;
    [AxisRole.FACET]: VisColumn;
  }
) => {
  const valueMapping = axisColumnMappings[AxisRole.Value];
  const splitByMapping = axisColumnMappings[AxisRole.FACET];
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

  const singleMapping: { [AxisRole.Value]: VisColumn; [AxisRole.Time]?: VisColumn } = {
    [AxisRole.Value]: valueMapping,
    ...(axisColumnMappings[AxisRole.Time] && {
      [AxisRole.Time]: axisColumnMappings[AxisRole.Time],
    }),
  };

  const specs: RendererSpecConfig[] = [];
  for (const [key, value] of groupedData) {
    const result = createSingleMetric(value, styles, singleMapping);
    if (result && 'spec' in result) {
      specs.push({ spec: result.spec, name: key, data: value });
    }
  }

  return specs;
};
