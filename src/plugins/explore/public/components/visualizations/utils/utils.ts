/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import DOMPurify from 'dompurify';
import { escape } from 'lodash';
import { mergeWith, isPlainObject } from 'lodash';
import {
  StandardAxes,
  AxisRole,
  VisFieldType,
  VisColumn,
  Threshold,
  AxisConfig,
  ThresholdOptions,
  ThresholdMode,
  StackMode,
} from '../types';
import { ChartStyles, StyleOptions } from './use_visualization_types';
import { BaseChartStyle, PipelineFn } from './echarts_spec';
import { resolveStackMode, formatDecimal } from './data_transformation';
import { formatUnitValue } from '../style_panel/unit/collection';

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
  const gridEnabled = disableGrid ? false : (axisStyle?.grid.showLines ?? true);

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

function getAxisByRole(
  axes: StandardAxes[],
  axisRole: AxisRole.X | AxisRole.Y | AxisRole.Y_SECOND
): StandardAxes | undefined {
  return axes.find((axis) => axis.axisRole === axisRole);
}

interface AxisStyleConfig {
  xAxisStyle?: StandardAxes;
  yAxisStyle?: StandardAxes;
  y2AxisStyle?: StandardAxes;
}

export const getAxisConfig = (styles: { standardAxes?: StandardAxes[] }): AxisStyleConfig => {
  const xAxisStyle = getAxisByRole(styles.standardAxes ?? [], AxisRole.X);
  const yAxisStyle = getAxisByRole(styles.standardAxes ?? [], AxisRole.Y);
  const y2AxisStyle = getAxisByRole(styles.standardAxes ?? [], AxisRole.Y_SECOND);

  return { xAxisStyle, yAxisStyle, y2AxisStyle };
};

