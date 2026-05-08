/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaChartStyle } from './area_vis_config';
import { AxisRole, VisColumn, TimeUnit, AggregationType } from '../types';
import { getAxisConfig, getColumnsFromAxisColumnMapping } from '../utils/utils';
import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  buildVisMap,
  applyTimeRange,
} from '../utils/echarts_spec';
import { createAreaSeries, createFacetAreaSeries, replaceNullWithZero } from './area_chart_utils';
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
  styles: AreaChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] },
  timeRange?: { from: string; to: string }
): any => {
  const axisConfig = getAxisConfig(styles);

  const timeField = axisColumnMappings[AxisRole.X].column;
  const valueField = axisColumnMappings[AxisRole.Y].map((y) => y.column);
  const valueFieldNames = axisColumnMappings[AxisRole.Y].map((y) => y.name) ?? [];

  const allColumns = getColumnsFromAxisColumnMapping(axisColumnMappings);

  const result = pipe(
    transform(sortByTime(timeField), convertTo2DArray(allColumns)),
    createBaseConfig({
      title: `${valueFieldNames.join(', ')} Over Time`,
      legend: { show: false },
    }),
    buildAxisConfigs,
    applyTimeRange,
    createAreaSeries({
      styles,
      categoryField: timeField,
      seriesFields: valueField,
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
  styles: AreaChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  },
  timeRange?: { from: string; to: string }
): any => {
  const axisConfig = getAxisConfig(styles);

  const timeField = axisColumnMappings[AxisRole.X].column;
  const valueField = axisColumnMappings[AxisRole.Y].column;
  const colorField = axisColumnMappings[AxisRole.COLOR].column;

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
      title: `${axisColumnMappings[AxisRole.Y].name} Over Time by ${
        axisColumnMappings[AxisRole.COLOR].name
      }`,
      legend: { show: styles.addLegend },
    }),
    buildAxisConfigs,
    applyTimeRange,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
    }),
    createAreaSeries({
      styles,
      categoryField: timeField,
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
      stack: true,
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
 * Create a faceted multi-area chart with one metric, one date, and two categorical columns
 */
export const createFacetedMultiAreaChart = (
  transformedData: Array<Record<string, any>>,
  styles: AreaChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
    [AxisRole.FACET]: VisColumn;
  },
  timeRange?: { from: string; to: string }
): any => {
  const axisConfig = getAxisConfig(styles);

  const timeField = axisColumnMappings[AxisRole.X].column;
  const valueField = axisColumnMappings[AxisRole.Y].column;
  const colorField = axisColumnMappings[AxisRole.COLOR].column;
  const facetColumn = axisColumnMappings[AxisRole.FACET].column;

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
      title: `${axisColumnMappings[AxisRole.Y].name} Over Time by ${
        axisColumnMappings[AxisRole.COLOR].name
      } (Faceted by ${axisColumnMappings[AxisRole.FACET].name})`,
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
  styles: AreaChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] }
): any => {
  const axisConfig = getAxisConfig(styles);

  const categoryField = axisColumnMappings[AxisRole.X].column;
  const valueField = axisColumnMappings[AxisRole.Y].map((y) => y.column);
  const valueFieldNames = axisColumnMappings[AxisRole.Y].map((y) => y.name) ?? [];

  const allColumns = getColumnsFromAxisColumnMapping(axisColumnMappings);

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
      title: `${valueFieldNames.join(', ')} by ${axisColumnMappings[AxisRole.X].name}`,
      legend: { show: false },
    }),
    buildAxisConfigs,
    createAreaSeries({
      styles,
      categoryField,
      seriesFields: valueField,
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
  styles: AreaChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  }
): any => {
  const axisConfig = getAxisConfig(styles);

  const categoryField = axisColumnMappings[AxisRole.X].column;
  const valueField = axisColumnMappings[AxisRole.Y].column;
  const colorField = axisColumnMappings[AxisRole.COLOR].column;

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
      title: `${axisColumnMappings[AxisRole.Y].name} by ${
        axisColumnMappings[AxisRole.X].name
      } and ${axisColumnMappings[AxisRole.COLOR].name}`,
      legend: { show: styles.addLegend },
    }),
    buildAxisConfigs,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
    }),
    createAreaSeries({
      styles,
      categoryField,
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
      stack: true,
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
