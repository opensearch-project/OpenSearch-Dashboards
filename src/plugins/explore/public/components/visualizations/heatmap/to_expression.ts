/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeatmapChartStyle } from './heatmap_vis_config';
import { AxisRole, VisColumn, AggregationType } from '../types';
import { getAxisConfig } from '../utils/utils';
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
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  }
) => {
  const axisConfig = getAxisConfig(styles);
  const xCol = axisColumnMappings[AxisRole.X];
  const yCol = axisColumnMappings[AxisRole.Y];
  const colorCol = axisColumnMappings[AxisRole.COLOR];

  const result = pipe(
    transform(
      aggregateByGroups({
        groupBy: [xCol.column, yCol.column],
        field: colorCol.column,
        aggregationType: AggregationType.SUM,
      }),
      convertTo2DArray()
    ),
    createBaseConfig({
      title: `${colorCol.name} by ${xCol.name} and ${yCol.name}`,
      addTrigger: false,
      legend: { show: styles.addLegend },
    }),
    buildAxisConfigs,
    buildVisMap({
      seriesFields: (headers) =>
        (headers ?? []).filter((h) => h !== yCol.column && h !== xCol.column),
    }),
    createHeatmapSeries({
      styles,
      categoryFields: [xCol.column, yCol.column],
      seriesField: colorCol.column,
    }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings,
  });

  return result.spec;
};