export const getColumnsFromAxisColumnMapping = (axisColumnMappings: {
  [K in AxisRole]?: VisColumn | VisColumn[];
}) => {
  const allColumns = [
    ...Object.values(axisColumnMappings ?? {}).flatMap((cols) =>
      Array.isArray(cols) ? cols.map((col) => col.column) : [cols.column]
    ),
  ];
  return allColumns;
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

export const convertThresholds = (thresholds: Threshold[]) => {
  return thresholds.map((t, i) => ({
    min: t.value,
    max: i === thresholds.length - 1 ? Infinity : thresholds[i + 1].value,

    color: t.color,
  }));
};

const convertThresholdLineStyle = (style: ThresholdMode | undefined) => {
  if (style === ThresholdMode.DotDashed) return 'dotted';
  return style;
};

const generateThresholdSteps = (thresholds: Threshold[] | undefined) => {
  return thresholds?.map((t) => ({
    yAxis: t.value,
    itemStyle: { color: t.color },
  }));
};

export const generateThresholdLines = (thresholdOptions: ThresholdOptions) => {
  if (thresholdOptions.thresholdStyle === ThresholdMode.Off) return {};

  const ThresholdSteps = generateThresholdSteps(thresholdOptions.thresholds);

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

const getFirstColumn = (axis?: VisColumn | VisColumn[]): VisColumn | undefined =>
  Array.isArray(axis) ? axis[0] : axis;

/**
 * apply percentage range to axis
 */
export const applyPercentageAxis =
  <T extends BaseChartStyle>(styles: { stackMode?: StackMode | undefined }): PipelineFn<T> =>
  (state) => {
    if (resolveStackMode(styles) !== 'percentage') return state;

    const { transformedData = [], axisColumnMappings, xAxisConfig, yAxisConfig } = state;
    const [, ...rows] = transformedData;
    const xSchema = getFirstColumn(axisColumnMappings?.[AxisRole.X])?.schema;
    const ySchema = getFirstColumn(axisColumnMappings?.[AxisRole.Y])?.schema;
    const isXNumerical = xSchema === VisFieldType.Numerical && ySchema !== VisFieldType.Numerical;

    const hasNegativeValue = rows.some((row: any[]) =>
      row.some((data) => typeof data === 'number' && data < 0)
    );

    const toPercentageAxis = (axisConfig: any) => ({
      ...axisConfig,
      // Respect a user-set min/max
      min: axisConfig?.min ?? (hasNegativeValue ? -1 : 0),
      max: axisConfig?.max ?? 1,
      axisLabel: {
        ...axisConfig?.axisLabel,
        formatter: (value: unknown) => formatSeriesValueLabel(value, true),
      },
    });

    // multi y series
    const toPercentageAxes = (axisConfig: any) =>
      Array.isArray(axisConfig) ? axisConfig.map(toPercentageAxis) : toPercentageAxis(axisConfig);

    const toPercentageTooltip = (baseConfig: any) => ({
      ...baseConfig,
      tooltip: {
        ...baseConfig?.tooltip,
        valueFormatter: (value: unknown) =>
          Array.isArray(value)
            ? value.map((item) => formatSeriesValueLabel(item, true)).join(' ')
            : formatSeriesValueLabel(value, true),
      },
    });

    const baseConfig = toPercentageTooltip(state.baseConfig);

    return isXNumerical
      ? { ...state, baseConfig, xAxisConfig: toPercentageAxes(xAxisConfig) }
      : { ...state, baseConfig, yAxisConfig: toPercentageAxes(yAxisConfig) };
  };

/**
 * Format a series value for display as a label drawn on a mark (e.g. on a bar).
 */
export const formatSeriesValueLabel = (
  value: unknown,
  isPercentage = false,
  decimals?: number
): string => {
  if (value === null || value === undefined || value === '') return '';

  const numericValue = Number(value);
  // Non numeric values are shown as-is rather than as `NaN`
  if (!Number.isFinite(numericValue)) return String(value);

  const valueWithDecimals = formatDecimal(
    isPercentage ? numericValue * 100 : numericValue,
    decimals
  );

  return isPercentage ? `${valueWithDecimals}%` : valueWithDecimals;
};

export const getNormalizedAxisConfig = (
  axisColumnMappings:
    | { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn[] }
    | { [AxisRole.X]: VisColumn[]; [AxisRole.Y]: VisColumn }
) => {
  let categoryField = '';
  let categoryFieldName = '';
  let seriesFields: string[] = [];
  let seriesFieldNames: string[] = [];
  let categoryEncode: 'x' | 'y' = 'x';
  let seriesEncode: 'x' | 'y' = 'y';

  if (!Array.isArray(axisColumnMappings.y) && Array.isArray(axisColumnMappings.x)) {
    categoryField = axisColumnMappings.y.column;
    categoryFieldName = axisColumnMappings.y.name;
    seriesFields = axisColumnMappings.x.map((col) => col.column);
    seriesFieldNames = axisColumnMappings.x.map((col) => col.name);
    categoryEncode = 'y';
    seriesEncode = 'x';
  }
  if (Array.isArray(axisColumnMappings.y) && !Array.isArray(axisColumnMappings.x)) {
    categoryField = axisColumnMappings.x.column;
    categoryFieldName = axisColumnMappings.x.name;
    seriesFields = axisColumnMappings.y.map((col) => col.column);
    seriesFieldNames = axisColumnMappings.y.map((col) => col.name);
    categoryEncode = 'x';
    seriesEncode = 'y';
  }
  return {
    categoryField,
    categoryFieldName,
    categoryEncode,
    seriesFields,
    seriesFieldNames,
    seriesEncode,
  };
};

export const escapeTooltipText = (value: unknown) => escape(String(value ?? ''));

export const sanitizeTooltipHtml = (html: string) => DOMPurify.sanitize(html);

export interface TooltipFormatParams<T extends BaseChartStyle = BaseChartStyle> {
  styles: T;
  seriesDisplayNames?: Record<string, string>;
  formatValue: (value: unknown) => string;
}

export type TooltipFormatFn = (params: TooltipFormatParams) => (echartsParams: any) => string;

export const valueUnitFormatter = <T extends BaseChartStyle>(styles: T, hasUnit: boolean) => {
  return (value: unknown) =>
    hasUnit && typeof value === 'number'
      ? formatUnitValue(value, styles.unitId, styles.decimals, styles.unitSuffix)
      : String(value ?? '');
};

/**
 * Use this formatter when you have seriesDisplayName map only for time-series chart
 */
export const seriesDisplayNameTooltipFormatter: TooltipFormatFn =
  ({ seriesDisplayNames, formatValue }) =>
  (params: any) => {
    const rows = Array.isArray(params) ? params : [params];
    const lines = rows.map((p: any) => {
      const seriesIndex = p.seriesIndex;
      const seriesName = p.seriesName;
      const label = seriesDisplayNames?.[seriesName] ?? seriesName;
      // ignore value[0] which is axis x
      const valueRaw = p.value.slice(1);
      return `${p.marker ?? ''}${escapeTooltipText(label)}: ${escapeTooltipText(
        formatValue(valueRaw[seriesIndex])
      )}`;
    });
    return sanitizeTooltipHtml(lines.join('<br/>'));
  };

export const axisDisplayNameTooltipFormatter: TooltipFormatFn =
  ({ seriesDisplayNames }) =>
  (params: any) => {
    // 0 is categorical field, 1 is value field
    const label = seriesDisplayNames?.[params[0].value[0]] ?? [params[0].value[0]];
    return sanitizeTooltipHtml(
      [
        `<strong>${escapeTooltipText(label)}</strong>`,
        `${params[0].marker ?? ''}${escapeTooltipText(params[0].seriesName)}: ${escapeTooltipText(params[0].value[1])}`,
      ]
        .filter(Boolean)
        .join('<br/>')
    );
  };

export const pieDisplayNameTooltipFormatter: TooltipFormatFn =
  ({ seriesDisplayNames }) =>
  (params: any) => {
    const displayName = seriesDisplayNames?.[params.name] ?? params.name;
    return sanitizeTooltipHtml(
      `${params.marker ?? ''}<strong>${escapeTooltipText(displayName)}</strong>: ${escapeTooltipText(params.value)}`
    );
  };
