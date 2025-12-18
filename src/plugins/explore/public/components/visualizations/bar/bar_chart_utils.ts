/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarSeriesOption, CustomSeriesOption } from 'echarts';
import {
  StandardAxes,
  VisFieldType,
  VisColumn,
  TimeUnit,
  BucketOptions,
  AggregationType,
} from '../types';
import { applyAxisStyling, getSchemaByAxis, timeUnitToMs } from '../utils/utils';
import { BarChartStyle } from './bar_vis_config';
import { getColors, DEFAULT_GREY } from '../theme/default_colors';
import { BaseChartStyle, EChartsSpecState, PipelineFn } from '../utils/echarts_spec';

export const inferTimeIntervals = (data: Array<Record<string, any>>, field: string | undefined) => {
  if (!data || data.length === 0 || !field) {
    return TimeUnit.DATE;
  }

  const timestamps = data
    .map((row) => new Date(row[field]).getTime())
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);

  const last = timestamps[timestamps.length - 1];
  const first = timestamps[0];
  const minDiff = last - first;

  const interval = minDiff / 30;

  const second = 1000;
  const minute = 60 * second;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;

  if (interval <= second) return TimeUnit.SECOND;
  if (interval <= minute) return TimeUnit.MINUTE;
  if (interval <= hour) return TimeUnit.HOUR;
  if (interval <= day) return TimeUnit.DATE;
  if (interval <= month) return TimeUnit.MONTH;
  return TimeUnit.YEAR;
};

export const transformIntervalsToTickCount = (interval: TimeUnit | undefined) => {
  switch (interval) {
    case TimeUnit.YEAR:
      return 'year';
    case TimeUnit.MONTH:
      return 'month';
    case TimeUnit.DATE:
      return 'day';
    case TimeUnit.HOUR:
      return 'hour';
    case TimeUnit.MINUTE:
      return 'minute';
    case TimeUnit.SECOND:
      return 'second';
    default:
      return 'day';
  }
};

export const inferBucketSize = (data: Array<Record<string, any>>, field: string | undefined) => {
  if (!data || data.length === 0 || !field) {
    return null;
  }
  const max = data.reduce((acc, row) => Math.max(acc, row[field]), 0);
  const log = Math.floor(Math.log10(max));
  return Math.pow(10, log - 1);
};

export const adjustBucketBins = (
  styles: BucketOptions | undefined,
  data: Array<Record<string, any>>,
  field: string | undefined
) => {
  if (styles?.bucketSize) return { step: styles.bucketSize };
  if (styles?.bucketCount) return { maxbins: styles.bucketCount };
  return { step: inferBucketSize(data, field) };
};

export const buildEncoding = (
  axis: VisColumn | undefined,
  axisStyle: StandardAxes | undefined,
  interval: TimeUnit | undefined,
  aggregationType: AggregationType | undefined
) => {
  const defaultAxisTitle = '';
  const encoding: any = {
    field: axis?.column,
    type: getSchemaByAxis(axis),
    axis: applyAxisStyling({ axis, axisStyle, defaultAxisTitle }),
  };

  if (axis?.schema === VisFieldType.Date && interval) {
    encoding.timeUnit = interval;
    encoding.axis.tickCount = transformIntervalsToTickCount(interval);
  }

  if (axis?.schema === VisFieldType.Numerical && aggregationType) {
    encoding.aggregate = aggregationType;
  }

  return encoding;
};

export const buildTooltipEncoding = (
  axis: VisColumn | undefined,
  axisStyle: StandardAxes | undefined,
  interval: TimeUnit | undefined,
  aggregationType: AggregationType | undefined
) => {
  const encoding: any = {
    field: axis?.column,
    type: getSchemaByAxis(axis),
    title: axisStyle?.title?.text || axis?.name,
  };

  if (axis?.schema === VisFieldType.Date && interval) {
    encoding.timeUnit = interval;
  }

  if (axis?.schema === VisFieldType.Numerical && aggregationType) {
    encoding.aggregate = aggregationType;
    encoding.title = axisStyle?.title?.text || `${axis?.name}(${aggregationType})`;
  }
  return encoding;
};

