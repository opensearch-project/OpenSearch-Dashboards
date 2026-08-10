/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaChartStyle } from './area_vis_config';
import { AxisRole, VisColumn, TimeUnit, AggregationType } from '../types';
import {
  getAxisConfig,
  getColumnsFromAxisColumnMapping,
  applyPercentageAxis,
} from '../utils/utils';
import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  buildVisMap,
  applyTimeRange,
} from '../utils/echarts_spec';
import { createAreaSeries, replaceNullWithZero } from './area_chart_utils';
import {
  convertTo2DArray,
  transform,
  sortByTime,
  pivot,
  aggregate,
  connectNullValues,
  disconnectValues,
  resolveStackMode,
  transformStackPercentage,
} from '../utils/data_transformation';
import { LegendItem } from '../utils/legend';

/**
 * Create a simple area chart with one metric and one date
 */
export const createSimpleAreaChart = (
  transformedData: Array<Record<string, any>>,
  styles: AreaChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] },
  timeRange?: { from: string; to: string }
): { spec: any; legendItems: LegendItem[] } => {
  const axisConfig = getAxisConfig(styles);

  const timeField = axisColumnMappings[AxisRole.X].column;
  const valueField = axisColumnMappings[AxisRole.Y].map((y) => y.column);

  const allColumns = getColumnsFromAxisColumnMapping(axisColumnMappings);

  const result = pipe(
    transform(
      sortByTime(timeField),
      connectNullValues(styles, { timeField, seriesFields: valueField }),
      disconnectValues(styles, { timeField, seriesFields: valueField }),
      convertTo2DArray(allColumns)
    ),
    createBaseConfig({
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

  return { spec: result.spec, legendItems: result.legendItems ?? [] };
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
  timeRange?: { from: string; to: string },
  allData?: Array<Record<string, any>>
): { spec: any; legendItems: LegendItem[] } => {
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
      // TODO Bridge short null runs first
      connectNullValues(styles, { timeField }),
      // replaceNullWithZero only matters for stacked area; unstacked areas should keep gaps as gaps.
      (data) =>
        resolveStackMode(styles) === 'none' ? data : replaceNullWithZero(data, [timeField]),
      disconnectValues(styles, { timeField }),
      transformStackPercentage(styles, { excludeFields: [timeField] }),
      convertTo2DArray()
    ),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    applyPercentageAxis(styles),
    applyTimeRange,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
    }),
    createAreaSeries({
      styles,
      categoryField: timeField,
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
      allData,
      colorField,
    }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
    timeRange,
  });

  return { spec: result.spec, legendItems: result.legendItems ?? [] };
};

/**
 * Create a category-based area chart with one metric and one category
 */
export const createCategoryAreaChart = (
  transformedData: Array<Record<string, any>>,
  styles: AreaChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] }
): { spec: any; legendItems: LegendItem[] } => {
  const axisConfig = getAxisConfig(styles);

  const categoryField = axisColumnMappings[AxisRole.X].column;
  const valueField = axisColumnMappings[AxisRole.Y].map((y) => y.column);

  const allColumns = getColumnsFromAxisColumnMapping(axisColumnMappings);

  const result = pipe(
    transform(
      aggregate({
        groupBy: categoryField,
        field: valueField,
        aggregationType: AggregationType.SUM,
      }),
      // transformStackPercentage(styles, { excludeFields: [categoryField] }),
      convertTo2DArray(allColumns)
    ),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    // applyPercentageAxis(styles),
    createAreaSeries({
      styles,
      categoryField,
      seriesFields: valueField,
      addTimeMarker: false,
    }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
  });

  return { spec: result.spec, legendItems: result.legendItems ?? [] };
};

export const createStackedAreaChart = (
  transformedData: Array<Record<string, any>>,
  styles: AreaChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  },
  allData?: Array<Record<string, any>>
): { spec: any; legendItems: LegendItem[] } => {
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
      // replaceNullWithZero only matters for stacked area; unstacked areas should keep gaps as gaps.
      (data) =>
        resolveStackMode(styles) === 'none' ? data : replaceNullWithZero(data, [categoryField]),
      transformStackPercentage(styles, { excludeFields: [categoryField] }),
      convertTo2DArray()
    ),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    applyPercentageAxis(styles),
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
    }),
    createAreaSeries({
      styles,
      categoryField,
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
      allData,
      colorField,
      addTimeMarker: false,
    }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
  });

  return { spec: result.spec, legendItems: result.legendItems ?? [] };
};
