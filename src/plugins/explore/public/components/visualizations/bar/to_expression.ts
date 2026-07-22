/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisRole, VisFieldType, TimeUnit, AggregationType, VisColumn } from '../types';
import { BarChartStyle } from './bar_vis_config';
import { getAxisConfig } from '../utils/utils';

import { createBarSeries } from './bar_chart_utils';
import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  buildVisMap,
  applyTimeRange,
  collectLegend,
} from '../utils/echarts_spec';
import { ColorMap } from '../utils/color_map';
import { aggregate, convertTo2DArray, transform, pivot } from '../utils/data_transformation';

const getNormalizedAxisConfig = (
  axisColumnMappings:
    | { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] }
    | { [AxisRole.X]: VisColumn[]; [AxisRole.Y]: VisColumn }
) => {
  let categoryField = '';
  let categoryFieldName = '';
  let seriesFields: string[] = [];
  let seriesFieldNames: string[] = [];
  let categoryEncode: 'x' | 'y' = 'x';
  let seriesEncode: 'x' | 'y' = 'y';

  if (!Array.isArray(axisColumnMappings.y) && Array.isArray(axisColumnMappings.x)) {
    categoryField = axisColumnMappings.y.column;
    categoryFieldName = axisColumnMappings.y.name;
    seriesFields = axisColumnMappings.x.map((col) => col.column);
    seriesFieldNames = axisColumnMappings.x.map((col) => col.name);
    categoryEncode = 'y';
    seriesEncode = 'x';
  }
  if (Array.isArray(axisColumnMappings.y) && !Array.isArray(axisColumnMappings.x)) {
    categoryField = axisColumnMappings.x.column;
    categoryFieldName = axisColumnMappings.x.name;
    seriesFields = axisColumnMappings.y.map((col) => col.column);
    seriesFieldNames = axisColumnMappings.y.map((col) => col.name);
    categoryEncode = 'x';
    seriesEncode = 'y';
  }
  return {
    categoryField,
    categoryFieldName,
    categoryEncode,
    seriesFields,
    seriesFieldNames,
    seriesEncode,
  };
};

export const createBarSpec = (
  transformedData: Array<Record<string, any>>,
  styles: BarChartStyle,
  axisColumnMappings:
    | { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] }
    | { [AxisRole.X]: VisColumn[]; [AxisRole.Y]: VisColumn },
  onLegend?: (legend: ColorMap) => void
): any => {
  const axisConfig = getAxisConfig(styles);

  const {
    categoryField,
    categoryFieldName,
    categoryEncode,
    seriesFields,
    seriesFieldNames,
    seriesEncode,
  } = getNormalizedAxisConfig(axisColumnMappings);

  const aggregationType = styles.bucket.aggregationType ?? AggregationType.SUM;
  const result = pipe(
    transform(
      aggregate({
        groupBy: categoryField,
        field: seriesFields,
        aggregationType,
      }),
      convertTo2DArray()
    ),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
    }),
    createBarSeries({
      styles,
      categoryField,
      seriesFields,
      categoryEncode,
      seriesEncode,
    }),
    collectLegend(onLegend),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
  });
  return result.spec;
};

/**
 * Create a time-based bar chart with one metric and one date
 */
export const createTimeBarChart = (
  transformedData: Array<Record<string, any>>,
  styles: BarChartStyle,
  axisColumnMappings:
    | { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] }
    | { [AxisRole.X]: VisColumn[]; [AxisRole.Y]: VisColumn },
  timeRange?: { from: string; to: string },
  onLegend?: (legend: ColorMap) => void
): any => {
  const axisConfig = getAxisConfig(styles);

  const {
    categoryField: timeField,
    categoryEncode,
    seriesFields,
    seriesFieldNames,
    seriesEncode,
  } = getNormalizedAxisConfig(axisColumnMappings);

  const timeUnit = styles.bucket?.bucketTimeUnit ?? TimeUnit.AUTO;
  const aggregationType = styles.bucket.aggregationType ?? AggregationType.SUM;
  const skipBucketing = styles.bucket.aggregationType === AggregationType.NONE;
  const result = pipe(
    skipBucketing
      ? transform(convertTo2DArray())
      : transform(
          aggregate({
            groupBy: timeField,
            field: seriesFields,
            timeUnit,
            aggregationType,
          }),
          convertTo2DArray()
        ),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    applyTimeRange,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
    }),
    createBarSeries({
      styles,
      categoryField: timeField,
      seriesFields,
      categoryEncode,
      seriesEncode,
    }),
    collectLegend(onLegend),
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
 * Create a grouped time-based bar chart with one metric, one category, and one date
 */
