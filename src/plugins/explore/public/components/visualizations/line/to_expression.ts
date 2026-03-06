/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChartStyle } from './line_vis_config';
import { VisColumn, AxisColumnMappings, AxisRole } from '../types';
import { createLineSeries, createLineBarSeries, createFacetLineSeries } from './line_chart_utils';
import { getSwappedAxisRole } from '../utils/utils';
import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  applyTimeRange,
} from '../utils/echarts_spec';
import {
  convertTo2DArray,
  transform,
  pivot,
  sortByTime,
  facetTransform,
  flatten,
} from '../utils/data_transformation';

/**
 * Create a simple line chart with one metric and one date
 */
export const createSimpleLineChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: LineChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

  const timeField = axisConfig.xAxis?.column;
  const valueField = axisConfig.yAxis?.column;

  if (!valueField || !timeField) throw Error('Missing axis config for line chart');

  const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

  const result = pipe(
    transform(sortByTime(axisColumnMappings?.x?.column), convertTo2DArray(allColumns)),
    createBaseConfig({ title: `${axisConfig.yAxis?.name} Over Time`, legend: { show: false } }),
    buildAxisConfigs,
    applyTimeRange,
    createLineSeries({
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
 * Create a combined line and bar chart with two metrics and one date
 */
export const createLineBarChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: LineChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

  const timeField = axisConfig.xAxis?.column;
  const valueField = axisConfig.yAxis;
  const value2Field = axisColumnMappings?.[AxisRole.Y_SECOND];

  if (!timeField || !valueField || !value2Field) {
    throw Error('Missing axis config or color field for line-bar chart');
  }

  const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

  const result = pipe(
    transform(sortByTime(axisColumnMappings?.x?.column), convertTo2DArray(allColumns)),
    createBaseConfig({
      title: `${valueField.name} (Bar) and ${value2Field.name} (Line) Over Time`,
      legend: { show: styles.addLegend },
    }),
    buildAxisConfigs,
    applyTimeRange,
    createLineBarSeries({ styles, categoryField: timeField, value2Field, valueField }),
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
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: LineChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const timeField = axisConfig.xAxis?.column;
  const valueField = axisConfig.yAxis?.column;
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
  const colorField = colorColumn?.column;

  if (!timeField || !valueField || !colorField) {
    throw Error('Missing axis config or color field for multi lines chart');
  }

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
      title: `${axisConfig.yAxis?.name} Over Time by ${axisColumnMappings?.[AxisRole.COLOR]?.name}`,
      legend: { show: styles.addLegend },
    }),
    buildAxisConfigs,
    applyTimeRange,
    createLineSeries({
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
 * Create a faceted multi-line chart with one metric, one date, and two categorical columns
 */
export const createFacetedMultiLineChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: LineChartStyle,
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
    throw Error('Missing axis config for facet time line chart');
  }

  const result = pipe(
    facetTransform(
      facetColumn,
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
      title: `${axisConfig.yAxis?.name} Over Time by ${
        axisColumnMappings?.[AxisRole.COLOR]?.name
      } (Faceted by ${axisColumnMappings?.[AxisRole.FACET]?.name})`,
      legend: { show: styles.addLegend },
    }),
    buildAxisConfigs,
    applyTimeRange,
    createFacetLineSeries({
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
 * Create a category-based line chart with one metric and one category
 */
export const createCategoryLineChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: LineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

  const categoryField = axisConfig.xAxis?.column;
  const valueField = axisConfig.yAxis?.column;

  if (!valueField || !categoryField) throw Error('Missing axis config for line chart');

  const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

  const result = pipe(
    transform(convertTo2DArray(allColumns)),
    createBaseConfig({
      title: `${axisConfig.yAxis?.name} by ${axisConfig.xAxis?.name}`,
      legend: { show: false },
    }),
    buildAxisConfigs,
    createLineSeries({
      styles,
      categoryField,
      seriesFields: [valueField],
      addTimeMarker: false,
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

export const createCategoryMultiLineChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: LineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const cateField = axisConfig.xAxis?.column;
  const valueField = axisConfig.yAxis?.column;
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
  const colorField = colorColumn?.column;

  if (!cateField || !valueField || !colorField) {
    throw Error('Missing axis config or color field for multi lines chart');
  }
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
      title: `${axisConfig.yAxis?.name} by ${axisConfig.xAxis?.name} and ${
        axisColumnMappings?.[AxisRole.COLOR]?.name
      }`,
      legend: { show: styles.addLegend },
    }),
    buildAxisConfigs,
    createLineSeries({
      styles,
      categoryField: cateField,
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== cateField),
      addTimeMarker: false,
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
