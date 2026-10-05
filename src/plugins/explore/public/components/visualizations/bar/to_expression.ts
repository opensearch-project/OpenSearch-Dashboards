/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisRole, VisFieldType, TimeUnit, AggregationType, VisColumn } from '../types';
import { BarChartStyle } from './bar_vis_config';
import { getAxisConfig, applyPercentageAxis, getNormalizedAxisConfig } from '../utils/utils';

import { createBarSeries, inferTimeIntervals } from './bar_chart_utils';
import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  buildVisMap,
  applyTimeRange,
  addTooltipFormatter,
} from '../utils/echarts_spec';
import { LegendItem } from '../utils/legend';
import {
  aggregate,
  transformStackPercentage,
  convertTo2DArray,
  transform,
  pivot,
} from '../utils/data_transformation';
import { ceilToTimeUnit, roundToTimeUnit } from '../utils/data_transformation/utils/time';
import { seriesDisplayNameTooltipFormatter, axisDisplayNameTooltipFormatter } from '../utils/utils';

const alignTimeRangeToBuckets = (
  timeRange: { from: string; to: string } | undefined,
  timeUnit: TimeUnit | undefined
) => {
  if (!timeRange || !timeUnit) {
    return timeRange;
  }

  const from = new Date(timeRange.from);
  const to = new Date(timeRange.to);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return timeRange;
  }

  return {
    from: roundToTimeUnit(from, timeUnit).toISOString(),
    to: ceilToTimeUnit(to, timeUnit).toISOString(),
  };
};

const includeDataInTimeRange = (
  timeRange: { from: string; to: string } | undefined,
  data: Array<Record<string, any>>,
  timeField: string
) => {
  if (!timeRange) {
    return timeRange;
  }

  const from = new Date(timeRange.from);
  const to = new Date(timeRange.to);
  let minTimestamp = Infinity;
  let maxTimestamp = -Infinity;
  data.forEach((row) => {
    const timestamp = new Date(row[timeField]).getTime();
    if (!isNaN(timestamp)) {
      minTimestamp = Math.min(minTimestamp, timestamp);
      maxTimestamp = Math.max(maxTimestamp, timestamp);
    }
  });
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || !isFinite(minTimestamp)) {
    return timeRange;
  }

  return {
    from: new Date(Math.min(from.getTime(), minTimestamp)).toISOString(),
    to: new Date(Math.max(to.getTime(), maxTimestamp)).toISOString(),
  };
};
export const createBarSpec = (
  transformedData: Array<Record<string, any>>,
  styles: BarChartStyle,
  axisColumnMappings:
    | { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] }
    | { [AxisRole.X]: VisColumn[]; [AxisRole.Y]: VisColumn },
  seriesDisplayNames?: Record<string, string>
): { spec: any; legendItems: LegendItem[] } => {
  const axisConfig = getAxisConfig(styles);

  const { categoryField, categoryEncode, seriesFields, seriesEncode } =
    getNormalizedAxisConfig(axisColumnMappings);

  const aggregationType = styles.bucket.aggregationType ?? AggregationType.SUM;
  const result = pipe(
    transform(
      aggregate({
        groupBy: categoryField,
        field: seriesFields,
        aggregationType,
      }),
      transformStackPercentage(styles, { excludeFields: [categoryField] }),
      convertTo2DArray()
    ),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    applyPercentageAxis(styles),
    addTooltipFormatter(axisDisplayNameTooltipFormatter),
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
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
    seriesDisplayNames,
  });
  return { spec: result.spec, legendItems: result.legendItems ?? [] };
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
  timeRange?: { from: string; to: string }
): { spec: any; legendItems: LegendItem[] } => {
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
  const effectiveTimeUnit = skipBucketing
    ? undefined
    : timeUnit === TimeUnit.AUTO
      ? inferTimeIntervals(transformedData, timeField)
      : timeUnit;
  const visibleTimeRange =
    styles.showFullTimeRange && transformedData.length > 0
      ? effectiveTimeUnit
        ? alignTimeRangeToBuckets(timeRange, effectiveTimeUnit)
        : includeDataInTimeRange(timeRange, transformedData, timeField)
      : timeRange;
  const result = pipe(
    skipBucketing
      ? transform(convertTo2DArray())
      : transform(
          aggregate({
            groupBy: timeField,
            field: seriesFields,
            timeUnit: effectiveTimeUnit,
            aggregationType,
          }),
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
    createBarSeries({
      styles,
      categoryField: timeField,
      seriesFields,
      categoryEncode,
      seriesEncode,
    }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
    timeRange: visibleTimeRange,
  });

  return { spec: result.spec, legendItems: result.legendItems ?? [] };
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
  allData?: Array<Record<string, any>>,
  seriesDisplayNames?: Record<string, string>
): { spec: any; legendItems: LegendItem[] } => {
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
  const effectiveTimeUnit = skipBucketing
    ? undefined
    : timeUnit === TimeUnit.AUTO
      ? inferTimeIntervals(transformedData, timeField)
      : timeUnit;
  const visibleTimeRange =
    styles.showFullTimeRange && transformedData.length > 0
      ? effectiveTimeUnit
        ? alignTimeRangeToBuckets(timeRange, effectiveTimeUnit)
        : includeDataInTimeRange(timeRange, transformedData, timeField)
      : timeRange;

  const result = pipe(
    transform(
      pivot({
        groupBy: timeField,
        pivot: colorField,
        field: valueField,
        timeUnit: effectiveTimeUnit,
        // Pivot requires grouping — when bucketing is disabled, fall back to SUM to group raw timestamps by pivot column
        aggregationType: skipBucketing ? AggregationType.SUM : aggregationType,
      }),
      transformStackPercentage(styles, { excludeFields: [timeField] }),
      convertTo2DArray()
    ),
    createBaseConfig({
      legend: { show: false },
    }),
    buildAxisConfigs,
    applyPercentageAxis(styles),
    applyTimeRange,
    addTooltipFormatter(seriesDisplayNameTooltipFormatter),
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
      allData,
      colorField,
    }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
    timeRange: visibleTimeRange,
    seriesDisplayNames,
  });

  return { spec: result.spec, legendItems: result.legendItems ?? [] };
};

export const createStackedBarSpec = (
  transformedData: Array<Record<string, any>>,
  styles: BarChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  },
  allData?: Array<Record<string, any>>
): { spec: any; legendItems: LegendItem[] } => {
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
    createBarSeries({
      styles,
      categoryField,
      seriesFields(headers) {
        return (headers ?? []).filter((h) => h !== categoryField);
      },
      categoryEncode,
      seriesEncode,
      allData,
      colorField,
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

export const createDoubleNumericalBarChart = (
  transformedData: Array<Record<string, any>>,
  styles: BarChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] }
): { spec: any; legendItems: LegendItem[] } => {
  const axisConfig = getAxisConfig(styles);

  const categoryField = axisColumnMappings[AxisRole.X].column;
  const seriesFields = axisColumnMappings[AxisRole.Y].map((col) => col.column);

  const aggregationType = styles.bucket.aggregationType ?? AggregationType.SUM;
  const result = pipe(
    transform(
      aggregate({
        groupBy: categoryField,
        field: seriesFields,
        aggregationType,
      }),
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
    createBarSeries({
      styles,
      categoryField,
      seriesFields,
      categoryEncode: 'x',
      seriesEncode: 'y',
    }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
  });

  result.xAxisConfig.type = 'category';

  return { spec: result.spec, legendItems: result.legendItems ?? [] };
};
