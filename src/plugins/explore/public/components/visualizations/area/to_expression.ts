/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaChartStyle } from './area_vis_config';
import { VisColumn, AxisColumnMappings, AxisRole, TimeUnit, AggregationType } from '../types';
import { getSwappedAxisRole } from '../utils/utils';
import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  buildVisMap,
  applyTimeRange,
} from '../utils/echarts_spec';
import {
  createAreaSeries,
  createFacetAreaSeries,
  createCategoryAreaSeries,
  createStackAreaSeries,
  replaceNullWithZero,
} from './area_chart_utils';
import {
  convertTo2DArray,
  transform,
  sortByTime,
  pivot,
  facetTransform,
  aggregate,
} from '../utils/data_transformation';

/**
 * Create a simple area chart with one metric and one date
 */
export const createSimpleAreaChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: AreaChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

  const timeField = axisConfig.xAxis?.column;
  const valueField = axisConfig.yAxis?.column;

  if (!valueField || !timeField) throw Error('Missing axis config for area chart');

  const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

  const result = pipe(
    transform(sortByTime(axisColumnMappings?.x?.column), convertTo2DArray(allColumns)),
    createBaseConfig({ title: `${axisConfig.yAxis?.name} Over Time`, legend: { show: false } }),
    buildAxisConfigs,
    applyTimeRange,
    createAreaSeries({
      styles,
      categoryField: timeField,
      seriesFields: [valueField],
    }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
    timeRange,
  });

  return result.spec;
};

/**
 * Create a multi-area chart with one metric, one date, and one categorical column
 */
export const createMultiAreaChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: AreaChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const timeField = axisConfig.xAxis?.column;
  const valueField = axisConfig.yAxis?.column;
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
  const colorField = colorColumn?.column;

  if (!timeField || !valueField || !colorField) {
    throw Error('Missing axis config or color field for multi area chart');
  }
  const result = pipe(
    transform(
      sortByTime(timeField),
      pivot({
        groupBy: timeField,
        pivot: colorField,
        field: valueField,
        timeUnit: TimeUnit.SECOND,
        aggregationType: AggregationType.SUM,
      }),
      (data) => replaceNullWithZero(data, [timeField]),
      convertTo2DArray()
    ),
    createBaseConfig({
      title: `${axisConfig.yAxis?.name} Over Time by ${axisColumnMappings?.[AxisRole.COLOR]?.name}`,
      legend: { show: styles.addLegend },
    }),
    buildAxisConfigs,
    applyTimeRange,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
    }),
    createStackAreaSeries(styles),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
    timeRange,
  });

  return result.spec;
};

/**
 * Create a faceted multi-area chart with one metric, one date, and two categorical columns
 */
export const createFacetedMultiAreaChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: AreaChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const timeField = axisConfig.xAxis?.column;
  const valueField = axisConfig.yAxis?.column;
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
  const colorField = colorColumn?.column;

  const facetColumn = axisColumnMappings?.[AxisRole.FACET]?.column;
  if (!timeField || !valueField || !colorField || !facetColumn) {
    throw Error('Missing axis config for facet area chart');
  }

  const result = pipe(
    facetTransform(
      facetColumn,
      sortByTime(timeField),
      pivot({
        groupBy: timeField,
        pivot: colorField,
        field: valueField,
        timeUnit: TimeUnit.SECOND,
        aggregationType: AggregationType.SUM,
      }),
      (data) => replaceNullWithZero(data, [timeField]),
      convertTo2DArray()
    ),
    createBaseConfig({
      title: `${axisConfig.yAxis?.name} Over Time by ${
        axisColumnMappings?.[AxisRole.COLOR]?.name
      } (Faceted by ${axisColumnMappings?.[AxisRole.FACET]?.name})`,
      legend: { show: styles.addLegend },
    }),
    buildAxisConfigs,
    applyTimeRange,
    createFacetAreaSeries({
      styles,
      categoryField: timeField,
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
    }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
    timeRange,
  });

  return result.spec;
};

/**
 * Create a category-based area chart with one metric and one category
 */
export const createCategoryAreaChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: AreaChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

  const categoryField = axisConfig.xAxis?.column;
  const valueField = axisConfig.yAxis?.column;

  if (!valueField || !categoryField) throw Error('Missing axis config for area chart');

  const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

  const result = pipe(
    transform(
      aggregate({
        groupBy: categoryField,
        field: valueField,
        aggregationType: AggregationType.SUM,
      }),
      convertTo2DArray(allColumns)
    ),
    createBaseConfig({
      title: `${axisConfig.yAxis?.name} by ${axisConfig.xAxis?.name}`,
      legend: { show: false },
    }),
    buildAxisConfigs,
    createCategoryAreaSeries({
      styles,
      categoryField,
      valueField,
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

export const createStackedAreaChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: AreaChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Extract field mappings directly from axisColumnMappings
  const xAxis = axisColumnMappings?.[AxisRole.X];
  const yAxis = axisColumnMappings?.[AxisRole.Y];
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];
  const colorField = colorMapping?.column;

  if (!xAxis || !yAxis || !colorField) {
    throw Error('Missing axis config or color field for stacked area chart');
  }

  const categoryField = xAxis.column;
  const valueField = yAxis.column;

  const result = pipe(
    transform(
      pivot({
        groupBy: categoryField,
        pivot: colorField,
        field: valueField,
        aggregationType: AggregationType.SUM,
      }),
      (data) => replaceNullWithZero(data, [categoryField]),
      convertTo2DArray()
    ),
    createBaseConfig({
      title: `${axisColumnMappings?.y?.name} by ${axisColumnMappings?.x?.name} and ${colorMapping.name}`,
      legend: { show: styles.addLegend },
    }),
    buildAxisConfigs,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
    }),
    createStackAreaSeries(styles),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig: { xAxis, yAxis },
    axisColumnMappings: axisColumnMappings ?? {},
  });

  return result.spec;
};
