/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupBy } from 'lodash';
import {
  StandardAxes,
  VisFieldType,
  VisColumn,
  TimeUnit,
  BucketOptions,
  AggregationType,
  ValueMapping,
} from '../types';
import { applyAxisStyling, getSchemaByAxis } from '../utils/utils';
import { BarChartStyle } from './bar_vis_config';
import { getColors, DEFAULT_GREY } from '../theme/default_colors';
import { decideScale, generateLabelExpr } from '../style_panel/value_mapping/value_mapping_utils';
import { CalculationMethod, calculateValue } from '../utils/calculation';
import { getCategoryNextColor, resolveColor } from '../theme/color_utils';

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
  aggregationType: AggregationType | undefined,
  disbaleAggregationType: boolean = false
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

  if (axis?.schema === VisFieldType.Numerical && aggregationType && !disbaleAggregationType) {
    encoding.aggregate = aggregationType;
  }

  return encoding;
};

export const buildTooltipEncoding = (
  axis: VisColumn | undefined,
  axisStyle: StandardAxes | undefined,
  interval: TimeUnit | undefined,
  aggregationType: AggregationType | undefined,
  disbaleAggregationType: boolean = false
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
    if (!disbaleAggregationType) {
      encoding.aggregate = aggregationType;
    }
    encoding.title = axisStyle?.title?.text || `${axis?.name}(${aggregationType})`;
  }

  return encoding;
};

export const buildThresholdColorEncoding = (
  numericalField: VisColumn | undefined,
  styleOptions: Partial<BarChartStyle>,
  disbaleAggregationType: boolean = false
) => {
  if (!styleOptions?.useThresholdColor) return [];
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
    ...(!disbaleAggregationType ? { aggregate: styleOptions?.bucket?.aggregationType } : {}),
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

export const buildValueMappingColorEncoding = (
  styleOptions: Partial<BarChartStyle>,
  valueMappings?: ValueMapping[],
  rangeMappings?: ValueMapping[]
) => {
  if (
    styleOptions?.colorModeOption === 'none' ||
    (!rangeMappings?.length && !valueMappings?.length)
  )
    return [];

  const colorLayer = {
    field: 'mappingValue',
    type: 'nominal',
    scale: decideScale(styleOptions?.colorModeOption, rangeMappings, valueMappings),
    legend: styleOptions.addLegend
      ? {
          labelExpr: generateLabelExpr(rangeMappings, valueMappings, styleOptions?.colorModeOption),
          orient: styleOptions.legendPosition?.toLowerCase() || 'right',
          title: 'Mappings',
        }
      : null,
  };

  return colorLayer;
};

export const processData = ({
  transformedData,
  categoricalColumn,
  numericalColumn,
  transformedCalculationMethod,
  valueMappings,
  rangeMappings,
  categoricalColumn2,
}: {
  transformedData: Array<Record<string, any>>;
  categoricalColumn: string | undefined;
  numericalColumn: string | undefined;
  transformedCalculationMethod: CalculationMethod | undefined;
  valueMappings: ValueMapping[] | undefined;
  rangeMappings: ValueMapping[] | undefined;
  categoricalColumn2?: string | undefined;
}) => {
  // const groups = categoricalColumn
  //   ? groupBy(transformedData, (item) => {
  //       if (categoricalColumn2) {
  //         return [item[categoricalColumn], item[categoricalColumn2]].join('+');
  //       }
  //       return item[categoricalColumn];
  //     })
  //   : [];

  let newRecord = [];

  if (transformedCalculationMethod) {
    const groups = categoricalColumn
      ? groupBy(transformedData, (item) => {
          if (categoricalColumn2) {
            return [item[categoricalColumn], item[categoricalColumn2]].join('+');
          }
          return item[categoricalColumn];
        })
      : [];
    for (const g1 of Object.values(groups)) {
      if (numericalColumn) {
        const calculate = calculateValue(
          g1.map((d) => d[numericalColumn]),
          transformedCalculationMethod
        );
        const isValidNumber =
          calculate !== undefined && typeof calculate === 'number' && !isNaN(calculate);

        newRecord.push({
          ...g1[0],
          [numericalColumn]: isValidNumber ? calculate : null,
        });
      }
    }
  } else {
    newRecord = [...transformedData];
  }

  const numericalOptions = Array.from(new Set(newRecord.map((t) => t[numericalColumn!])));

  const categorical2Options = categoricalColumn2
    ? Array.from(new Set(newRecord.map((t) => t[categoricalColumn2!])))
    : null;

  const validValues = valueMappings?.filter((r) => {
    if (!r.value) return false;
    return numericalOptions.includes(Number(r.value));
  });

  const validRanges = new Set<ValueMapping>();

  newRecord = newRecord.map((record) => {
    const value = record[numericalColumn!];
    const matchingRange = rangeMappings?.find((r) => {
      if (!r.range || r.range?.min === undefined) return false;
      if (value && value >= r.range.min && value < (r.range.max ?? Infinity)) {
        validRanges.add(r);
        return true;
      }
      return false;
    });

    return {
      ...record,
      mergedLabel: matchingRange
        ? `[${matchingRange?.range?.min},${matchingRange?.range?.max ?? '∞'})`
        : null,
    };
  });

  return { newRecord, validValues, validRanges: Array.from(validRanges), categorical2Options };
};

export const buildCombinedScale = (
  canUseValueMapping: boolean | undefined,
  categorical2Options: any[] | null,
  validValues?: ValueMapping[],
  validRanges?: ValueMapping[]
) => {
  if (!canUseValueMapping) {
    return {
      domain: categorical2Options,
      range: (categorical2Options ?? []).map((c, i) => getCategoryNextColor(i)),
    };
  }
  const usingRanges = validRanges && validRanges?.length > 0 && validValues?.length === 0;
  const items = (usingRanges ? validRanges : validValues) ?? [];

  const labels = [
    ...(categorical2Options ?? []),
    ...(usingRanges
      ? items.map((m) => `[${m.range?.min},${m.range?.max ?? '∞'})`)
      : items.map((m) => m.value)),
  ];

  const colors = [
    ...(categorical2Options ?? []).map((c, i) => getCategoryNextColor(i)),
    ...items.map((m, i) => resolveColor(m.color) || getCategoryNextColor(i)),
  ];

  return {
    domain: labels,
    range: colors,
  };
};
