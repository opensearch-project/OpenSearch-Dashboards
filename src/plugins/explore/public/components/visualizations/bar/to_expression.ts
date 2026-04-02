/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AxisColumnMappings,
  AxisRole,
  VisColumn,
  VisFieldType,
  TimeUnit,
  AggregationType,
} from '../types';
import { BarChartStyle, defaultBarChartStyles } from './bar_vis_config';
import { getSwappedAxisRole } from '../utils/utils';

import { createBarSeries, createFacetBarSeries } from './bar_chart_utils';
import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  buildVisMap,
  applyTimeRange,
} from '../utils/echarts_spec';
import {
  aggregate,
  convertTo2DArray,
  transform,
  pivot,
  facetTransform,
} from '../utils/data_transformation';

export const createBarSpec = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const styles = { ...defaultBarChartStyles, ...styleOptions };
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const xAxis = axisConfig.xAxis;
  const yAxis = axisConfig.yAxis;

  if (!xAxis || !yAxis) {
    throw Error('Missing axis config for Bar chart');
  }

  let categoryField = '';
  let valueField = '';

  if (xAxis.schema === VisFieldType.Categorical) {
    categoryField = xAxis.column;
    valueField = yAxis.column;
  } else if (yAxis.schema === VisFieldType.Categorical) {
    categoryField = yAxis.column;
    valueField = xAxis.column;
  }

  const aggregationType = styles.bucket.aggregationType ?? AggregationType.SUM;
  const result = pipe(
    transform(
      aggregate({
        groupBy: categoryField,
        field: valueField,
        aggregationType,
      }),
      convertTo2DArray()
    ),
    createBaseConfig({ title: `${yAxis?.name} by ${xAxis?.name}`, legend: { show: false } }),
    buildAxisConfigs,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
    }),
    createBarSeries({ styles, categoryField, seriesFields: [valueField] }),
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
  numericalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || dateColumns.length === 0) {
    throw new Error('Time bar chart requires at least one numerical column and one date column');
  }

  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const xAxis = axisConfig.xAxis;
  const yAxis = axisConfig.yAxis;

  if (!xAxis || !yAxis) {
    throw Error('Missing axis config for Bar chart');
  }

  let timeField = '';
  let valueField = '';
  if (xAxis.schema === VisFieldType.Date) {
    timeField = xAxis.column;
    valueField = yAxis.column;
  } else if (yAxis.schema === VisFieldType.Date) {
    timeField = yAxis.column;
    valueField = xAxis.column;
  }

  const timeUnit = styles.bucket?.bucketTimeUnit ?? TimeUnit.AUTO;
  const aggregationType = styles.bucket.aggregationType ?? AggregationType.SUM;
  const skipBucketing = styles.bucket.aggregationType === AggregationType.NONE;
  const result = pipe(
    skipBucketing
      ? transform(convertTo2DArray())
      : transform(
          aggregate({
            groupBy: timeField,
            field: valueField,
            timeUnit,
            aggregationType,
          }),
          convertTo2DArray()
        ),
    createBaseConfig({
      title: `${axisColumnMappings?.y?.name} Over Time`,
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
 * Create a grouped time-based bar chart with one metric, one category, and one date
 */
export const createGroupedTimeBarChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  const styles = { ...defaultBarChartStyles, ...styleOptions };
  // Extract configuration before pipeline
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const xAxis = axisConfig.xAxis;
  const yAxis = axisConfig.yAxis;
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
  const colorField = colorColumn?.column;

  if (!xAxis || !yAxis) {
    throw Error('Missing axis config for grouped time bar chart');
  }

  let timeField = '';
  let valueField = '';
  if (xAxis.schema === VisFieldType.Date) {
    timeField = xAxis.column;
    valueField = yAxis.column;
  } else if (yAxis.schema === VisFieldType.Date) {
    timeField = yAxis.column;
    valueField = xAxis.column;
  }

  const timeUnit = styles?.bucket?.bucketTimeUnit ?? TimeUnit.AUTO;
  const aggregationType = styles?.bucket?.aggregationType ?? AggregationType.SUM;
  const skipBucketing = styles.bucket.aggregationType === AggregationType.NONE;

  if (!colorField) {
    throw new Error('Color column is required for grouped time bar chart');
  }

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
      title: `${axisColumnMappings?.y?.name} Over Time by ${colorColumn.name}`,
      legend: { show: styles.addLegend },
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
 * Create a faceted time-based bar chart with one metric, two categories, and one date
 */
export const createFacetedTimeBarChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  const styles = { ...defaultBarChartStyles, ...styleOptions };
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const xAxis = axisConfig.xAxis;
  const yAxis = axisConfig.yAxis;
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
  const colorField = colorColumn?.column;

  const facetColumn = axisColumnMappings?.[AxisRole.FACET]?.column;

  if (!xAxis || !yAxis || !colorField || !facetColumn) {
    throw Error('Missing axis config for facet time bar chart');
  }

  let timeField = '';
  let valueField = '';
  if (xAxis.schema === VisFieldType.Date) {
    timeField = xAxis.column;
    valueField = yAxis.column;
  } else if (yAxis.schema === VisFieldType.Date) {
    timeField = yAxis.column;
    valueField = xAxis.column;
  }

  const timeUnit = styles?.bucket?.bucketTimeUnit ?? TimeUnit.AUTO;
  const aggregationType = styles?.bucket?.aggregationType ?? AggregationType.SUM;
  const skipBucketing = styles.bucket.aggregationType === AggregationType.NONE;

  const result = pipe(
    facetTransform(
      facetColumn,
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
      title: `${axisColumnMappings.y?.name} Over Time by ${axisColumnMappings.color?.name} (Faceted by ${axisColumnMappings.facet?.name})`,
    }),
    buildAxisConfigs,
    applyTimeRange,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
    }),
    createFacetBarSeries({
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

export const createStackedBarSpec = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const styles = { ...defaultBarChartStyles, ...styleOptions };
  // Extract configuration before pipeline
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const xAxis = axisConfig.xAxis;
  const yAxis = axisConfig.yAxis;
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];
  const colorField = colorMapping?.column;

  if (!xAxis || !yAxis) {
    throw Error('Missing axis config for stacked bar chart');
  }

  let categoryField = '';
  let valueField = '';
  if (xAxis.schema === VisFieldType.Categorical) {
    categoryField = xAxis.column;
    valueField = yAxis.column;
  } else if (yAxis.schema === VisFieldType.Categorical) {
    categoryField = yAxis.column;
    valueField = xAxis.column;
  }

  const aggregationType = styles?.bucket?.aggregationType ?? AggregationType.SUM;

  if (!colorField) {
    throw new Error('Color column is required for stacked bar chart');
  }

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
      title: `${axisColumnMappings?.y?.name} by ${axisColumnMappings?.x?.name} and ${colorMapping.name}`,
      legend: { show: styles.addLegend },
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

export const createDoubleNumericalBarChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const styles = { ...defaultBarChartStyles, ...styleOptions };
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const xAxis = axisConfig.xAxis;
  const yAxis = axisConfig.yAxis;

  if (!xAxis || !yAxis) {
    throw Error('Missing axis config for Bar chart');
  }

  let categoryField = '';
  let valueField = '';

  categoryField = styles.switchAxes ? yAxis.column : xAxis.column;
  valueField = styles.switchAxes ? xAxis.column : yAxis.column;

  const aggregationType = styles.bucket.aggregationType ?? AggregationType.SUM;
  const result = pipe(
    transform(
      aggregate({
        groupBy: categoryField,
        field: valueField,
        aggregationType,
      }),
      convertTo2DArray()
    ),
    createBaseConfig({ title: `${xAxis?.name} with ${yAxis?.name}`, legend: { show: false } }),
    buildAxisConfigs,
    buildVisMap({
      seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
    }),
    createBarSeries({ styles, categoryField, seriesFields: [valueField] }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
  });

  // TODO: check if this is needed
  if (styles.switchAxes) {
    result.yAxisConfig.type = 'category';
  } else {
    result.xAxisConfig.type = 'category';
  }

  return result.spec;
};
