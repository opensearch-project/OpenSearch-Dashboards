/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeatmapChartStyle } from './heatmap_vis_config';
import { AxisColumnMappings, AggregationType } from '../types';
import { getSwappedAxisRole } from '../utils/utils';
import { createHeatmapSeries } from './heatmap_chart_utils';

import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  buildVisMap,
} from '../utils/echarts_spec';
import { convertTo2DArray, aggregateByGroups, transform } from '../utils/data_transformation';

export const createRegularHeatmap = (
  transformedData: Array<Record<string, any>>,
  styles: HeatmapChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const xAxis = axisConfig.xAxis;
  const yAxis = axisConfig.yAxis;

  const valueField = axisColumnMappings?.color?.column;
  const valueName = axisColumnMappings?.color?.name;

  if (!xAxis || !yAxis || !valueField) {
    throw Error('Missing axis config for heatmap chart');
  }

  const result = pipe(
    transform(
      aggregateByGroups({
        groupBy: [xAxis.column, yAxis.column],
        field: valueField,
        aggregationType: AggregationType.SUM,
      }),
      convertTo2DArray()
    ),
    createBaseConfig({
      title: `${valueName} by ${xAxis?.name} and ${yAxis?.name}`,
      addTrigger: false,
      legend: { show: styles.addLegend },
    }),
    buildAxisConfigs,
    buildVisMap({
      seriesFields: (headers) =>
        (headers ?? []).filter((h) => h !== yAxis.column && h !== xAxis.column),
    }),
    createHeatmapSeries({
      styles,
      categoryFields: [xAxis.column, yAxis.column],
      seriesField: valueField,
    }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
  });

  return result.spec;
};
