/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScatterChartStyle } from './scatter_vis_config';
import { AxisRole, VisColumn } from '../types';
import { getAxisConfig } from '../utils/utils';
import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  buildVisMap,
  collectLegend,
} from '../utils/echarts_spec';
import {
  createScatterSeries,
  createCategoryScatterSeries,
  createSizeScatterSeries,
  assembleScatterSpec,
} from './scatter_chart_utils';
import { convertTo2DArray, transform, pivot } from '../utils/data_transformation';
import { ColorMap } from '../utils/color_map';

export const createTwoMetricScatter = (
  transformedData: Array<Record<string, any>>,
  styles: ScatterChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn },
  onLegend?: (legend: ColorMap) => void
): any => {
  const axisConfig = getAxisConfig(styles);
  const xCol = axisColumnMappings[AxisRole.X];
  const yCol = axisColumnMappings[AxisRole.Y];

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);

  const result = pipe(
    transform(convertTo2DArray(allColumns)),
    createBaseConfig({}),
    buildAxisConfigs,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h === yCol.column),
    }),
    createScatterSeries({
      styles,
      xField: xCol.column,
      yField: yCol.column,
    }),
    collectLegend(onLegend),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings,
  });

  return result.spec;
};

export const createTwoMetricOneCateScatter = (
  transformedData: Array<Record<string, any>>,
  styles: ScatterChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  },
  onLegend?: (legend: ColorMap) => void
): any => {
  const axisConfig = getAxisConfig(styles);
  const xCol = axisColumnMappings[AxisRole.X];
  const yCol = axisColumnMappings[AxisRole.Y];
  const colorCol = axisColumnMappings[AxisRole.COLOR];

  const result = pipe(
    transform(
      pivot({
        groupBy: xCol.column,
        pivot: colorCol.column,
        field: yCol.column,
      }),
      convertTo2DArray()
    ),
    createBaseConfig({}),
    buildAxisConfigs,
    createCategoryScatterSeries({
      styles,
      xField: xCol.column,
      yField: yCol.column,
      colorField: colorCol.column,
    }),
    collectLegend(onLegend),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings,
  });

  return result.spec;
};

export const createThreeMetricOneCateScatter = (
  transformedData: Array<Record<string, any>>,
  styles: ScatterChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
    [AxisRole.SIZE]: VisColumn;
  },
  onLegend?: (legend: ColorMap) => void
): any => {
  const axisConfig = getAxisConfig(styles);
  const xCol = axisColumnMappings[AxisRole.X];
  const yCol = axisColumnMappings[AxisRole.Y];
  const colorCol = axisColumnMappings[AxisRole.COLOR];
  const sizeCol = axisColumnMappings[AxisRole.SIZE];

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);

  const result = pipe(
    transform(convertTo2DArray(allColumns)),
    createBaseConfig({}),
    buildAxisConfigs,
    createSizeScatterSeries({
      styles,
      xField: xCol.column,
      yField: yCol.column,
      colorField: colorCol.column,
      sizeField: sizeCol.column,
    }),
    collectLegend(onLegend),
    assembleSpec,
    assembleScatterSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings,
  });

  return result.spec;
};
