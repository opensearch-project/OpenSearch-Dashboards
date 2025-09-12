/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  StandardAxes,
  ColorSchemas,
  AxisRole,
  Positions,
  VisFieldType,
  VisColumn,
  AxisColumnMappings,
  AxisSupportedStyles,
  Threshold,
} from '../types';

export const applyAxisStyling = (
  axis?: VisColumn,
  axisStyle?: StandardAxes,
  disableGrid?: boolean
): any => {
  const gridEnabled = disableGrid ? false : axisStyle?.grid.showLines ?? true;

  const fullAxisConfig: any = {
    // Grid settings
    grid: gridEnabled,
    labelSeparation: 8,
  };

  // Apply position

  fullAxisConfig.orient = axisStyle?.position;

  // Apply title settings
  fullAxisConfig.title = axisStyle?.title.text;

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
    if (!axisStyle?.labels.show) {
      fullAxisConfig.labels = false;
    } else {
      fullAxisConfig.labels = true;
      // Apply label rotation/alignment
      if (axisStyle?.labels.rotate !== undefined) {
        fullAxisConfig.labelAngle = axisStyle?.labels.rotate;
      }

      // Apply label truncation
      if (axisStyle?.labels.truncate !== undefined && axisStyle?.labels.truncate > 0) {
        fullAxisConfig.labelLimit = axisStyle?.labels.truncate;
      }

      // Apply label filtering (this controls overlapping labels)
      fullAxisConfig.labelOverlap = 'greedy';
    }
  }

  return fullAxisConfig;
};

export function getAxisByRole(
  axes: StandardAxes[],
  axisRole: AxisRole.X | AxisRole.Y
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
  styles: Partial<AxisSupportedStyles>,
  axisColumnMappings?: AxisColumnMappings
): {
  xAxis?: VisColumn;
  yAxis?: VisColumn;
  xAxisStyle?: StandardAxes;
  yAxisStyle?: StandardAxes;
} => {
  const xAxis = axisColumnMappings?.x;
  const yAxis = axisColumnMappings?.y;

  const xAxisStyle = getAxisByRole(styles.standardAxes ?? [], AxisRole.X);
  const yAxisStyle = getAxisByRole(styles.standardAxes ?? [], AxisRole.Y);

  if (!styles?.switchAxes) {
    return { xAxis, xAxisStyle, yAxis, yAxisStyle };
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