export const buildThresholdColorEncoding = (
  numericalField: VisColumn | undefined,
  styleOptions: Partial<BarChartStyle>
) => {
  // support old thresholdLines config to be compatible with new thresholds

  const activeThresholds = styleOptions?.thresholdOptions?.thresholds ?? [];

  const thresholdWithBase = [
    { value: 0, color: styleOptions?.thresholdOptions?.baseColor ?? getColors().statusGreen },
    ...activeThresholds,
  ];

  const colorDomain = thresholdWithBase.reduce<number[]>((acc, val) => [...acc, val.value], []);

  const colorRange = thresholdWithBase.reduce<string[]>((acc, val) => [...acc, val.color], []);

  // exclusive for single numerical bucket bar
  if (!numericalField)
    return {
      aggregate: AggregationType.COUNT,
      type: 'quantitative',
      scale: {
        type: 'threshold',
        domain: colorDomain,
        // require one more color for values below the first threshold(base)
        range: [DEFAULT_GREY, ...colorRange],
      },
      legend: styleOptions.addLegend
        ? {
            orient: styleOptions.legendPosition?.toLowerCase() || 'right',
            title: 'Thresholds',
          }
        : null,
    };

  const colorLayer = {
    aggregate: styleOptions?.bucket?.aggregationType,
    field: numericalField?.column,
    type: 'quantitative',
    scale: {
      type: 'threshold',
      domain: colorDomain,
      range: [DEFAULT_GREY, ...colorRange],
    },
    legend: styleOptions.addLegend
      ? {
          orient: styleOptions.legendPosition?.toLowerCase() || 'right',
          title: 'Thresholds',
        }
      : null,
  };

  return colorLayer;
};

/**
 * Create bar series configuration
 */
