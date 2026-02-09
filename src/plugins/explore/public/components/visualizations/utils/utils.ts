/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mergeWith, isPlainObject } from 'lodash';
import {
  StandardAxes,
  ColorSchemas,
  AxisRole,
  Positions,
  VisFieldType,
  VisColumn,
  AxisColumnMappings,
  Threshold,
  AxisConfig,
  ThresholdOptions,
  ThresholdMode,
} from '../types';
import { ChartStyles, StyleOptions } from './use_visualization_types';

export const applyAxisStyling = ({
  axis,
  axisStyle,
  disableGrid,
  defaultAxisTitle = '',
}: {
  axis?: VisColumn;
  axisStyle?: StandardAxes;
  disableGrid?: boolean;
  defaultAxisTitle?: string;
}): AxisConfig => {
  const gridEnabled = disableGrid ? false : axisStyle?.grid.showLines ?? true;

  const fullAxisConfig: AxisConfig = {
    // Grid settings
    grid: gridEnabled,
    labelSeparation: 8,
    orient: axisStyle?.position,
    title: axisStyle?.title.text || defaultAxisTitle,
  };

  // Apply axis visibility
  if (!axisStyle?.show) {
    fullAxisConfig.title = null;
    fullAxisConfig.labels = false;
    fullAxisConfig.ticks = false;
    fullAxisConfig.domain = false;
    return fullAxisConfig;
  }

  // Apply label settings
  if (axisStyle?.labels) {
    fullAxisConfig.labels = !!axisStyle.labels.show;
    if (fullAxisConfig.labels) {
      fullAxisConfig.labelAngle = 0;
      fullAxisConfig.labelLimit = 100;

      if (axisStyle.labels.rotate !== undefined) {
        fullAxisConfig.labelAngle = axisStyle.labels.rotate;
      }
      if (axisStyle.labels.truncate !== undefined && axisStyle.labels.truncate > 0) {
        fullAxisConfig.labelLimit = axisStyle.labels.truncate;
      }

      fullAxisConfig.labelOverlap = 'greedy';
      fullAxisConfig.labelFlush = false;
    }
  }

  // Apply time formatting for date/time axes
  if (axis?.schema === VisFieldType.Date) {
    // Configure time formats for different granularities using 24-hour format for better clarity.
    // Each format corresponds to the appropriate time precision:
    // - hours: Display hours and minutes (HH:MM)
    // - minutes: Display hours and minutes (HH:MM)
    // - seconds: Display full time with seconds (HH:MM:SS)
    // - milliseconds: Display full time with milliseconds (HH:MM:SS.mmm)
    // Using %H (24-hour) instead of %I (12-hour) provides clearer, unambiguous time representation
    fullAxisConfig.format = {
      hours: '%H:%M',
      minutes: '%H:%M',
      seconds: '%H:%M:%S',
      milliseconds: '%H:%M:%S.%L',
    };
  }

  return fullAxisConfig;
};

export function getAxisByRole(
  axes: StandardAxes[],
  axisRole: AxisRole.X | AxisRole.Y | AxisRole.Y_SECOND
): StandardAxes | undefined {
  return axes.find((axis) => axis.axisRole === axisRole);
}

