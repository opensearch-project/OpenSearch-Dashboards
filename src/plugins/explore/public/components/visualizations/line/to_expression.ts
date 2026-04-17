/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChartStyle } from './line_vis_config';
import { AxisRole, VisColumn } from '../types';
import { createLineSeries, createLineBarSeries, createFacetLineSeries } from './line_chart_utils';
import { getAxisConfig, getColumnsFromAxisColumnMapping } from '../utils/utils';
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
  styles: LineChartStyle,
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
    createBaseConfig({ title: `${valueFieldNames.join(', ')} Over Time`, legend: { show: false } }),
    buildAxisConfigs,
    applyTimeRange,
    createLineSeries({
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
  timeRange?: { from: string; to: string }
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
      title: `${valueFieldNames.join(', ')} (Bar) and ${value2FieldNames.join(
        ', '
      )} (Line) Over Time`,
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
  styles: LineChartStyle,
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
      }),
      flatten(),
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
  styles: LineChartStyle,
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
      }),
      flatten(),
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
  styles: LineChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] }
): any => {
  const axisConfig = getAxisConfig(styles);

  const categoryField = axisColumnMappings[AxisRole.X].column;
  const valueField = axisColumnMappings[AxisRole.Y].map((y) => y.column);
  const valueFieldNames = axisColumnMappings[AxisRole.Y].map((y) => y.name) ?? [];

  const allColumns = getColumnsFromAxisColumnMapping(axisColumnMappings);

  const result = pipe(
    transform(convertTo2DArray(allColumns)),
    createBaseConfig({
      title: `${valueFieldNames.join(', ')} by ${axisColumnMappings[AxisRole.X].name}`,
      legend: { show: false },
    }),
    buildAxisConfigs,
    createLineSeries({
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

  return result.spec;
};

export const createCategoryMultiLineChart = (
  transformedData: Array<Record<string, any>>,
  styles: LineChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  }
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
      title: `${axisColumnMappings[AxisRole.Y].name} by ${
        axisColumnMappings[AxisRole.X].name
      } and ${axisColumnMappings[AxisRole.COLOR].name}`,
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