export const createBarSeries = <T extends BaseChartStyle>(styles: BarChartStyle): PipelineFn<T> => (
  state
) => {
  const { axisConfig, data, baseConfig } = state;
  const newState = { ...state };

  if (!axisConfig) {
    throw new Error('axisConfig must be derived before createBarSeries');
  }

  const numericalAxis = [axisConfig.xAxis, axisConfig.yAxis].find(
    (axis) => axis?.schema === VisFieldType.Numerical
  );
  const dateAxis = [axisConfig.xAxis, axisConfig.yAxis].find(
    (axis) => axis?.schema === VisFieldType.Date
  );

  if (dateAxis) {
    // Calculate bar width based on time unit
    const timeUnit = styles.bucket?.bucketTimeUnit ?? TimeUnit.AUTO;
    const effectiveTimeUnit =
      timeUnit === TimeUnit.AUTO ? inferTimeIntervals(data, dateAxis.column) : timeUnit;

    const series: CustomSeriesOption[] = [
      {
        type: 'custom',
        encode: {
          x: axisConfig.xAxis?.column,
          y: axisConfig.yAxis?.column,
        },
        renderItem: (params, api) => {
          // Check if time is on X or Y axis
          const timeOnXAxis = axisConfig.xAxis?.schema === VisFieldType.Date;
          const timeValue = api.value(0) as number;
          const numValue = api.value(1) as number;

          // Calculate bar width based on the actual date for accurate month/year durations
          const currentDate = new Date(timeValue);
          const barWidthInMs = timeUnitToMs(effectiveTimeUnit, currentDate);

          if (timeOnXAxis) {
            // Vertical bars: time on X-axis, value on Y-axis
            // Get pixel coordinates for the bar's left edge (at timeValue) and right edge (at timeValue + barWidthInMs)
            const startPoint = api.coord([timeValue, numValue]) as number[];
            const endPoint = api.coord([timeValue + barWidthInMs, numValue]) as number[];

            // Calculate bar width in pixels (horizontal extent)
            const barWidth = endPoint[0] - startPoint[0];

            // Calculate bar height in pixels (vertical extent from 0 to numValue)
            const sizeResult = api.size?.([0, numValue]);
            const barHeight = Array.isArray(sizeResult) ? sizeResult[1] : 0;

            return {
              type: 'rect',
              shape: {
                x: startPoint[0], // Left edge at the time tick
                y: startPoint[1], // Top edge at the value height
                width: barWidth, // Horizontal extent (time duration)
                height: barHeight, // Vertical extent (value magnitude)
              },
              style: api.style(),
            };
          } else {
            // Horizontal bars: time on Y-axis, value on X-axis
            // Get pixel coordinates for the bar's left edge (at x=0) and right edge (at x=numValue)
            const startPoint = api.coord([0, timeValue]) as number[];
            const endPoint = api.coord([numValue, timeValue]) as number[];

            // Calculate bar width in pixels (horizontal extent from 0 to numValue)
            const barWidth = endPoint[0] - startPoint[0];

            // Calculate bar height in pixels (vertical extent representing time duration)
            // api.size converts data space [0, barWidthInMs] to pixel space
            const sizeResult = api.size?.([0, barWidthInMs]);
            const barHeight = Array.isArray(sizeResult) ? sizeResult[1] : 0;

            return {
              type: 'rect',
              shape: {
                x: startPoint[0], // Left edge at x=0
                y: startPoint[1] - barHeight, // Top edge (subtract height to position bar correctly)
                width: barWidth, // Horizontal extent (value magnitude)
                height: barHeight, // Vertical extent (time duration)
              },
              style: api.style(),
            };
          }
        },
      },
    ];

    if (baseConfig) {
      baseConfig.tooltip.axisPointer.type = 'none';
    }
    newState.series = series;
  } else {
    const series: BarSeriesOption[] = [
      {
        type: 'bar',
        encode: {
          x: axisConfig.xAxis?.column,
          y: axisConfig.yAxis?.column,
        },
        name: numericalAxis?.name || '',
        // TODO: barWidth and barCategoryGap seems are exclusive, we need to revise the current UI for this config
        barWidth:
          styles.barSizeMode === 'manual' ? `${(styles.barWidth || 0.7) * 100}%` : undefined,
        barCategoryGap:
          styles.barSizeMode === 'manual' ? `${(styles.barPadding || 0.1) * 100}%` : undefined,
      },
    ];
    newState.series = series;
  }

  newState.series?.forEach((s) => {
    if (styles.showBarBorder) {
      s.itemStyle = {
        borderWidth: styles.barBorderWidth,
        borderColor: styles.barBorderColor,
      };
    }
  });

  return newState;
};

/**
 * Extend time axis range to accommodate bar width
 * This is bar-chart specific and should only be chained in bar chart pipelines
 */
export const extendTimeAxisForBarWidth = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const { axisConfig, aggregatedData, styles, data, xAxisConfig, yAxisConfig } = state;

  if (!axisConfig || !aggregatedData || !xAxisConfig || !yAxisConfig) {
    return state;
  }

  const dateAxis = [axisConfig.xAxis, axisConfig.yAxis].find(
    (axis) => axis?.schema === VisFieldType.Date
  );

  if (!dateAxis) {
    return state;
  }

  const timeUnit = styles.bucket?.bucketTimeUnit ?? TimeUnit.AUTO;
  const effectiveTimeUnit =
    timeUnit === TimeUnit.AUTO ? inferTimeIntervals(data, dateAxis.column) : timeUnit;

  // Get the last data point (skip header row at index 0)
  const lastDataPoint = aggregatedData[aggregatedData.length - 1];
  if (lastDataPoint && lastDataPoint[0] instanceof Date) {
    const lastDate = lastDataPoint[0];
    const lastTime = lastDate.getTime();

    // Calculate bar width based on the actual last date for accurate month/year durations
    const barWidthInMs = timeUnitToMs(effectiveTimeUnit, lastDate);
    const extendedMax = new Date(lastTime + barWidthInMs);

    if (xAxisConfig.type === 'time') {
      xAxisConfig.max = extendedMax;
    }
    if (yAxisConfig.type === 'time') {
      yAxisConfig.max = extendedMax;
    }
  }

  return state;
};
