/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScatterChartStyle } from './scatter_vis_config';
import { VisColumn, AxisColumnMappings, AxisRole } from '../types';
import { getSwappedAxisRole } from '../utils/utils';
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
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: ScatterChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

  const xField = axisConfig.xAxis?.column;
  const yField = axisConfig.yAxis?.column;

  if (!xField || !yField) throw Error('Missing axis config for scatter chart');

  const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

  const result = pipe(
    transform(convertTo2DArray(allColumns)),
    createBaseConfig({ title: `${axisConfig.xAxis?.name} vs ${axisConfig.yAxis?.name}` }),
    buildAxisConfigs,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h === yField),
    }),
    createScatterSeries({
      styles,
      xField,
      yField,
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

export const createTwoMetricOneCateScatter = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: ScatterChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

  const xField = axisConfig.xAxis?.column;
  const yField = axisConfig.yAxis?.column;
  const colorField = axisColumnMappings?.[AxisRole.COLOR]?.column;

  if (!xField || !yField || !colorField)
    throw Error('Missing axis config for colored scatter chart');

  const result = pipe(
    transform(
      pivot({
        groupBy: xField,
        pivot: colorField,
        field: yField,
      }),
      convertTo2DArray()
    ),
    createBaseConfig({
      title: `${axisConfig.xAxis?.name} vs ${axisConfig.yAxis?.name} by ${
        axisColumnMappings?.[AxisRole.COLOR]?.name
      }`,
    }),
    buildAxisConfigs,
    createCategoryScatterSeries({
      styles,
      xField,
      yField,
      colorField,
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

export const createThreeMetricOneCateScatter = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: ScatterChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

  const xField = axisConfig.xAxis?.column;
  const yField = axisConfig.yAxis?.column;
  const colorField = axisColumnMappings?.[AxisRole.COLOR]?.column;
  const sizeField = axisColumnMappings?.[AxisRole.SIZE]?.column;

  if (!xField || !yField || !colorField || !sizeField) {
    throw Error('Missing axis config for size scatter chart');
  }

  const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

  const result = pipe(
    transform(convertTo2DArray(allColumns)),
    createBaseConfig({
      title: `${axisConfig.xAxis?.name} vs ${axisConfig.yAxis?.name} by ${
        axisColumnMappings?.[AxisRole.COLOR]?.name
      } (Size: ${axisColumnMappings?.[AxisRole.SIZE]?.name})`,
    }),
    buildAxisConfigs,
    createSizeScatterSeries({
      styles,
      xField,
      yField,
      colorField,
      sizeField,
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
