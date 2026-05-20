/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChartStyle } from './line_vis_config';
import { AxisRole, VisColumn } from '../types';
import { createLineSeries, createLineBarSeries } from './line_chart_utils';
import { getAxisConfig, getColumnsFromAxisColumnMapping } from '../utils/utils';
import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  applyTimeRange,
  collectLegend,
} from '../utils/echarts_spec';
import {
  convertTo2DArray,
  transform,
  pivot,
  sortByTime,
  flatten,
} from '../utils/data_transformation';
import { ColorMap } from '../utils/color_map';

/**
 * Create a simple line chart with one metric and one date
 */
export const createSimpleLineChart = (
  transformedData: Array<Record<string, any>>,
  styles: LineChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] },
  timeRange?: { from: string; to: string },
  onLegend?: (legend: ColorMap) => void
): any => {
  const axisConfig = getAxisConfig(styles);

  const timeField = axisColumnMappings[AxisRole.X].column;
  const valueField = axisColumnMappings[AxisRole.Y].map((y) => y.column);
  const valueFieldNames = axisColumnMappings[AxisRole.Y].map((y) => y.name) ?? [];

  const allColumns = getColumnsFromAxisColumnMapping(axisColumnMappings);

  const result = pipe(
    transform(sortByTime(timeField), convertTo2DArray(allColumns)),
    createBaseConfig({ legend: { show: false } }),
    buildAxisConfigs,
    applyTimeRange,
    createLineSeries({
      styles,
      categoryField: timeField,
      seriesFields: valueField,
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
 * Create a combined line and bar chart with two metrics and one date
 */
export const createLineBarChart = (
  transformedData: Array<Record<string, any>>,
  styles: LineChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn[];
    [AxisRole.Y_SECOND]: VisColumn[];
  },
  timeRange?: { from: string; to: string },
  onLegend?: (legend: ColorMap) => void
): any => {
  const axisConfig = getAxisConfig(styles);

  const timeField = axisColumnMappings.x.column;
  const valueField = axisColumnMappings.y.map((y) => y.column);
  const valueFieldNames = axisColumnMappings.y.map((y) => y.name) ?? [];
  const value2Field = axisColumnMappings.y2.map((y) => y.column);
  const value2FieldNames = axisColumnMappings.y2.map((y) => y.name) ?? [];

  if (!timeField || !valueField || !value2Field) {
    throw Error('Missing axis config or color field for line-bar chart');
  }

  const allColumns = getColumnsFromAxisColumnMapping(axisColumnMappings);

  const result = pipe(
    transform(sortByTime(timeField), convertTo2DArray(allColumns)),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    applyTimeRange,
    createLineBarSeries({ styles, categoryField: timeField, value2Field, valueField }),
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
 * Create a multi-line chart with one metric, one date, and one categorical column
 */
export const createMultiLineChart = (
  transformedData: Array<Record<string, any>>,
  styles: LineChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  },
  timeRange?: { from: string; to: string },
  onLegend?: (legend: ColorMap) => void
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
      }),
      flatten(),
      convertTo2DArray()
    ),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    applyTimeRange,
    createLineSeries({
      styles,
      categoryField: timeField,
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
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
 * Create a category-based line chart with one metric and one category
 */
export const createCategoryLineChart = (
  transformedData: Array<Record<string, any>>,
  styles: LineChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] },
  onLegend?: (legend: ColorMap) => void
): any => {
  const axisConfig = getAxisConfig(styles);

  const categoryField = axisColumnMappings[AxisRole.X].column;
  const valueField = axisColumnMappings[AxisRole.Y].map((y) => y.column);
  const valueFieldNames = axisColumnMappings[AxisRole.Y].map((y) => y.name) ?? [];

  const allColumns = getColumnsFromAxisColumnMapping(axisColumnMappings);

  const result = pipe(
    transform(convertTo2DArray(allColumns)),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    createLineSeries({
      styles,
      categoryField,
      seriesFields: valueField,
      addTimeMarker: false,
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

export const createCategoryMultiLineChart = (
  transformedData: Array<Record<string, any>>,
  styles: LineChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  },
  onLegend?: (legend: ColorMap) => void
): any => {
  const axisConfig = getAxisConfig(styles);

  const cateField = axisColumnMappings[AxisRole.X].column;
  const valueField = axisColumnMappings[AxisRole.Y].column;
  const colorField = axisColumnMappings[AxisRole.COLOR].column;

  const result = pipe(
    transform(
      pivot({
        groupBy: cateField,
        pivot: colorField,
        field: valueField,
      }),
      flatten(),
      convertTo2DArray()
    ),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    createLineSeries({
      styles,
      categoryField: cateField,
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== cateField),
      addTimeMarker: false,
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
