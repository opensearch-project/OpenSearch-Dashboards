/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  StandardAxes,
  VisFieldType,
  VisColumn,
  TimeUnit,
  BucketOptions,
  AggregationType,
} from '../types';
import { applyAxisStyling, getSchemaByAxis } from '../utils/utils';
import { BarChartStyle } from './bar_vis_config';
import { getColors, DEFAULT_GREY } from '../theme/default_colors';

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

export const transformIntervelsToTickCount = (interval: TimeUnit | undefined) => {
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
  const encoding: any = {
    field: axis?.column,
    type: getSchemaByAxis(axis),
    axis: applyAxisStyling(axis, axisStyle),
  };

  if (axis?.schema === VisFieldType.Date && interval) {
    encoding.timeUnit = interval;
    encoding.axis.tickCount = transformIntervelsToTickCount(interval);
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