export function generateColorBySchema(count: number, schema: ColorSchemas): string[] {
  const colors: string[] = [];

  // Define RGB gradient start and end for each schema
  const colorRanges: Record<
    ColorSchemas,
    { start: [number, number, number]; end: [number, number, number] }
  > = {
    [ColorSchemas.BLUES]: { start: [173, 216, 230], end: [0, 0, 51] },
    [ColorSchemas.GREENS]: { start: [204, 255, 204], end: [0, 51, 0] },
    [ColorSchemas.GREYS]: { start: [240, 240, 240], end: [51, 51, 51] },
    [ColorSchemas.REDS]: { start: [255, 204, 204], end: [102, 0, 0] },
    [ColorSchemas.YELLOWORANGE]: { start: [255, 255, 204], end: [204, 102, 0] },
    [ColorSchemas.GREENBLUE]: { start: [204, 255, 204], end: [0, 0, 51] },
  };

  const range = colorRanges[schema];
  if (!range) return colors;

  const [startR, startG, startB] = range.start;
  const [endR, endG, endB] = range.end;

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const r = Math.round(startR + (endR - startR) * t);
    const g = Math.round(startG + (endG - startG) * t);
    const b = Math.round(startB + (endB - startB) * t);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
      .toString(16)
      .padStart(2, '0')}`;
    colors.push(hex);
  }
  return colors;
}

export function swapAxes(axes: StandardAxes[]) {
  return axes.map((axis) => {
    if (axis.axisRole === AxisRole.Y) {
      return {
        ...axis,
        axisRole: AxisRole.X,
        position:
          axis.position === Positions.LEFT
            ? Positions.BOTTOM
            : axis.position === Positions.RIGHT
            ? Positions.TOP
            : axis.position,
      };
    }

    if (axis.axisRole === AxisRole.X) {
      return {
        ...axis,
        axisRole: AxisRole.Y,
        position:
          axis.position === Positions.BOTTOM
            ? Positions.LEFT
            : axis.position === Positions.TOP
            ? Positions.RIGHT
            : axis.position,
      };
    }
    return axis;
  });
}

const positionSwapMap: Record<Positions, Positions> = {
  [Positions.LEFT]: Positions.BOTTOM,
  [Positions.RIGHT]: Positions.TOP,
  [Positions.BOTTOM]: Positions.LEFT,
  [Positions.TOP]: Positions.RIGHT,
};

const swapPosition = (pos: Positions): Positions => positionSwapMap[pos] ?? pos;

export const getSwappedAxisRole = (
  styles: { standardAxes?: StandardAxes[]; switchAxes?: boolean },
  axisColumnMappings?: AxisColumnMappings
): {
  xAxis?: VisColumn;
  yAxis?: VisColumn;
  y2Axis?: VisColumn;
  xAxisStyle?: StandardAxes;
  yAxisStyle?: StandardAxes;
  y2AxisStyle?: StandardAxes;
} => {
  const xAxis = axisColumnMappings?.x;
  const yAxis = axisColumnMappings?.y;
  const y2Axis = axisColumnMappings?.y2;

  const xAxisStyle = getAxisByRole(styles.standardAxes ?? [], AxisRole.X);
  const yAxisStyle = getAxisByRole(styles.standardAxes ?? [], AxisRole.Y);
  const y2AxisStyle = getAxisByRole(styles.standardAxes ?? [], AxisRole.Y_SECOND);

  if (!styles?.switchAxes) {
    return { xAxis, xAxisStyle, yAxis, yAxisStyle, ...(y2Axis && { y2Axis, y2AxisStyle }) };
  }

  return {
    xAxis: yAxis,
    xAxisStyle: yAxisStyle
      ? {
          ...yAxisStyle,
          ...(yAxisStyle?.position ? { position: swapPosition(yAxisStyle.position) } : undefined),
        }
      : undefined,
    yAxis: xAxis,
    yAxisStyle: xAxisStyle
      ? {
          ...xAxisStyle,
          ...(xAxisStyle?.position ? { position: swapPosition(xAxisStyle.position) } : undefined),
        }
      : undefined,
    ...(y2Axis && { y2Axis, y2AxisStyle }), // switch axes won't apply to y2(line-bar chart)
  };
};

export const getSchemaByAxis = (
  axis?: VisColumn
): 'quantitative' | 'nominal' | 'temporal' | 'unknown' => {
  switch (axis?.schema) {
    case VisFieldType.Numerical:
      return 'quantitative';
    case VisFieldType.Categorical:
      return 'nominal';
    case VisFieldType.Date:
      return 'temporal';
    default:
      return 'unknown';
  }
};

export const getAxisType = (axis?: VisColumn) => {
  switch (axis?.schema) {
    case VisFieldType.Numerical:
      return 'value';
    case VisFieldType.Categorical:
      return 'category';
    case VisFieldType.Date:
      return 'time';
    default:
      return 'unknown';
  }
};

export const timeUnitToFormat: { [key: string]: string } = {
  year: '%Y',
  quarter: '%Y Q%q',
  month: '%b %Y',
  week: '%b %d, %Y',
  day: '%b %d, %Y',
  hour: '%b %d, %Y %H:%M',
  minute: '%b %d, %Y %H:%M',
  second: '%b %d, %Y %H:%M:%S',
};

/**
 * Infers the time unit from timestamps in the data.
 * @param data The transformed data array
 * @param field The field name for the temporal axis
 * @returns The inferred time unit or null if insufficient valid timestamps
 */
export const inferTimeUnitFromTimestamps = (
  data: Array<Record<string, any>>,
  field: string | undefined
): string | null => {
  if (!data || data.length === 0 || !field) {
    return null;
  }

  const timestamps = data
    .map((row) => new Date(row[field]).getTime())
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);

  if (timestamps.length < 2) {
    return null;
  }

  let minDiff = Number.MAX_SAFE_INTEGER;
  for (let i = 1; i < timestamps.length; i++) {
    const diff = timestamps[i] - timestamps[i - 1];
    if (diff > 0 && diff < minDiff) {
      minDiff = diff;
    }
  }

  const seconds = minDiff / 1000;

  if (seconds < 60) return 'second';
  if (seconds < 3600) return 'minute';
  if (seconds < 86400) return 'hour';
  if (seconds < 604800) return 'day';
  if (seconds < 2678400) return 'week';
  if (seconds < 31536000) return 'month';
  return 'year';
};

/**
 * Determines the tooltip format for a temporal axis based on the inferred time unit.
 * @param data The transformed data array
 * @param field The field name for the temporal axis
 * @param fallback The fallback format string (default: '%b %d, %Y %H:%M:%S')
 * @returns The format string for the tooltip
 */
export const getTooltipFormat = (
  data: Array<Record<string, any>>,
  field: string | undefined,
  fallback = '%b %d, %Y %H:%M:%S'
): string => {
  const timeUnit = inferTimeUnitFromTimestamps(data, field);
  return timeUnit ? timeUnitToFormat[timeUnit] ?? fallback : fallback;
};

/**
 * Determines the color for a value based on a set of thresholds.
 * @param value - The value to evaluate (e.g., a number, string, or any type that can be converted to a number).
 * @param thresholds - Array of threshold objects with `value` (number) and `color` (string) properties.
 * @returns The matched threshold
 */
export function getThresholdByValue<T>(
  value: any,
  thresholds: Threshold[] = []
): Threshold | undefined {
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return undefined;
  }

  // Sort thresholds in descending order
  const sortedThresholds = [...thresholds].sort((a, b) => b.value - a.value);

  // Find the first threshold where the value is greater than or equal to the threshold value
  for (const threshold of sortedThresholds) {
    if (numValue >= threshold.value) {
      return threshold;
    }
  }

  return undefined;
}

export const mergeStyles = (dest: ChartStyles, source: StyleOptions | undefined) => {
  const copiedDest = { ...dest };

  function customMerge(objValue: any, srcValue: any) {
    if (isPlainObject(objValue) && isPlainObject(srcValue)) {
      // Deep merge nested objects
      const merged = { ...objValue };

      // Iterate through all keys in srcValue
      Object.keys(srcValue).forEach((key) => {
        if (isPlainObject(objValue[key]) && isPlainObject(srcValue[key])) {
          // Recursively merge nested objects
          merged[key] = customMerge(objValue[key], srcValue[key]);
        } else if (srcValue[key] !== undefined) {
          // Only override if srcValue[key] is not undefined
          merged[key] = srcValue[key];
        }
      });

      return merged;
    }

    // For non-objects or if one of the values is not an object,
    // return srcValue if it's not undefined, otherwise keep objValue
    return srcValue !== undefined ? srcValue : objValue;
  }

  return mergeWith(copiedDest, source, customMerge);
};

export function applyTimeRangeToEncoding(
  mainLayerEncoding?: any,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string },
  switchAxes: boolean = false
): void {
  if (!axisColumnMappings || !timeRange?.from || !timeRange?.to || !mainLayerEncoding) {
    return;
  }

  const timeAxisEntry = Object.entries(axisColumnMappings).find(
    ([, col]) => getSchemaByAxis(col) === 'temporal'
  );

  if (!timeAxisEntry) return;

  const [axisRole] = timeAxisEntry as [AxisRole, VisColumn];
  const targetRole = axisRole === AxisRole.X ? (switchAxes ? 'y' : 'x') : switchAxes ? 'x' : 'y';

  // Check if the time field has timezone information or is UTC format
  const hasTimezoneInfo = (timeString: string) => {
    return (
      timeString.includes('T') &&
      (timeString.endsWith('Z') || timeString.includes('+') || timeString.includes('-'))
    );
  };

  // Smart time processing: preserve UTC fields as strings, convert timezone-aware fields to UTC objects
  const processTimeValue = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso; // fallback: let Vega-Lite parse string

    // For UTC fields (format: "2025-09-25 18:19:02.49"), keep as string to let Vega-Lite handle naturally
    if (!hasTimezoneInfo(iso)) {
      return iso;
    }

    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      date: d.getUTCDate(),
      hours: d.getUTCHours(),
      minutes: d.getUTCMinutes(),
      seconds: d.getUTCSeconds(),
      milliseconds: d.getUTCMilliseconds(),
      utc: true,
    };
  };

  const scaleConfig = {
    domain: [processTimeValue(timeRange.from), processTimeValue(timeRange.to)],
  };

  if (mainLayerEncoding[targetRole]) {
    mainLayerEncoding[targetRole].scale = {
      ...(mainLayerEncoding[targetRole].scale || {}),
      ...scaleConfig,
    };
  }
}

/**
 * Parses a date string or timestamp as a Date object
 *
 * Behavior:
 * - Numbers: Treated as Unix timestamps and passed directly to Date constructor
 * - Strings with timezone info (Z, +HH:MM, -HH:MM): Parsed directly as-is
 * - Strings without timezone info: Treated as UTC by converting to ISO format and appending 'Z'
 *
 * @param input - Date string (with or without timezone) or Unix timestamp (number)
 * @returns Date object
 *
 * @example
 * parseUTCDate(1704067200000) // Unix timestamp -> Date object
 * parseUTCDate("2025-12-10 00:00:00") // No timezone -> Treats as UTC: 2025-12-10T00:00:00Z
 * parseUTCDate("2025-12-10T00:00:00") // No timezone -> Treats as UTC: 2025-12-10T00:00:00Z
 * parseUTCDate("2025-12-10T00:00:00Z") // Already has timezone -> Parses directly
 * parseUTCDate("2025-12-10T00:00:00+08:00") // Already has timezone -> Parses directly
 */
export function parseUTCDate(input: string | number): Date {
  if (typeof input === 'number') {
    return new Date(input);
  }
  // If already has timezone info (Z, +, or -), parse directly
  if (input.includes('Z') || /[+-]\d{2}:\d{2}$/.test(input)) {
    return new Date(input);
  }

  // Convert space to 'T' for ISO 8601 format and add 'Z' for UTC
  const isoString = input.replace(' ', 'T') + 'Z';
  return new Date(isoString);
}

export const getChartRender = () => {
  try {
    const chartRender = localStorage.getItem('__DEVELOPMENT__.discover.vis.render');
    return chartRender || 'echarts';
  } catch (e) {
    return 'echarts';
  }
};

export const convertThresholds = (thresholds: Threshold[]) => {
  return thresholds.map((t, i) => ({
    min: t.value,
    max: i === thresholds.length - 1 ? Infinity : thresholds[i + 1].value,

    color: t.color,
  }));
};

export const convertThresholdLineStyle = (style: ThresholdMode | undefined) => {
  if (style === ThresholdMode.DotDashed) return 'dotted';
  return style;
};

export const adjustOppositeSymbol = (switchAxes: boolean, symbol: string) => {
  if (switchAxes) {
    return symbol === 'x' ? 'y' : 'x';
  }
  return symbol;
};

export const generateThresholdSteps = (
  thresholds: Threshold[] | undefined,
  switchAxes?: boolean
) => {
  return thresholds?.map((t) => ({
    [switchAxes ? 'xAxis' : 'yAxis']: t.value,
    itemStyle: { color: t.color },
  }));
};

export const generateThresholdLines = (
  thresholdOptions: ThresholdOptions,
  switchAxes?: boolean
) => {
  if (thresholdOptions.thresholdStyle === ThresholdMode.Off) return {};

  const ThresholdSteps = generateThresholdSteps(thresholdOptions.thresholds, switchAxes);

  return {
    markLine: {
      symbol: 'none',
      silent: true,
      animation: false,
      lineStyle: {
        width: 1,
        type: convertThresholdLineStyle(thresholdOptions?.thresholdStyle),
      },
      data: ThresholdSteps,
    },
  };
};

// return a combined markline with threshold lines and time marker
export const composeMarkLine = (thresholdOptions: ThresholdOptions, addTimeMarker: boolean) => {
  const hasThresholds = thresholdOptions?.thresholdStyle !== ThresholdMode.Off;

  if (!hasThresholds && !addTimeMarker) return {};

  const data = [];

  if (hasThresholds) {
    const thresholdSteps = generateThresholdSteps(thresholdOptions?.thresholds) ?? [];
    data.push(...thresholdSteps);
  }

  if (addTimeMarker) {
    data.push({
      xAxis: new Date(),
      itemStyle: { color: 'red' },
      lineStyle: { type: 'dashed' },
      label: { formatter: new Date().toISOString(), align: 'right' },
    });
  }

  return {
    markLine: {
      symbol: 'none',
      animation: false,
      lineStyle: {
        width: 2,
        type: convertThresholdLineStyle(thresholdOptions?.thresholdStyle),
      },
      data,
    },
  };
};

export const getValueColorByThreshold = (value: number, thresholdOptions: ThresholdOptions) => {
  const thresholds = thresholdOptions.thresholds ?? [];
  let color = thresholdOptions.baseColor;
  let curr = -Infinity;

  for (const threshold of thresholds) {
    if (value > curr && value > threshold.value) {
      color = threshold.color;
      curr = threshold.value;
    }
  }
  return color;
};