export const createGroupedTimeBarChart = (
  transformedData: Array<Record<string, any>>,
  styles: BarChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  },
  timeRange?: { from: string; to: string },
  onLegend?: (legend: ColorMap) => void
): any => {
  const axisConfig = getAxisConfig(styles);

  const xCol = axisColumnMappings[AxisRole.X];
  const yCol = axisColumnMappings[AxisRole.Y];
  const colorField = axisColumnMappings[AxisRole.COLOR].column;

  let timeField = '';
  let valueField = '';
  let valueFieldName = '';
  let categoryEncode: 'x' | 'y' = 'x';
  let seriesEncode: 'x' | 'y' = 'y';
  if (xCol.schema === VisFieldType.Date) {
    timeField = xCol.column;
    valueField = yCol.column;
    valueFieldName = yCol.name;
  } else {
    timeField = yCol.column;
    valueField = xCol.column;
    valueFieldName = xCol.name;
    categoryEncode = 'y';
    seriesEncode = 'x';
  }

  const timeUnit = styles?.bucket?.bucketTimeUnit ?? TimeUnit.AUTO;
  const aggregationType = styles?.bucket?.aggregationType ?? AggregationType.SUM;
  const skipBucketing = styles.bucket.aggregationType === AggregationType.NONE;

  const result = pipe(
    transform(
      pivot({
        groupBy: timeField,
        pivot: colorField,
        field: valueField,
        timeUnit: skipBucketing ? undefined : timeUnit,
        // Pivot requires grouping — when bucketing is disabled, fall back to SUM to group raw timestamps by pivot column
        aggregationType: skipBucketing ? AggregationType.SUM : aggregationType,
      }),
      convertTo2DArray()
    ),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    applyTimeRange,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
    }),
    createBarSeries({
      styles,
      categoryField: timeField,
      seriesFields(headers) {
        return (headers ?? []).filter((h) => h !== timeField);
      },
      categoryEncode,
      seriesEncode,
    }),
    collectLegend(onLegend),
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

export const createStackedBarSpec = (
  transformedData: Array<Record<string, any>>,
  styles: BarChartStyle,
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
  const colorField = axisColumnMappings[AxisRole.COLOR].column;

  let categoryField = '';
  let categoryFieldName = '';
  let valueField = '';
  let valueFieldName = '';
  let categoryEncode: 'x' | 'y' = 'x';
  let seriesEncode: 'x' | 'y' = 'y';
  if (xCol.schema === VisFieldType.Categorical) {
    categoryField = xCol.column;
    categoryFieldName = xCol.name;
    valueField = yCol.column;
    valueFieldName = yCol.name;
  } else {
    categoryField = yCol.column;
    categoryFieldName = yCol.name;
    valueField = xCol.column;
    valueFieldName = xCol.name;
    categoryEncode = 'y';
    seriesEncode = 'x';
  }

  const aggregationType = styles?.bucket?.aggregationType ?? AggregationType.SUM;

  const result = pipe(
    transform(
      pivot({
        groupBy: categoryField,
        pivot: colorField,
        field: valueField,
        aggregationType,
      }),
      convertTo2DArray()
    ),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
    }),
    createBarSeries({
      styles,
      categoryField,
      seriesFields(headers) {
        return (headers ?? []).filter((h) => h !== categoryField);
      },
      categoryEncode,
      seriesEncode,
    }),
    collectLegend(onLegend),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
  });
  return result.spec;
};

export const createDoubleNumericalBarChart = (
  transformedData: Array<Record<string, any>>,
  styles: BarChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] },
  onLegend?: (legend: ColorMap) => void
): any => {
  const axisConfig = getAxisConfig(styles);

  const categoryField = axisColumnMappings[AxisRole.X].column;
  const categoryFieldName = axisColumnMappings[AxisRole.X].name;
  const seriesFields = axisColumnMappings[AxisRole.Y].map((col) => col.column);
  const seriesFieldNames = axisColumnMappings[AxisRole.Y].map((col) => col.name);

  const aggregationType = styles.bucket.aggregationType ?? AggregationType.SUM;
  const result = pipe(
    transform(
      aggregate({
        groupBy: categoryField,
        field: seriesFields,
        aggregationType,
      }),
      convertTo2DArray()
    ),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
    }),
    createBarSeries({
      styles,
      categoryField,
      seriesFields,
      categoryEncode: 'x',
      seriesEncode: 'y',
    }),
    collectLegend(onLegend),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
  });

  result.xAxisConfig.type = 'category';

  return result.spec;
};
