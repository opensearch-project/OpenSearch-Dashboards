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
} from '../utils/echarts_spec';
import {
  createScatterSeries,
  createCategoryScatterSeries,
  createSizeScatterSeries,
} from './scatter_chart_utils';
import { convertTo2DArray, transform, pivot } from '../utils/data_transformation';

export const createTwoMetricScatter = (
  transformedData: Array<Record<string, any>>,
  styles: ScatterChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn }
): any => {
  const axisConfig = getAxisConfig(styles);
  const xCol = axisColumnMappings[AxisRole.X];
  const yCol = axisColumnMappings[AxisRole.Y];

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);

  const result = pipe(
    transform(convertTo2DArray(allColumns)),
    createBaseConfig({ title: `${xCol.name} vs ${yCol.name}` }),
    buildAxisConfigs,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h === yCol.column),
    }),
    createScatterSeries({
      styles,
      xField: xCol.column,
      yField: yCol.column,
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

export const createTwoMetricOneCateScatter = (
  transformedData: Array<Record<string, any>>,
  styles: ScatterChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  }
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
    createBaseConfig({
      title: `${xCol.name} vs ${yCol.name} by ${colorCol.name}`,
    }),
    buildAxisConfigs,
    createCategoryScatterSeries({
      styles,
      xField: xCol.column,
      yField: yCol.column,
      colorField: colorCol.column,
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

export const createThreeMetricOneCateScatter = (
  transformedData: Array<Record<string, any>>,
  styles: ScatterChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
    [AxisRole.SIZE]: VisColumn;
  }
): any => {
  const axisConfig = getAxisConfig(styles);
  const xCol = axisColumnMappings[AxisRole.X];
  const yCol = axisColumnMappings[AxisRole.Y];
  const colorCol = axisColumnMappings[AxisRole.COLOR];
  const sizeCol = axisColumnMappings[AxisRole.SIZE];

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);

  const result = pipe(
    transform(convertTo2DArray(allColumns)),
    createBaseConfig({
      title: `${xCol.name} vs ${yCol.name} by ${colorCol.name} (Size: ${sizeCol.name})`,
    }),
    buildAxisConfigs,
    createSizeScatterSeries({
      styles,
      xField: xCol.column,
      yField: yCol.column,
      colorField: colorCol.column,
      sizeField: sizeCol.column,
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
